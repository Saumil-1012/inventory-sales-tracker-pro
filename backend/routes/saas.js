const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { getPool } = require('../db/postgres');
const config = require('../config');

const router = express.Router();

const slugify = (value) => value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

router.post('/register', [
    body('organizationName').trim().isLength({ min: 2 }),
    body('username').trim().isLength({ min: 3 }),
    body('email').isEmail(),
    body('password').isLength({ min: 8 })
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { organizationName, username, email, password } = req.body;
    const pool = getPool();
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const baseSlug = slugify(organizationName);
        const slug = `${baseSlug}-${Date.now().toString(36)}`;
        const organization = await client.query(
            `INSERT INTO organizations (name, slug) VALUES ($1, $2) RETURNING id, name, slug, plan, trial_ends_at`,
            [organizationName, slug]
        );
        const passwordHash = await bcrypt.hash(password, config.BCRYPT_ROUNDS);
        const user = await client.query(
            `INSERT INTO users (username, password_hash, email, role, organization_id)
             VALUES ($1, $2, $3, 'ADMIN', $4) RETURNING id, username, email, role`,
            [username, passwordHash, email, organization.rows[0].id]
        );
        await client.query(
            `INSERT INTO organization_members (organization_id, user_id, role) VALUES ($1, $2, 'ADMIN')`,
            [organization.rows[0].id, user.rows[0].id]
        );
        await client.query(
            `INSERT INTO subscriptions (organization_id, plan, status, current_period_end)
             VALUES ($1, 'TRIAL', 'TRIALING', $2)`,
            [organization.rows[0].id, organization.rows[0].trial_ends_at]
        );
        await client.query('COMMIT');
        res.status(201).json({ organization: organization.rows[0], user: user.rows[0] });
    } catch (error) {
        await client.query('ROLLBACK');
        res.status(error.code === '23505' ? 409 : 500).json({ error: error.message });
    } finally {
        client.release();
    }
});

router.post('/login', [body('username').notEmpty(), body('password').notEmpty()], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
        const result = await getPool().query(
            `SELECT u.id, u.username, u.password_hash, u.role, u.organization_id,
                o.name as organization_name, o.plan, s.status as subscription_status
             FROM users u
             JOIN organizations o ON o.id = u.organization_id
             LEFT JOIN subscriptions s ON s.organization_id = o.id
             WHERE u.username = $1 AND u.active = TRUE`,
            [req.body.username]
        );
        const user = result.rows[0];
        if (!user || !(await bcrypt.compare(req.body.password, user.password_hash))) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const token = jwt.sign(
            { id: user.id, username: user.username, role: user.role, organizationId: user.organization_id },
            config.JWT_SECRET,
            { expiresIn: config.JWT_EXPIRE }
        );
        res.json({ token, user: { id: user.id, username: user.username, role: user.role, organizationId: user.organization_id, organizationName: user.organization_name, plan: user.plan, subscriptionStatus: user.subscription_status } });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;