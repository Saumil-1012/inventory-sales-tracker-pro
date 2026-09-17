const express = require('express');
const crypto = require('crypto');
const db = require('../db/database');
const { authMiddleware, adminOnly, staffOrAdmin } = require('../middleware/auth');

const router = express.Router();

router.get('/suppliers', authMiddleware, staffOrAdmin, async (req, res) => {
    try {
        res.json(await db.all('SELECT * FROM suppliers WHERE active = 1 ORDER BY name'));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/suppliers', authMiddleware, adminOnly, async (req, res) => {
    const { name, contact_person, email, phone, lead_time_days = 7 } = req.body;
    if (!name) return res.status(400).json({ error: 'Supplier name required' });

    try {
        const result = await db.run(
            `INSERT INTO suppliers (name, contact_person, email, phone, lead_time_days)
             VALUES (?, ?, ?, ?, ?)`,
            [name, contact_person, email, phone, lead_time_days]
        );
        res.status(201).json({ id: result.lastID, message: 'Supplier created' });
    } catch (error) {
        res.status(error.message.includes('UNIQUE') ? 409 : 500).json({ error: error.message });
    }
});

router.get('/orders', authMiddleware, staffOrAdmin, async (req, res) => {
    try {
        res.json(await db.all(
            `SELECT po.*, s.name as supplier_name, u.username as created_by_name,
                COUNT(poi.id) as item_count
             FROM purchase_orders po
             JOIN suppliers s ON s.id = po.supplier_id
             JOIN users u ON u.id = po.created_by
             LEFT JOIN purchase_order_items poi ON poi.purchase_order_id = po.id
             GROUP BY po.id ORDER BY po.created_at DESC`
        ));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/orders', authMiddleware, staffOrAdmin, async (req, res) => {
    const { supplier_id, notes, items } = req.body;
    if (!supplier_id || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ error: 'Supplier and at least one item are required' });
    }

    try {
        const orderNumber = `PO-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
        const totalAmount = items.reduce((sum, item) => sum + (Number(item.quantity) * Number(item.unit_cost)), 0);
        const order = await db.run(
            `INSERT INTO purchase_orders (order_number, supplier_id, notes, total_amount, created_by)
             VALUES (?, ?, ?, ?, ?)`,
            [orderNumber, supplier_id, notes, totalAmount, req.user.id]
        );

        for (const item of items) {
            await db.run(
                `INSERT INTO purchase_order_items (purchase_order_id, product_id, quantity, unit_cost)
                 VALUES (?, ?, ?, ?)`,
                [order.lastID, item.product_id, item.quantity, item.unit_cost]
            );
        }
        res.status(201).json({ id: order.lastID, orderNumber, totalAmount });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/orders/:id/receive', authMiddleware, staffOrAdmin, async (req, res) => {
    try {
        const order = await db.get('SELECT * FROM purchase_orders WHERE id = ?', [req.params.id]);
        if (!order) return res.status(404).json({ error: 'Purchase order not found' });
        if (order.status === 'RECEIVED') return res.status(409).json({ error: 'Purchase order already received' });

        const items = await db.all('SELECT * FROM purchase_order_items WHERE purchase_order_id = ?', [order.id]);
        for (const item of items) {
            await db.run('UPDATE products SET quantity = quantity + ?, cost_price = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [item.quantity, item.unit_cost, item.product_id]);
            await db.run('UPDATE purchase_order_items SET received_quantity = quantity WHERE id = ?', [item.id]);
            await db.run(
                `INSERT INTO stock_movements (product_id, quantity_change, movement_type, reason, user_id)
                 VALUES (?, ?, 'PURCHASE', ?, ?)`,
                [item.product_id, item.quantity, `Received ${order.order_number}`, req.user.id]
            );
        }
        await db.run("UPDATE purchase_orders SET status = 'RECEIVED', received_at = CURRENT_TIMESTAMP WHERE id = ?", [order.id]);
        res.json({ message: 'Purchase order received', orderNumber: order.order_number });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;