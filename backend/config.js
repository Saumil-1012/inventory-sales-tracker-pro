require('dotenv').config();

module.exports = {
    PORT: process.env.PORT || 5000,
    NODE_ENV: process.env.NODE_ENV || 'development',
    DB_PATH: process.env.DB_PATH || './data/inventory.db',
    JWT_SECRET: process.env.JWT_SECRET || 'dev-secret-key-change-in-production',
    JWT_EXPIRE: process.env.JWT_EXPIRE || '7d',
    BCRYPT_ROUNDS: 10,
    LOG_LEVEL: process.env.LOG_LEVEL || 'info'
};
