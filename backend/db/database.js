const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const config = require('../config');

const DB_PATH = config.DB_PATH;
const dataDir = path.dirname(DB_PATH);

// Ensure data directory exists
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

let db;

const initializeDb = () => {
    return new Promise((resolve, reject) => {
        db = new sqlite3.Database(DB_PATH, (err) => {
            if (err) {
                console.error('Database error:', err.message);
                reject(err);
            } else {
                console.log('✓ SQLite database connected');
                
                // Enable foreign keys
                db.run('PRAGMA foreign_keys = ON', () => {
                    createTables()
                        .then(() => {
                            console.log('✓ Database schema initialized');
                            resolve(db);
                        })
                        .catch(reject);
                });
            }
        });
    });
};

const createTables = () => {
    return new Promise((resolve, reject) => {
        db.serialize(() => {
            // Users table
            db.run(`
                CREATE TABLE IF NOT EXISTS users (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    username TEXT UNIQUE NOT NULL,
                    password_hash TEXT NOT NULL,
                    role TEXT DEFAULT 'STAFF',
                    email TEXT UNIQUE,
                    active BOOLEAN DEFAULT 1,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            `);

            // Products table
            db.run(`
                CREATE TABLE IF NOT EXISTS products (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    sku TEXT UNIQUE NOT NULL,
                    name TEXT NOT NULL,
                    description TEXT,
                    category TEXT,
                    price REAL NOT NULL,
                    quantity INTEGER DEFAULT 0,
                    min_stock INTEGER DEFAULT 10,
                    max_stock INTEGER DEFAULT 1000,
                    reorder_quantity INTEGER DEFAULT 50,
                    supplier_id INTEGER,
                    barcode TEXT UNIQUE,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (supplier_id) REFERENCES suppliers(id)
                )
            `);

            // Sales table
            db.run(`
                CREATE TABLE IF NOT EXISTS sales (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    product_id INTEGER NOT NULL,
                    quantity INTEGER NOT NULL,
                    price_per_unit REAL NOT NULL,
                    total_amount REAL NOT NULL,
                    user_id INTEGER NOT NULL,
                    status TEXT DEFAULT 'COMPLETED',
                    notes TEXT,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (product_id) REFERENCES products(id),
                    FOREIGN KEY (user_id) REFERENCES users(id)
                )
            `);

            // Stock movements (audit trail)
            db.run(`
                CREATE TABLE IF NOT EXISTS stock_movements (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    product_id INTEGER NOT NULL,
                    quantity_change INTEGER NOT NULL,
                    movement_type TEXT NOT NULL,
                    reason TEXT,
                    user_id INTEGER,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (product_id) REFERENCES products(id),
                    FOREIGN KEY (user_id) REFERENCES users(id)
                )
            `);

            // Suppliers table
            db.run(`
                CREATE TABLE IF NOT EXISTS suppliers (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT UNIQUE NOT NULL,
                    contact_person TEXT,
                    email TEXT,
                    phone TEXT,
                    address TEXT,
                    lead_time_days INTEGER DEFAULT 7,
                    active BOOLEAN DEFAULT 1,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            `);

            // Reorder requests (auto-reorder trigger)
            db.run(`
                CREATE TABLE IF NOT EXISTS reorder_requests (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    product_id INTEGER NOT NULL,
                    supplier_id INTEGER NOT NULL,
                    quantity INTEGER NOT NULL,
                    status TEXT DEFAULT 'PENDING',
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    completed_at DATETIME,
                    FOREIGN KEY (product_id) REFERENCES products(id),
                    FOREIGN KEY (supplier_id) REFERENCES suppliers(id)
                )
            `, (err) => {
                if (err) reject(err);
                else {
                    // Create indexes
                    db.run(`CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku)`);
                    db.run(`CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode)`);
                    db.run(`CREATE INDEX IF NOT EXISTS idx_sales_product_id ON sales(product_id)`);
                    db.run(`CREATE INDEX IF NOT EXISTS idx_sales_created_at ON sales(created_at)`);
                    db.run(`CREATE INDEX IF NOT EXISTS idx_stock_movements_product_id ON stock_movements(product_id)`);
                    db.run(`CREATE INDEX IF NOT EXISTS idx_reorder_status ON reorder_requests(status)`, () => {
                        resolve();
                    });
                }
            });
        });
    });
};

module.exports = {
    initializeDb,
    db: () => db,
    run: (sql, params = []) => {
        return new Promise((resolve, reject) => {
            db.run(sql, params, function(err) {
                if (err) reject(err);
                else resolve({ lastID: this.lastID, changes: this.changes });
            });
        });
    },
    get: (sql, params = []) => {
        return new Promise((resolve, reject) => {
            db.get(sql, params, (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
    },
    all: (sql, params = []) => {
        return new Promise((resolve, reject) => {
            db.all(sql, params, (err, rows) => {
                if (err) reject(err);
                else resolve(rows || []);
            });
        });
    }
};
