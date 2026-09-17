const express = require('express');
const { body, validationResult } = require('express-validator');
const { authMiddleware } = require('../middleware/auth');
const { getPool } = require('../db/postgres');

const router = express.Router();
router.use(authMiddleware);

router.get('/ingredients', async (req, res) => {
    try {
        const result = await getPool().query(
            `SELECT * FROM ingredients WHERE organization_id = $1 ORDER BY name`,
            [req.user.organizationId]
        );
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/ingredients', [
    body('name').trim().notEmpty(),
    body('sku').trim().notEmpty(),
    body('unit').trim().notEmpty(),
    body('cost_per_unit').isFloat({ min: 0 }),
    body('quantity').isFloat({ min: 0 })
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const { name, sku, unit, cost_per_unit, quantity, reorder_level = 0, expiry_date } = req.body;
    try {
        const result = await getPool().query(
            `INSERT INTO ingredients (organization_id, name, sku, unit, cost_per_unit, quantity, reorder_level, expiry_date)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
            [req.user.organizationId, name, sku, unit, cost_per_unit, quantity, reorder_level, expiry_date || null]
        );
        res.status(201).json(result.rows[0]);
    } catch (error) {
        res.status(error.code === '23505' ? 409 : 500).json({ error: error.message });
    }
});

router.get('/recipes', async (req, res) => {
    try {
        const result = await getPool().query(
            `SELECT r.id, r.name, r.selling_price,
                COALESCE(SUM(ri.quantity * i.cost_per_unit), 0) as food_cost,
                COALESCE(json_agg(json_build_object('ingredient_id', i.id, 'name', i.name, 'quantity', ri.quantity, 'unit', i.unit)) FILTER (WHERE i.id IS NOT NULL), '[]') as items
             FROM recipes r
             LEFT JOIN recipe_items ri ON ri.recipe_id = r.id
             LEFT JOIN ingredients i ON i.id = ri.ingredient_id
             WHERE r.organization_id = $1
             GROUP BY r.id ORDER BY r.name`,
            [req.user.organizationId]
        );
        res.json(result.rows.map((recipe) => ({
            ...recipe,
            food_cost: Number(recipe.food_cost),
            gross_profit: Number(recipe.selling_price) - Number(recipe.food_cost),
            margin_percent: Number(recipe.selling_price) ? ((Number(recipe.selling_price) - Number(recipe.food_cost)) / Number(recipe.selling_price)) * 100 : 0
        })));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/recipes', [body('name').trim().notEmpty(), body('selling_price').isFloat({ min: 0 }), body('items').isArray({ min: 1 })], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const { name, selling_price, menu_product_id, items } = req.body;
    const client = await getPool().connect();
    try {
        await client.query('BEGIN');
        const recipe = await client.query(
            `INSERT INTO recipes (organization_id, name, menu_product_id, selling_price) VALUES ($1, $2, $3, $4) RETURNING *`,
            [req.user.organizationId, name, menu_product_id || null, selling_price]
        );
        for (const item of items) {
            await client.query(
                `INSERT INTO recipe_items (recipe_id, ingredient_id, quantity)
                 SELECT $1, id, $3 FROM ingredients WHERE id = $2 AND organization_id = $4`,
                [recipe.rows[0].id, item.ingredient_id, item.quantity, req.user.organizationId]
            );
        }
        await client.query('COMMIT');
        res.status(201).json(recipe.rows[0]);
    } catch (error) {
        await client.query('ROLLBACK');
        res.status(500).json({ error: error.message });
    } finally {
        client.release();
    }
});

router.post('/waste', [body('quantity').isFloat({ min: 0.001 }), body('reason').trim().notEmpty()], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const { ingredient_id, product_id, quantity, reason } = req.body;
    if (!ingredient_id && !product_id) return res.status(400).json({ error: 'Ingredient or product is required' });
    try {
        let costPerUnit = 0;
        if (ingredient_id) {
            const ingredient = await getPool().query('SELECT cost_per_unit FROM ingredients WHERE id = $1 AND organization_id = $2', [ingredient_id, req.user.organizationId]);
            if (!ingredient.rows[0]) return res.status(404).json({ error: 'Ingredient not found' });
            costPerUnit = Number(ingredient.rows[0].cost_per_unit);
            await getPool().query('UPDATE ingredients SET quantity = quantity - $1 WHERE id = $2 AND organization_id = $3', [quantity, ingredient_id, req.user.organizationId]);
        }
        const result = await getPool().query(
            `INSERT INTO waste_events (organization_id, ingredient_id, product_id, quantity, reason, cost, recorded_by)
             VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
            [req.user.organizationId, ingredient_id || null, product_id || null, quantity, reason, quantity * costPerUnit, req.user.id]
        );
        res.status(201).json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/waste', async (req, res) => {
    try {
        const result = await getPool().query(
            `SELECT w.*, i.name as ingredient_name, u.username as recorded_by_name
             FROM waste_events w LEFT JOIN ingredients i ON i.id = w.ingredient_id
             LEFT JOIN users u ON u.id = w.recorded_by
             WHERE w.organization_id = $1 ORDER BY w.created_at DESC LIMIT 200`,
            [req.user.organizationId]
        );
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/report', async (req, res) => {
    try {
        const [ingredients, waste, recipes] = await Promise.all([
            getPool().query(`SELECT COUNT(*)::int as count, COALESCE(SUM(quantity * cost_per_unit), 0) as inventory_cost FROM ingredients WHERE organization_id = $1`, [req.user.organizationId]),
            getPool().query(`SELECT COUNT(*)::int as events, COALESCE(SUM(cost), 0) as waste_cost FROM waste_events WHERE organization_id = $1 AND created_at >= NOW() - INTERVAL '30 days'`, [req.user.organizationId]),
            getPool().query(`SELECT COUNT(*)::int as count, COALESCE(AVG((selling_price - food_cost) / NULLIF(selling_price, 0) * 100), 0) as average_margin FROM (SELECT r.selling_price, COALESCE(SUM(ri.quantity * i.cost_per_unit), 0) as food_cost FROM recipes r LEFT JOIN recipe_items ri ON ri.recipe_id = r.id LEFT JOIN ingredients i ON i.id = ri.ingredient_id WHERE r.organization_id = $1 GROUP BY r.id) recipe_costs`, [req.user.organizationId])
        ]);
        res.json({ period: '30 days', ingredients: ingredients.rows[0], waste: waste.rows[0], recipes: recipes.rows[0] });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/notifications', async (req, res) => {
    try {
        const result = await getPool().query(`SELECT * FROM organization_notification_settings WHERE organization_id = $1`, [req.user.organizationId]);
        res.json(result.rows[0] || { low_stock_enabled: true, waste_alerts_enabled: true, weekly_report_enabled: false, report_email: null });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.put('/notifications', async (req, res) => {
    const { low_stock_enabled = true, waste_alerts_enabled = true, weekly_report_enabled = false, report_email = null } = req.body;
    try {
        const result = await getPool().query(`
            INSERT INTO organization_notification_settings (organization_id, low_stock_enabled, waste_alerts_enabled, weekly_report_enabled, report_email)
            VALUES ($1, $2, $3, $4, $5)
            ON CONFLICT (organization_id) DO UPDATE SET low_stock_enabled = EXCLUDED.low_stock_enabled, waste_alerts_enabled = EXCLUDED.waste_alerts_enabled, weekly_report_enabled = EXCLUDED.weekly_report_enabled, report_email = EXCLUDED.report_email, updated_at = NOW()
            RETURNING *`,
            [req.user.organizationId, low_stock_enabled, waste_alerts_enabled, weekly_report_enabled, report_email]
        );
        res.json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
