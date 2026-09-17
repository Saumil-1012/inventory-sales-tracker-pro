require('dotenv').config();

module.exports = {
    PORT: process.env.PORT || 5000,
    NODE_ENV: process.env.NODE_ENV || 'development',
    DB_PATH: process.env.DB_PATH || './data/inventory.db',
    DATABASE_URL: process.env.DATABASE_URL || '',
    JWT_SECRET: process.env.JWT_SECRET || 'dev-secret-key-change-in-production',
    JWT_EXPIRE: process.env.JWT_EXPIRE || '7d',
    BCRYPT_ROUNDS: 10,
    LOG_LEVEL: process.env.LOG_LEVEL || 'info'
    ,STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY || ''
    ,STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET || ''
    ,STRIPE_PRICE_STARTER: process.env.STRIPE_PRICE_STARTER || ''
    ,STRIPE_PRICE_PRO: process.env.STRIPE_PRICE_PRO || ''
    ,STRIPE_PRICE_ENTERPRISE: process.env.STRIPE_PRICE_ENTERPRISE || ''
    ,STRIPE_SUCCESS_URL: process.env.STRIPE_SUCCESS_URL || 'http://localhost:3000/settings?billing=success'
    ,STRIPE_CANCEL_URL: process.env.STRIPE_CANCEL_URL || 'http://localhost:3000/settings?billing=cancelled'
    ,CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:3000'
    ,SMTP_HOST: process.env.SMTP_HOST || ''
    ,SMTP_PORT: Number(process.env.SMTP_PORT || 587)
    ,SMTP_USER: process.env.SMTP_USER || ''
    ,SMTP_PASSWORD: process.env.SMTP_PASSWORD || ''
    ,REPORT_EMAIL_FROM: process.env.REPORT_EMAIL_FROM || 'reports@example.com'
};
