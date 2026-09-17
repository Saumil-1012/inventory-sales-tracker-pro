const { Pool } = require('pg');
const config = require('../config');

let pool;

const getPool = () => {
    if (!config.DATABASE_URL) {
        throw new Error('DATABASE_URL is required for SaaS PostgreSQL features');
    }
    if (!pool) {
        pool = new Pool({
            connectionString: config.DATABASE_URL,
            ssl: config.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
        });
    }
    return pool;
};

module.exports = { getPool };