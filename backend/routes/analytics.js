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

// Profit and margin report
router.get('/profit', authMiddleware, staffOrAdmin, async (req, res) => {
    try {
        const days = Math.max(parseInt(req.query.days || '30', 10), 1);
        const summary = await dbModule.get(
            `SELECT
                COALESCE(SUM(total_amount), 0) as revenue,
                COALESCE(SUM(quantity * cost_price), 0) as cost,
                COALESCE(SUM(quantity * (price_per_unit - cost_price)), 0) as profit
             FROM sales
             WHERE status = 'COMPLETED' AND created_at >= datetime('now', ? || ' days')`,
            [`-${days}`]
        );

        const products = await dbModule.all(
            `SELECT p.name, p.sku, p.category,
                SUM(s.quantity) as units_sold,
                SUM(s.total_amount) as revenue,
                SUM(s.quantity * s.cost_price) as cost,
                SUM(s.quantity * (s.price_per_unit - s.cost_price)) as profit
             FROM sales s
             JOIN products p ON p.id = s.product_id
             WHERE s.status = 'COMPLETED' AND s.created_at >= datetime('now', ? || ' days')
             GROUP BY p.id
             ORDER BY profit DESC`,
            [`-${days}`]
        );

        const categories = await dbModule.all(
            `SELECT COALESCE(p.category, 'Uncategorized') as category,
                SUM(s.total_amount) as revenue,
                SUM(s.quantity * (s.price_per_unit - s.cost_price)) as profit
             FROM sales s
             JOIN products p ON p.id = s.product_id
             WHERE s.status = 'COMPLETED' AND s.created_at >= datetime('now', ? || ' days')
             GROUP BY p.category
             ORDER BY profit DESC`,
            [`-${days}`]
        );

        res.json({
            days,
            summary: {
                revenue: summary.revenue,
                cost: summary.cost,
                profit: summary.profit,
                marginPercent: summary.revenue ? (summary.profit / summary.revenue) * 100 : 0
            },
            products: products.map((product) => ({
                ...product,
                marginPercent: product.revenue ? (product.profit / product.revenue) * 100 : 0
            })),
            categories: categories.map((category) => ({
                ...category,
                marginPercent: category.revenue ? (category.profit / category.revenue) * 100 : 0
            }))
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Inventory health and ABC classification
router.get('/inventory-intelligence', authMiddleware, staffOrAdmin, async (req, res) => {
    try {
        const days = Math.max(parseInt(req.query.days || '90', 10), 1);
        const products = await dbModule.all(
            `SELECT p.id, p.sku, p.name, p.category, p.price, p.cost_price,
                p.quantity, p.min_stock,
                COALESCE(SUM(s.quantity), 0) as units_sold,
                COALESCE(SUM(s.total_amount), 0) as revenue
             FROM products p
             LEFT JOIN sales s ON s.product_id = p.id
                AND s.status = 'COMPLETED'
                AND s.created_at >= datetime('now', ? || ' days')
             GROUP BY p.id
             ORDER BY revenue DESC, p.name ASC`,
            [`-${days}`]
        );

        const totalRevenue = products.reduce((sum, product) => sum + product.revenue, 0);
        let cumulativeRevenue = 0;
        const report = products.map((product) => {
            const averageDailySales = product.units_sold / days;
            const daysOfStock = averageDailySales > 0 ? product.quantity / averageDailySales : null;
            const averageInventory = (product.quantity + product.units_sold) / 2;
            const turnoverRate = averageInventory > 0
                ? (product.units_sold / averageInventory) * (365 / days)
                : 0;
            cumulativeRevenue += product.revenue;
            const revenueShare = totalRevenue > 0 ? (product.revenue / totalRevenue) * 100 : 0;
            const cumulativeShare = totalRevenue > 0 ? (cumulativeRevenue / totalRevenue) * 100 : 0;

            return {
                ...product,
                inventory_value: product.price * product.quantity,
                average_daily_sales: averageDailySales,
                days_of_stock: daysOfStock,
                turnover_rate: turnoverRate,
                revenue_share: revenueShare,
                abc_class: cumulativeShare <= 80 ? 'A' : cumulativeShare <= 95 ? 'B' : 'C',
                dead_stock: product.units_sold === 0,
                understock: product.quantity <= product.min_stock || (daysOfStock !== null && daysOfStock <= 14),
                overstock: daysOfStock === null || daysOfStock > 90
            };
        });

        res.json({
            days,
            summary: {
                inventoryValue: report.reduce((sum, product) => sum + product.inventory_value, 0),
                deadStock: report.filter((product) => product.dead_stock).length,
                understock: report.filter((product) => product.understock).length,
                overstock: report.filter((product) => product.overstock).length,
                averageTurnover: report.length
                    ? report.reduce((sum, product) => sum + product.turnover_rate, 0) / report.length
                    : 0
            },
            products: report
        });
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
