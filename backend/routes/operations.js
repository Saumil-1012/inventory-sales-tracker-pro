const express = require('express');
const fs = require('fs');
const path = require('path');
const db = require('../db/database');
const { authMiddleware, adminOnly, staffOrAdmin } = require('../middleware/auth');

const router = express.Router();

router.get('/forecast', authMiddleware, staffOrAdmin, async (req, res) => {
    try {
        const days = Math.max(parseInt(req.query.days || '30', 10), 1);
        const horizon = Math.max(parseInt(req.query.horizon || '30', 10), 1);
        const products = await db.all(`
            SELECT p.id, p.name, p.sku, p.quantity, p.min_stock, p.reorder_quantity,
                COALESCE(SUM(s.quantity), 0) as units_sold
            FROM products p
            LEFT JOIN sales s ON s.product_id = p.id AND s.status = 'COMPLETED'
                AND s.created_at >= datetime('now', ? || ' days')
            GROUP BY p.id ORDER BY units_sold DESC
        `, [`-${days}`]);

        res.json({ days, horizon, products: products.map((product) => {
            const dailyDemand = product.units_sold / days;
            const forecastDemand = dailyDemand * horizon;
            const recommendedOrder = Math.max(0, Math.ceil(forecastDemand + product.min_stock - product.quantity));
            return {
                ...product,
                daily_demand: dailyDemand,
                forecast_demand: forecastDemand,
                recommended_order: recommendedOrder,
                stockout_in_days: dailyDemand > 0 ? product.quantity / dailyDemand : null,
                risk: product.quantity <= product.min_stock ? 'HIGH' : recommendedOrder > 0 ? 'MEDIUM' : 'LOW'
            };
        }) });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/reorders', authMiddleware, staffOrAdmin, async (req, res) => {
    try {
        res.json(await db.all(`
            SELECT rr.*, p.name as product_name, p.sku, s.name as supplier_name
            FROM reorder_requests rr
            JOIN products p ON p.id = rr.product_id
            JOIN suppliers s ON s.id = rr.supplier_id
            ORDER BY rr.created_at DESC
        `));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/reorders', authMiddleware, staffOrAdmin, async (req, res) => {
    const { product_id, supplier_id, quantity } = req.body;
    if (!product_id || !supplier_id || !quantity || quantity < 1) return res.status(400).json({ error: 'Product, supplier, and positive quantity are required' });
    try {
        const result = await db.run('INSERT INTO reorder_requests (product_id, supplier_id, quantity) VALUES (?, ?, ?)', [product_id, supplier_id, quantity]);
        db.audit(req.user.id, 'CREATE_REORDER', 'reorder_request', result.lastID, { product_id, supplier_id, quantity });
        res.status(201).json({ id: result.lastID, message: 'Reorder request created' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/audit-logs', authMiddleware, adminOnly, async (req, res) => {
    try {
        res.json(await db.all(`
            SELECT al.*, u.username FROM audit_logs al
            LEFT JOIN users u ON u.id = al.user_id
            ORDER BY al.created_at DESC LIMIT 200
        `));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/backup', authMiddleware, adminOnly, async (req, res) => {
    try {
        const source = path.resolve(process.env.DB_PATH || './data/inventory.db');
        const backupDirectory = path.join(path.dirname(source), 'backups');
        fs.mkdirSync(backupDirectory, { recursive: true });
        const filename = `inventory-${new Date().toISOString().replace(/[:.]/g, '-')}.db`;
        const destination = path.join(backupDirectory, filename);
        fs.copyFileSync(source, destination);
        db.audit(req.user.id, 'CREATE_BACKUP', 'database', null, { filename });
        res.json({ message: 'Backup created', filename });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/users', authMiddleware, adminOnly, async (req, res) => {
    try {
        res.json(await db.all('SELECT id, username, role, email, active, created_at FROM users ORDER BY username'));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.patch('/users/:id/role', authMiddleware, adminOnly, async (req, res) => {
    const { role } = req.body;
    if (!['ADMIN', 'MANAGER', 'STAFF', 'WAREHOUSE'].includes(role)) return res.status(400).json({ error: 'Invalid role' });
    try {
        await db.run('UPDATE users SET role = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [role, req.params.id]);
        db.audit(req.user.id, 'CHANGE_ROLE', 'user', Number(req.params.id), { role });
        res.json({ message: 'Role updated' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
