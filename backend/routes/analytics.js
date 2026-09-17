const express = require('express');
const dbModule = require('../db/database');
const { authMiddleware, staffOrAdmin } = require('../middleware/auth');

const router = express.Router();

// Dashboard stats
router.get('/dashboard', authMiddleware, staffOrAdmin, async (req, res) => {
    try {
        // Total products
        const productsCount = await dbModule.get(
            'SELECT COUNT(*) as count FROM products'
        );

        // Low stock items
        const lowStock = await dbModule.get(
            'SELECT COUNT(*) as count FROM products WHERE quantity < min_stock'
        );

        // Today's sales
        const todaySales = await dbModule.get(
            `SELECT COUNT(*) as count, SUM(total_amount) as total FROM sales 
             WHERE DATE(created_at) = DATE('now')`
        );

        // This week's sales
        const weekSales = await dbModule.get(
            `SELECT SUM(total_amount) as total FROM sales 
             WHERE created_at >= datetime('now', '-7 days')`
        );

        // Total inventory value
        const inventoryValue = await dbModule.get(
            'SELECT SUM(price * quantity) as total FROM products'
        );

        res.json({
            totalProducts: productsCount.count,
            lowStockItems: lowStock.count,
            todaysSalesCount: todaySales.count || 0,
            todaysSalesAmount: todaySales.total || 0,
            weeklySalesAmount: weekSales.total || 0,
            inventoryValue: inventoryValue.total || 0
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Top selling products
router.get('/top-products', authMiddleware, staffOrAdmin, async (req, res) => {
    try {
        const { limit = 10, days = 30 } = req.query;

        const products = await dbModule.all(
            `SELECT p.id, p.name, p.sku, SUM(s.quantity) as total_sold, SUM(s.total_amount) as revenue
             FROM sales s
             JOIN products p ON s.product_id = p.id
             WHERE s.created_at >= datetime('now', ? || ' days')
             GROUP BY p.id
             ORDER BY total_sold DESC
             LIMIT ?`,
            [`-${days}`, parseInt(limit)]
        );

        res.json(products);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Daily sales trend
router.get('/sales-trend/:days', authMiddleware, staffOrAdmin, async (req, res) => {
    try {
        const { days } = req.params;

        const trend = await dbModule.all(
            `SELECT DATE(created_at) as date, COUNT(*) as transactions, SUM(total_amount) as revenue
             FROM sales
             WHERE created_at >= datetime('now', ? || ' days')
             GROUP BY DATE(created_at)
             ORDER BY date DESC`,
            [`-${days}`]
        );

        res.json(trend);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Stock movement history
router.get('/stock-history/:product_id', authMiddleware, staffOrAdmin, async (req, res) => {
    try {
        const { product_id } = req.params;
        const { limit = 50 } = req.query;

        const history = await dbModule.all(
            `SELECT sm.*, u.username FROM stock_movements sm
             LEFT JOIN users u ON sm.user_id = u.id
             WHERE sm.product_id = ?
             ORDER BY sm.created_at DESC
             LIMIT ?`,
            [product_id, parseInt(limit)]
        );

        res.json(history);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Category-wise sales
router.get('/category-breakdown', authMiddleware, staffOrAdmin, async (req, res) => {
    try {
        const breakdown = await dbModule.all(
            `SELECT p.category, COUNT(*) as transactions, SUM(s.total_amount) as revenue
             FROM sales s
             JOIN products p ON s.product_id = p.id
             WHERE s.created_at >= datetime('now', '-30 days')
             GROUP BY p.category
             ORDER BY revenue DESC`
        );

        res.json(breakdown);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
