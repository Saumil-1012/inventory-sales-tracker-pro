const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
    console.error('DATABASE_URL is required to run PostgreSQL migrations.');
    process.exit(1);
}

const migrationDirectory = path.join(__dirname, '..', 'db', 'migrations');
const pool = new Pool({ connectionString, ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false });

(async () => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        await client.query(`CREATE TABLE IF NOT EXISTS schema_migrations (filename TEXT PRIMARY KEY, applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`);
        const files = fs.readdirSync(migrationDirectory).filter((file) => file.endsWith('.sql')).sort();

        for (const filename of files) {
            const applied = await client.query('SELECT 1 FROM schema_migrations WHERE filename = $1', [filename]);
            if (applied.rowCount > 0) continue;
            const sql = fs.readFileSync(path.join(migrationDirectory, filename), 'utf8');
            await client.query(sql);
            await client.query('INSERT INTO schema_migrations (filename) VALUES ($1)', [filename]);
            console.log(`Applied ${filename}`);
        }

        await client.query('COMMIT');
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Migration failed:', error.message);
        process.exitCode = 1;
    } finally {
        client.release();
        await pool.end();
    }
})();
