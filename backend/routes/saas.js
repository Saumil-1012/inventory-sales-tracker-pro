const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { getPool } = require('../db/postgres');
const config = require('../config');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

const slugify = (value) => value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const adminRoles = new Set(['ADMIN', 'MANAGER']);

const requireOrganization = (req, res, next) => {
    if (!req.user.organizationId) return res.status(403).json({ error: 'Organization account required' });
    next();
};

const requireOrganizationAdmin = (req, res, next) => {
    if (!adminRoles.has(req.user.role)) return res.status(403).json({ error: 'Organization admin access required' });
    next();
};

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

router.get('/me', authMiddleware, requireOrganization, async (req, res) => {
    try {
        const result = await getPool().query(
            `SELECT o.id, o.name, o.slug, o.plan, o.trial_ends_at,
                s.status as subscription_status, s.current_period_end,
                (SELECT COUNT(*) FROM organization_members om WHERE om.organization_id = o.id) as member_count
             FROM organizations o LEFT JOIN subscriptions s ON s.organization_id = o.id
             WHERE o.id = $1`,
            [req.user.organizationId]
        );
        if (!result.rows[0]) return res.status(404).json({ error: 'Organization not found' });
        res.json({ ...result.rows[0], current_user: { id: req.user.id, username: req.user.username, role: req.user.role } });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/members', authMiddleware, requireOrganization, async (req, res) => {
    try {
        const result = await getPool().query(
            `SELECT u.id, u.username, u.email, om.role, om.created_at, u.active
             FROM organization_members om JOIN users u ON u.id = om.user_id
             WHERE om.organization_id = $1 ORDER BY om.created_at`,
            [req.user.organizationId]
        );
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/members', authMiddleware, requireOrganization, requireOrganizationAdmin, [
    body('username').trim().isLength({ min: 3 }),
    body('email').isEmail(),
    body('password').isLength({ min: 8 }),
    body('role').isIn(['MANAGER', 'STAFF', 'WAREHOUSE'])
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const { username, email, password, role } = req.body;
    const client = await getPool().connect();
    try {
        await client.query('BEGIN');
        const passwordHash = await bcrypt.hash(password, config.BCRYPT_ROUNDS);
        const user = await client.query(
            `INSERT INTO users (username, password_hash, email, role, organization_id)
             VALUES ($1, $2, $3, $4, $5) RETURNING id, username, email, role`,
            [username, passwordHash, email, role, req.user.organizationId]
        );
        await client.query(
            `INSERT INTO organization_members (organization_id, user_id, role) VALUES ($1, $2, $3)`,
            [req.user.organizationId, user.rows[0].id, role]
        );
        await client.query('COMMIT');
        res.status(201).json(user.rows[0]);
    } catch (error) {
        await client.query('ROLLBACK');
        res.status(error.code === '23505' ? 409 : 500).json({ error: error.message });
    } finally {
        client.release();
    }
});

router.patch('/members/:id/role', authMiddleware, requireOrganization, requireOrganizationAdmin, [body('role').isIn(['MANAGER', 'STAFF', 'WAREHOUSE'])], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    try {
        const result = await getPool().query(
            `UPDATE organization_members SET role = $1 WHERE organization_id = $2 AND user_id = $3 RETURNING user_id, role`,
            [req.body.role, req.user.organizationId, req.params.id]
        );
        if (!result.rows[0]) return res.status(404).json({ error: 'Member not found' });
        await getPool().query('UPDATE users SET role = $1, updated_at = NOW() WHERE id = $2 AND organization_id = $3', [req.body.role, req.params.id, req.user.organizationId]);
        res.json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;