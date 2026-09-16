const express = require('express');
const { body, validationResult } = require('express-validator');
const db = require('../db/database');
const { authMiddleware, staffOrAdmin } = require('../middleware/auth');

const router = express.Router();

// Record a sale
router.post('/', staffOrAdmin, [
    body('product_id').isInt().withMessage('Product ID required'),
    body('quantity').isInt({ min: 1 }).withMessage('Valid quantity required'),
    body('price_per_unit').isFloat({ min: 0 }).withMessage('Valid price required')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { product_id, quantity, price_per_unit } = req.body;
    const total_amount = quantity * price_per_unit;

    try {
        // Check if product exists and has sufficient stock
        const product = await db.get(
            'SELECT quantity FROM products WHERE id = ?',
            [product_id]
        );

        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }

        if (product.quantity < quantity) {
            return res.status(400).json({ error: 'Insufficient stock' });
        }

        // Record sale
        const result = await db.run(
            `INSERT INTO sales (product_id, quantity, price_per_unit, total_amount, user_id, status)
             VALUES (?, ?, ?, ?, ?, 'COMPLETED')`,
            [product_id, quantity, price_per_unit, total_amount, req.user.id]
        );

        // Deduct from inventory
        await db.run(
            'UPDATE products SET quantity = quantity - ? WHERE id = ?',
            [quantity, product_id]
        );

        // Log stock movement
        await db.run(
            'INSERT INTO stock_movements (product_id, quantity_change, movement_type, reason, user_id) VALUES (?, ?, ?, ?, ?)',
            [product_id, -quantity, 'SALE', `Sale ID: ${result.lastID}`, req.user.id]
        );

        res.status(201).json({ 
            message: 'Sale recorded',
            saleId: result.lastID,
            totalAmount: total_amount
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get all sales
router.get('/', staffOrAdmin, async (req, res) => {
    try {
        const { start_date, end_date, product_id } = req.query;
        let query = 'SELECT s.*, p.name as product_name, u.username FROM sales s JOIN products p ON s.product_id = p.id JOIN users u ON s.user_id = u.id WHERE 1=1';
        const params = [];

        if (start_date) {
            query += ' AND s.created_at >= ?';
            params.push(start_date);
        }

        if (end_date) {
            query += ' AND s.created_at <= ?';
            params.push(end_date);
        }

        if (product_id) {
            query += ' AND s.product_id = ?';
            params.push(product_id);
        }

        query += ' ORDER BY s.created_at DESC LIMIT 500';

        const sales = await db.all(query, params);
        res.json(sales);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get sales by date range
router.get('/report/:start_date/:end_date', staffOrAdmin, async (req, res) => {
    try {
        const { start_date, end_date } = req.params;
        
        const sales = await db.all(
            `SELECT DATE(s.created_at) as date, COUNT(*) as count, SUM(s.total_amount) as total
             FROM sales s
             WHERE DATE(s.created_at) BETWEEN ? AND ?
             GROUP BY DATE(s.created_at)
             ORDER BY date DESC`,
            [start_date, end_date]
        );

        res.json(sales);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Cancel sale (reverse transaction)
router.post('/:id/cancel', authMiddleware, async (req, res) => {
    try {
        const sale = await db.get(
            'SELECT product_id, quantity FROM sales WHERE id = ?',
            [req.params.id]
        );

        if (!sale) {
            return res.status(404).json({ error: 'Sale not found' });
        }

        // Update sale status
        await db.run(
            'UPDATE sales SET status = ? WHERE id = ?',
            ['CANCELLED', req.params.id]
        );

        // Restore inventory
        await db.run(
            'UPDATE products SET quantity = quantity + ? WHERE id = ?',
            [sale.quantity, sale.product_id]
        );

        // Log reversal
        await db.run(
            'INSERT INTO stock_movements (product_id, quantity_change, movement_type, reason, user_id) VALUES (?, ?, ?, ?, ?)',
            [sale.product_id, sale.quantity, 'REVERSAL', `Cancelled sale ID: ${req.params.id}`, req.user.id]
        );

        res.json({ message: 'Sale cancelled' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
