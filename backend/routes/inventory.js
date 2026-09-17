const express = require('express');
const { body, validationResult } = require('express-validator');
const dbModule = require('../db/database');
const { authMiddleware, adminOnly, staffOrAdmin } = require('../middleware/auth');

const router = express.Router();

// Get all products
router.get('/', authMiddleware, staffOrAdmin, async (req, res) => {
    try {
        const { category, low_stock } = req.query;
        let query = 'SELECT * FROM products WHERE 1=1';
        const params = [];

        if (category) {
            query += ' AND category = ?';
            params.push(category);
        }

        if (low_stock) {
            query += ' AND quantity < min_stock';
        }

        query += ' ORDER BY name ASC';

        const products = await dbModule.all(query, params);
        res.json(products);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get single product
router.get('/:id', authMiddleware, async (req, res) => {
    try {
        const product = await dbModule.get(
            'SELECT * FROM products WHERE id = ?',
            [req.params.id]
        );
        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }
        res.json(product);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Search by barcode or SKU
router.get('/search/:query', authMiddleware, async (req, res) => {
    try {
        const { query } = req.params;
        const products = await dbModule.all(
            `SELECT * FROM products WHERE sku LIKE ? OR barcode LIKE ? OR name LIKE ?`,
            [`%${query}%`, `%${query}%`, `%${query}%`]
        );
        res.json(products);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create product (Admin only)
router.post('/', authMiddleware, adminOnly, [
    body('sku').notEmpty().withMessage('SKU required'),
    body('name').notEmpty().withMessage('Name required'),
    body('price').isFloat({ min: 0 }).withMessage('Valid price required'),
    body('quantity').isInt({ min: 0 }).withMessage('Valid quantity required')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { sku, name, description, category, price, quantity, min_stock, max_stock, supplier_id, barcode } = req.body;

    try {
        const result = await dbModule.run(
            `INSERT INTO products (sku, name, description, category, price, quantity, min_stock, max_stock, supplier_id, barcode)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [sku, name, description, category, price, quantity, min_stock || 10, max_stock || 1000, supplier_id, barcode]
        );

        res.status(201).json({ 
            message: 'Product created',
            id: result.lastID
        });
    } catch (error) {
        if (error.message.includes('UNIQUE')) {
            res.status(409).json({ error: 'SKU or barcode already exists' });
        } else {
            res.status(500).json({ error: error.message });
        }
    }
});

// Update product (Admin only)
router.put('/:id', authMiddleware, adminOnly, async (req, res) => {
    const { name, price, min_stock, max_stock, category, description } = req.body;
    const updates = [];
    const params = [];

    if (name) { updates.push('name = ?'); params.push(name); }
    if (price !== undefined) { updates.push('price = ?'); params.push(price); }
    if (min_stock !== undefined) { updates.push('min_stock = ?'); params.push(min_stock); }
    if (max_stock !== undefined) { updates.push('max_stock = ?'); params.push(max_stock); }
    if (category) { updates.push('category = ?'); params.push(category); }
    if (description) { updates.push('description = ?'); params.push(description); }

    if (updates.length === 0) {
        return res.status(400).json({ error: 'No updates provided' });
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    params.push(req.params.id);

    try {
        await dbModule.run(
            `UPDATE products SET ${updates.join(', ')} WHERE id = ?`,
            params
        );
        res.json({ message: 'Product updated' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete product (Admin only)
router.delete('/:id', authMiddleware, adminOnly, async (req, res) => {
    try {
        await dbModule.run('DELETE FROM products WHERE id = ?', [req.params.id]);
        res.json({ message: 'Product deleted' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Adjust stock
router.post('/:id/adjust-stock', authMiddleware, [
    body('quantity_change').isInt().withMessage('Valid integer required'),
    body('reason').notEmpty().withMessage('Reason required')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { quantity_change, reason } = req.body;

    try {
        // Update product quantity
        await dbModule.run(
            'UPDATE products SET quantity = quantity + ? WHERE id = ?',
            [quantity_change, req.params.id]
        );

        // Log stock movement
        await dbModule.run(
            'INSERT INTO stock_movements (product_id, quantity_change, movement_type, reason, user_id) VALUES (?, ?, ?, ?, ?)',
            [req.params.id, quantity_change, quantity_change > 0 ? 'IN' : 'OUT', reason, req.user.id]
        );

        res.json({ message: 'Stock adjusted' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
