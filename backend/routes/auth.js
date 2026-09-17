const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const dbModule = require('../db/database');
const config = require('../config');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

router.post('/password', authMiddleware, [
    body('currentPassword').notEmpty(),
    body('newPassword').isLength({ min: 8 }).withMessage('New password must be 8+ chars')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { currentPassword, newPassword } = req.body;

    try {
        const user = await dbModule.get(
            'SELECT password_hash FROM users WHERE id = ?',
            [req.user.id]
        );

        if (!user || !(await bcrypt.compare(currentPassword, user.password_hash))) {
            return res.status(401).json({ error: 'Current password is incorrect' });
        }

        const passwordHash = await bcrypt.hash(newPassword, config.BCRYPT_ROUNDS);
        await dbModule.run(
            'UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [passwordHash, req.user.id]
        );

        res.json({ message: 'Password changed successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/history', authMiddleware, async (req, res) => {
    try {
        const history = await dbModule.all(
            `SELECT logged_in_at, ip_address FROM login_history
             WHERE user_id = ? ORDER BY logged_in_at DESC LIMIT 20`,
            [req.user.id]
        );
        res.json(history);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Register
router.post('/register', [
    body('username').notEmpty().withMessage('Username required'),
    body('password').isLength({ min: 8 }).withMessage('Password must be 8+ chars'),
    body('email').isEmail().withMessage('Valid email required')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { username, password, email, role = 'STAFF' } = req.body;

    try {
        const hash = await bcrypt.hash(password, config.BCRYPT_ROUNDS);
        const db = dbModule.db();
        
        const result = await dbModule.run(
            `INSERT INTO users (username, password_hash, email, role) VALUES (?, ?, ?, ?)`,
            [username, hash, email, role]
        );

        res.status(201).json({ 
            message: 'User created', 
            userId: result.lastID 
        });
    } catch (error) {
        if (error.message.includes('UNIQUE')) {
            res.status(409).json({ error: 'Username or email already exists' });
        } else {
            res.status(500).json({ error: error.message });
        }
    }
});

// Login
router.post('/login', [
    body('username').notEmpty(),
    body('password').notEmpty()
], async (req, res) => {
    const { username, password } = req.body;

    try {
        const user = await dbModule.get(
            `SELECT id, username, password_hash, role FROM users WHERE username = ?`,
            [username]
        );

        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const isValid = await bcrypt.compare(password, user.password_hash);
        if (!isValid) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        await dbModule.run(
            'INSERT INTO login_history (user_id, ip_address) VALUES (?, ?)',
            [user.id, req.ip]
        );

        const token = jwt.sign(
            { id: user.id, username: user.username, role: user.role },
            config.JWT_SECRET,
            { expiresIn: config.JWT_EXPIRE }
        );

        res.json({ 
            token, 
            user: { id: user.id, username: user.username, role: user.role }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
