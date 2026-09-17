const { getPool } = require('../db/postgres');

const planLimits = {
    TRIAL: { members: 3, ingredients: 100, locations: 1 },
    STARTER: { members: 5, ingredients: 500, locations: 1 },
    PRO: { members: 25, ingredients: 5000, locations: 10 },
    ENTERPRISE: { members: Infinity, ingredients: Infinity, locations: Infinity }
};

const requireActiveSubscription = async (req, res, next) => {
    try {
        const result = await getPool().query(
            `SELECT s.plan, s.status, o.trial_ends_at FROM organizations o
             LEFT JOIN subscriptions s ON s.organization_id = o.id
             WHERE o.id = $1`,
            [req.user.organizationId]
        );
        const subscription = result.rows[0];
        if (!subscription) return res.status(403).json({ error: 'Subscription not found' });
        const trialExpired = subscription.status === 'TRIALING' && subscription.trial_ends_at && new Date(subscription.trial_ends_at) < new Date();
        if (trialExpired || ['CANCELED', 'UNPAID'].includes(subscription.status)) {
            return res.status(402).json({ error: 'Subscription inactive', code: 'SUBSCRIPTION_REQUIRED' });
        }
        req.subscription = subscription;
        next();
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const enforceLimit = (resource) => async (req, res, next) => {
    try {
        const plan = req.subscription?.plan || 'TRIAL';
        const limit = planLimits[plan]?.[resource] ?? planLimits.TRIAL[resource];
        if (limit === Infinity) return next();
        const table = resource === 'members' ? 'organization_members' : resource;
        const result = await getPool().query(`SELECT COUNT(*)::int AS count FROM ${table} WHERE organization_id = $1`, [req.user.organizationId]);
        if (result.rows[0].count >= limit) return res.status(402).json({ error: `${resource} limit reached for ${plan} plan`, code: 'PLAN_LIMIT_REACHED', limit });
        next();
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = { planLimits, requireActiveSubscription, enforceLimit };
