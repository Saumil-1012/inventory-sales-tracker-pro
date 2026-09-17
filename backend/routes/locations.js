const express = require('express');
const db = require('../db/database');
const { authMiddleware, adminOnly, staffOrAdmin } = require('../middleware/auth');

const router = express.Router();

router.get('/', authMiddleware, staffOrAdmin, async (req, res) => {
    try {
        res.json(await db.all('SELECT * FROM locations WHERE active = 1 ORDER BY type, name'));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/', authMiddleware, adminOnly, async (req, res) => {
    const { name, code, address, type = 'STORE' } = req.body;
    if (!name || !code) return res.status(400).json({ error: 'Location name and code are required' });

    try {
        const result = await db.run(
            'INSERT INTO locations (name, code, address, type) VALUES (?, ?, ?, ?)',
            [name, code, address, type]
        );
        res.status(201).json({ id: result.lastID, message: 'Location created' });
    } catch (error) {
        res.status(error.message.includes('UNIQUE') ? 409 : 500).json({ error: error.message });
    }
});

router.get('/stock', authMiddleware, staffOrAdmin, async (req, res) => {
    try {
        const stock = await db.all(`
            SELECT ls.location_id, l.name as location_name, l.code as location_code,
                ls.product_id, p.name as product_name, p.sku, ls.quantity, ls.updated_at
            FROM location_stock ls
            JOIN locations l ON l.id = ls.location_id
            JOIN products p ON p.id = ls.product_id
            WHERE l.active = 1
            ORDER BY l.name, p.name
        `);
        res.json(stock);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/transfers', authMiddleware, staffOrAdmin, async (req, res) => {
    try {
        res.json(await db.all(`
            SELECT st.*, p.name as product_name, p.sku,
                from_location.name as from_location_name, to_location.name as to_location_name,
                u.username as created_by_name
            FROM stock_transfers st
            JOIN products p ON p.id = st.product_id
            JOIN locations from_location ON from_location.id = st.from_location_id
            JOIN locations to_location ON to_location.id = st.to_location_id
            JOIN users u ON u.id = st.created_by
            ORDER BY st.created_at DESC LIMIT 100
        `));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/transfers', authMiddleware, staffOrAdmin, async (req, res) => {
    const { product_id, from_location_id, to_location_id, quantity, notes } = req.body;
    if (!product_id || !from_location_id || !to_location_id || !quantity || from_location_id === to_location_id) {
        return res.status(400).json({ error: 'Valid product, different locations, and quantity are required' });
    }

    try {
        const source = await db.get(
            'SELECT quantity FROM location_stock WHERE location_id = ? AND product_id = ?',
            [from_location_id, product_id]
        );
        if (!source || source.quantity < quantity) return res.status(400).json({ error: 'Insufficient stock at source location' });

        const runTransfer = db.db().transaction(() => {
            db.db().prepare(`UPDATE location_stock SET quantity = quantity - ?, updated_at = CURRENT_TIMESTAMP WHERE location_id = ? AND product_id = ?`).run(quantity, from_location_id, product_id);
            db.db().prepare(`INSERT INTO location_stock (location_id, product_id, quantity) VALUES (?, ?, ?) ON CONFLICT(location_id, product_id) DO UPDATE SET quantity = quantity + excluded.quantity, updated_at = CURRENT_TIMESTAMP`).run(to_location_id, product_id, quantity);
            return db.db().prepare(`INSERT INTO stock_transfers (product_id, from_location_id, to_location_id, quantity, notes, created_by) VALUES (?, ?, ?, ?, ?, ?)`).run(product_id, from_location_id, to_location_id, quantity, notes, req.user.id);
        });
        const transfer = runTransfer();
        res.status(201).json({ id: transfer.lastInsertRowid, message: 'Stock transferred successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
