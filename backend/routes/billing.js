const express = require('express');
const Stripe = require('stripe');
const { authMiddleware } = require('../middleware/auth');
const { getPool } = require('../db/postgres');
const config = require('../config');

const router = express.Router();
const plans = [
    { id: 'STARTER', name: 'Starter', priceId: config.STRIPE_PRICE_STARTER, features: ['One location', 'Inventory and sales', 'Basic reports'] },
    { id: 'PRO', name: 'Professional', priceId: config.STRIPE_PRICE_PRO, features: ['Multiple locations', 'Forecasting', 'Profit analytics'] },
    { id: 'ENTERPRISE', name: 'Enterprise', priceId: config.STRIPE_PRICE_ENTERPRISE, features: ['Unlimited locations', 'Advanced permissions', 'Priority support'] }
];

const getStripe = () => {
    if (!config.STRIPE_SECRET_KEY || config.STRIPE_SECRET_KEY.startsWith('sk_test_replace')) {
        const error = new Error('Stripe test keys are not configured');
        error.status = 503;
        throw error;
    }
    return new Stripe(config.STRIPE_SECRET_KEY);
};

router.get('/plans', (req, res) => res.json(plans));

router.get('/status', authMiddleware, async (req, res) => {
    try {
        const result = await getPool().query(
            `SELECT plan, status, current_period_end, stripe_customer_id, stripe_subscription_id
             FROM subscriptions WHERE organization_id = $1`,
            [req.user.organizationId]
        );
        res.json(result.rows[0] || { plan: 'TRIAL', status: 'TRIALING' });
    } catch (error) {
        res.status(error.status || 500).json({ error: error.message });
    }
});

router.post('/checkout', authMiddleware, async (req, res) => {
    const { planId } = req.body;
    const plan = plans.find((item) => item.id === planId);
    if (!plan || !plan.priceId || plan.priceId.startsWith('price_replace')) return res.status(400).json({ error: 'A valid Stripe plan is required' });

    try {
        const stripe = getStripe();
        const pool = getPool();
        const subscription = await pool.query('SELECT stripe_customer_id FROM subscriptions WHERE organization_id = $1', [req.user.organizationId]);
        let customerId = subscription.rows[0]?.stripe_customer_id;
        if (!customerId) {
            const customer = await stripe.customers.create({ email: req.user.email, metadata: { organizationId: req.user.organizationId } });
            customerId = customer.id;
            await pool.query('UPDATE subscriptions SET stripe_customer_id = $1 WHERE organization_id = $2', [customerId, req.user.organizationId]);
        }

        const session = await stripe.checkout.sessions.create({
            mode: 'subscription',
            customer: customerId,
            line_items: [{ price: plan.priceId, quantity: 1 }],
            success_url: config.STRIPE_SUCCESS_URL,
            cancel_url: config.STRIPE_CANCEL_URL,
            metadata: { organizationId: req.user.organizationId, plan: plan.id }
        });
        res.json({ url: session.url });
    } catch (error) {
        res.status(error.status || 500).json({ error: error.message });
    }
});

router.post('/webhook', async (req, res) => {
    try {
        const stripe = getStripe();
        const event = stripe.webhooks.constructEvent(req.body, req.headers['stripe-signature'], config.STRIPE_WEBHOOK_SECRET);
        const object = event.data.object;
        const pool = getPool();

        if (event.type === 'checkout.session.completed') {
            await pool.query(
                `UPDATE subscriptions SET stripe_customer_id = $1, stripe_subscription_id = $2,
                    plan = COALESCE($3, plan), status = 'ACTIVE', updated_at = NOW()
                 WHERE organization_id = $4`,
                [object.customer, object.subscription, object.metadata?.plan || null, object.metadata?.organizationId]
            );
        } else if (event.type === 'customer.subscription.updated') {
            await pool.query(
                `UPDATE subscriptions SET status = $1, current_period_end = TO_TIMESTAMP($2), updated_at = NOW()
                 WHERE stripe_subscription_id = $3`,
                [object.status.toUpperCase(), object.current_period_end, object.id]
            );
        } else if (event.type === 'customer.subscription.deleted') {
            await pool.query(`UPDATE subscriptions SET status = 'CANCELED', updated_at = NOW() WHERE stripe_subscription_id = $1`, [object.id]);
        }
        res.json({ received: true });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

module.exports = router;
