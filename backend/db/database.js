const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
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
    return new Promise(async (resolve, reject) => {
        try {
            db = new Database(DB_PATH);
            console.log('✓ SQLite database connected');
            
            // Enable foreign keys
            db.pragma('foreign_keys = ON');
            
            createTables();
            ensureCostPriceColumns();
            await seedDefaultUsers();
            seedDemoData();
            seedDemoCostPrices();
            seedDemoSuppliers();
            seedDemoLocations();
            seedGermanRestaurantMenu();
            seedGermanRestaurantSales();
            console.log('✓ Database schema initialized');
            resolve(db);
        } catch (error) {
            console.error('Database error:', error.message);
            reject(error);
        }
    });
};

const ensureCostPriceColumns = () => {
    const productColumns = db.prepare('PRAGMA table_info(products)').all();
    if (!productColumns.some((column) => column.name === 'cost_price')) {
        db.exec('ALTER TABLE products ADD COLUMN cost_price REAL NOT NULL DEFAULT 0');
    }

    const saleColumns = db.prepare('PRAGMA table_info(sales)').all();
    if (!saleColumns.some((column) => column.name === 'cost_price')) {
        db.exec('ALTER TABLE sales ADD COLUMN cost_price REAL NOT NULL DEFAULT 0');
    }
};

const seedDefaultUsers = async () => {
    const defaultUsers = [
        ['admin1', 'Saumil123', 'admin1@example.com', 'ADMIN'],
        ['staff1', 'staff123', 'staff1@example.com', 'STAFF']
    ];

    const insertUser = db.prepare(`
        INSERT OR IGNORE INTO users (username, password_hash, email, role)
        VALUES (?, ?, ?, ?)
    `);

    for (const [username, password, email, role] of defaultUsers) {
        const passwordHash = await bcrypt.hash(password, config.BCRYPT_ROUNDS);
        insertUser.run(username, passwordHash, email, role);
    }
};

const seedDemoData = () => {
    const productCount = db.prepare('SELECT COUNT(*) as count FROM products').get();
    if (productCount.count > 0) {
        return;
    }

    const admin = db.prepare('SELECT id FROM users WHERE username = ?').get('admin1');
    const products = [
        ['SKU-1001', 'Wireless Keyboard', 'Computer Accessories', 49.99, 42, 10],
        ['SKU-1002', 'Ergonomic Mouse', 'Computer Accessories', 29.99, 7, 10],
        ['SKU-1003', 'USB-C Hub', 'Computer Accessories', 39.99, 25, 8],
        ['SKU-1004', 'Laptop Stand', 'Office Equipment', 59.99, 18, 5],
        ['SKU-1005', 'Desk Lamp', 'Office Equipment', 34.99, 4, 10],
        ['SKU-1006', 'Notebook Set', 'Stationery', 14.99, 64, 15],
        ['SKU-1007', 'Water Bottle', 'Lifestyle', 24.99, 31, 10],
        ['SKU-1008', 'Travel Backpack', 'Lifestyle', 79.99, 12, 5]
    ];

    const sales = [
        [0, 2, 49.99, 0],
        [1, 3, 29.99, 0],
        [2, 2, 39.99, 1],
        [3, 1, 59.99, 2],
        [4, 2, 34.99, 3],
        [5, 8, 14.99, 5],
        [6, 4, 24.99, 7],
        [7, 2, 79.99, 10],
        [0, 3, 49.99, 14],
        [1, 5, 29.99, 18],
        [2, 4, 39.99, 23],
        [5, 6, 14.99, 27]
    ];

    const formatDate = (daysAgo) => {
        const date = new Date();
        date.setDate(date.getDate() - daysAgo);
        date.setHours(10 + (daysAgo % 8), 15, 0, 0);
        return date.toISOString().slice(0, 19).replace('T', ' ');
    };

    const insertProduct = db.prepare(`
        INSERT INTO products (sku, name, category, price, quantity, min_stock)
        VALUES (?, ?, ?, ?, ?, ?)
    `);
    const insertSale = db.prepare(`
        INSERT INTO sales (product_id, quantity, price_per_unit, total_amount, user_id, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
    `);

    const seed = db.transaction(() => {
        products.forEach((product) => insertProduct.run(...product));
        sales.forEach(([productIndex, quantity, price, daysAgo]) => {
            insertSale.run(productIndex + 1, quantity, price, quantity * price, admin.id, formatDate(daysAgo));
        });
    });

    seed();
};

const seedDemoCostPrices = () => {
    const costs = [
        ['SKU-1001', 28.00],
        ['SKU-1002', 15.00],
        ['SKU-1003', 21.00],
        ['SKU-1004', 32.00],
        ['SKU-1005', 17.00],
        ['SKU-1006', 5.00],
        ['SKU-1007', 11.00],
        ['SKU-1008', 45.00]
    ];
    const updateCost = db.prepare('UPDATE products SET cost_price = ? WHERE sku = ? AND cost_price = 0');
    const updateSaleCost = db.prepare(`
        UPDATE sales SET cost_price = (
            SELECT cost_price FROM products WHERE products.id = sales.product_id
        ) WHERE cost_price = 0
    `);

    const seed = db.transaction(() => {
        costs.forEach(([sku, cost]) => updateCost.run(cost, sku));
        updateSaleCost.run();
    });
    seed();
};

const seedDemoSuppliers = () => {
    const supplierCount = db.prepare('SELECT COUNT(*) as count FROM suppliers').get();
    if (supplierCount.count > 0) return;

    const insertSupplier = db.prepare(`
        INSERT INTO suppliers (name, contact_person, email, phone, lead_time_days)
        VALUES (?, ?, ?, ?, ?)
    `);
    insertSupplier.run('Northstar Wholesale', 'Maya Chen', 'orders@northstar.example', '+1 555 0100', 5);
    insertSupplier.run('OfficeHub Distribution', 'Daniel Ortiz', 'sales@officehub.example', '+1 555 0101', 8);
    insertSupplier.run('Lifestyle Goods Co.', 'Priya Shah', 'orders@lifestyle.example', '+1 555 0102', 12);
};

const seedDemoLocations = () => {
    const locationCount = db.prepare('SELECT COUNT(*) as count FROM locations').get();
    if (locationCount.count > 0) return;

    const insertLocation = db.prepare(`
        INSERT INTO locations (name, code, address, type) VALUES (?, ?, ?, ?)
    `);
    insertLocation.run('Central Warehouse', 'WH-01', '100 Main Street', 'WAREHOUSE');
    insertLocation.run('Downtown Store', 'ST-01', '25 Market Avenue', 'STORE');
    insertLocation.run('Airport Store', 'ST-02', '1 Airport Road', 'STORE');

    const mainLocation = db.prepare('SELECT id FROM locations WHERE code = ?').get('WH-01');
    const insertStock = db.prepare('INSERT INTO location_stock (location_id, product_id, quantity) VALUES (?, ?, ?)');
    const products = db.prepare('SELECT id, quantity FROM products').all();
    const seed = db.transaction(() => products.forEach((product) => insertStock.run(mainLocation.id, product.id, product.quantity)));
    seed();
};

const seedGermanRestaurantMenu = () => {
    const menuItems = [
        ['Wiener Schnitzel', 'Hauptgerichte', 18.90],
        ['Rahmschnitzel', 'Hauptgerichte', 19.50],
        ['Jagerschnitzel', 'Hauptgerichte', 19.90],
        ['Schnitzel mit Pommes', 'Hauptgerichte', 17.90],
        ['Schweinebraten', 'Hauptgerichte', 18.50],
        ['Sauerbraten', 'Hauptgerichte', 21.90],
        ['Rinderroulade', 'Hauptgerichte', 22.50],
        ['Tafelspitz', 'Hauptgerichte', 21.50],
        ['Schweinehaxe', 'Hauptgerichte', 19.90],
        ['Kassler mit Sauerkraut', 'Hauptgerichte', 17.50],
        ['Bratwurst mit Sauerkraut', 'Wurstgerichte', 12.90],
        ['Currywurst mit Pommes', 'Wurstgerichte', 11.90],
        ['Rostbratwurst', 'Wurstgerichte', 13.50],
        ['Nuernberger Rostbratwuerste', 'Wurstgerichte', 12.50],
        ['Thuringer Rostbratwurst', 'Wurstgerichte', 13.90],
        ['Weisswurst mit Brezel', 'Wurstgerichte', 11.50],
        ['Bockwurst mit Brot', 'Wurstgerichte', 9.90],
        ['Krakauer mit Kartoffeln', 'Wurstgerichte', 13.90],
        ['Leberkaese mit Spiegelei', 'Wurstgerichte', 12.90],
        ['Wurstplatte Hausart', 'Wurstgerichte', 16.90],
        ['Kaesespaetzle', 'Vegetarisch', 14.90],
        ['Gemuese-Spaetzle', 'Vegetarisch', 14.50],
        ['Kartoffelpuffer mit Apfelmus', 'Vegetarisch', 11.90],
        ['Vegetarische Kohlroulade', 'Vegetarisch', 15.50],
        ['Pilzrahm mit Semmelknoedel', 'Vegetarisch', 15.90],
        ['Gebratene Pfifferlinge', 'Vegetarisch', 16.90],
        ['Zwiebelkuchen', 'Vegetarisch', 10.90],
        ['Kaeseplatte mit Brot', 'Vegetarisch', 13.90],
        ['Gemuesestrudel', 'Vegetarisch', 13.50],
        ['Kartoffel-Gemuese-Gratin', 'Vegetarisch', 14.90],
        ['Forelle Muelllerin', 'Fischgerichte', 20.90],
        ['Zanderfilet mit Kartoffeln', 'Fischgerichte', 22.50],
        ['Gebratenes Saiblingsfilet', 'Fischgerichte', 23.90],
        ['Karpfen mit Kartoffelsalat', 'Fischgerichte', 19.90],
        ['Matjesfilet Hausfrauenart', 'Fischgerichte', 16.90],
        ['Bismarckhering mit Brot', 'Fischgerichte', 12.90],
        ['Lachs mit Kraeuterbutter', 'Fischgerichte', 22.90],
        ['Fischsuppe Norddeutsch', 'Fischgerichte', 11.90],
        ['Gebratene Garnelen', 'Fischgerichte', 19.50],
        ['Backfisch mit Remoulade', 'Fischgerichte', 15.90],
        ['Kartoffelsuppe', 'Suppen', 7.90],
        ['Gulaschsuppe', 'Suppen', 8.90],
        ['Rinderbruehe mit Kloesschen', 'Suppen', 7.50],
        ['Kuerbissuppe', 'Suppen', 8.50],
        ['Linsensuppe mit Wurst', 'Suppen', 9.90],
        ['Erbsensuppe mit Speck', 'Suppen', 9.50],
        ['Zwiebelsuppe', 'Suppen', 7.90],
        ['Pilzcremesuppe', 'Suppen', 8.90],
        ['Bohneneintopf', 'Suppen', 9.90],
        ['Tomatensuppe mit Kraeutern', 'Suppen', 7.50],
        ['Gemischter Gartensalat', 'Salate', 8.90],
        ['Kartoffelsalat', 'Salate', 6.90],
        ['Gurkensalat mit Dill', 'Salate', 6.50],
        ['Krautsalat', 'Salate', 5.90],
        ['Wurstsalat', 'Salate', 10.90],
        ['Rote-Bete-Salat', 'Salate', 6.90],
        ['Bauernsalat', 'Salate', 9.90],
        ['Feldsalat mit Walnuss', 'Salate', 10.90],
        ['Karottensalat', 'Salate', 5.90],
        ['Tomatensalat mit Zwiebeln', 'Salate', 6.50],
        ['Brezel mit Butter', 'Vorspeisen', 3.90],
        ['Obatzda mit Brot', 'Vorspeisen', 8.90],
        ['Leberwurstbrot', 'Vorspeisen', 7.90],
        ['Schmalzbrot mit Zwiebeln', 'Vorspeisen', 6.90],
        ['Raeucherfischplatte', 'Vorspeisen', 12.90],
        ['Kartoffeltaschen', 'Vorspeisen', 8.50],
        ['Mini-Fleischbaellchen', 'Vorspeisen', 9.90],
        ['Hausgemachte Maultaschen', 'Vorspeisen', 10.90],
        ['Handkaese mit Musik', 'Vorspeisen', 8.90],
        ['Brotzeitbrett', 'Vorspeisen', 13.90],
        ['Apfelstrudel mit Vanillesauce', 'Desserts', 8.90],
        ['Kaiserschmarrn', 'Desserts', 9.90],
        ['Schwarzwaelder Kirschtorte', 'Desserts', 8.50],
        ['Bienenstich', 'Desserts', 7.90],
        ['Rote Gruetze mit Sahne', 'Desserts', 7.50],
        ['Vanillepudding mit Beeren', 'Desserts', 6.90],
        ['Quarkbaellchen', 'Desserts', 6.50],
        ['Marillenknodel', 'Desserts', 8.90],
        ['Lebkuchenparfait', 'Desserts', 8.90],
        ['Eisbecher Hausart', 'Desserts', 7.90],
        ['Apfelschorle', 'Getraenke', 3.90],
        ['Johannisbeerschorle', 'Getraenke', 4.20],
        ['Holunderschorle', 'Getraenke', 4.20],
        ['Mineralwasser still', 'Getraenke', 2.90],
        ['Mineralwasser classic', 'Getraenke', 2.90],
        ['Hausgemachte Limonade', 'Getraenke', 4.90],
        ['Orangensaft', 'Getraenke', 3.90],
        ['Traubensaft', 'Getraenke', 3.90],
        ['Alkoholfreies Bier', 'Getraenke', 4.20],
        ['Malzbier', 'Getraenke', 3.90],
        ['Pils vom Fass', 'Bier', 4.50],
        ['Helles vom Fass', 'Bier', 4.50],
        ['Weizenbier', 'Bier', 4.80],
        ['Dunkles Bier', 'Bier', 4.80],
        ['Koelsch', 'Bier', 4.20],
        ['Radler', 'Bier', 4.20],
        ['Bockbier', 'Bier', 5.20],
        ['Berliner Weisse', 'Bier', 4.90],
        ['Kellerbier', 'Bier', 4.90],
        ['Schwarzbier', 'Bier', 4.90],
        ['Filterkaffee', 'Heissgetraenke', 3.20],
        ['Espresso', 'Heissgetraenke', 2.80],
        ['Cappuccino', 'Heissgetraenke', 3.80],
        ['Milchkaffee', 'Heissgetraenke', 4.20],
        ['Latte Macchiato', 'Heissgetraenke', 4.50],
        ['Schwarzer Tee', 'Heissgetraenke', 3.20],
        ['Kraeutertee', 'Heissgetraenke', 3.20],
        ['Pfefferminztee', 'Heissgetraenke', 3.20],
        ['Heisse Schokolade', 'Heissgetraenke', 4.20],
        ['Gluehwein', 'Heissgetraenke', 4.90]
    ];

    const insertProduct = db.prepare(`
        INSERT OR IGNORE INTO products
            (sku, name, category, price, cost_price, quantity, min_stock, reorder_quantity)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const centralWarehouse = db.prepare('SELECT id FROM locations WHERE code = ?').get('WH-01');
    const insertLocationStock = db.prepare(`
        INSERT OR IGNORE INTO location_stock (location_id, product_id, quantity)
        VALUES (?, ?, ?)
    `);

    const seed = db.transaction(() => {
        menuItems.slice(0, 100).forEach(([name, category, price], index) => {
            const sku = `DE-MENU-${String(index + 1).padStart(3, '0')}`;
            const cost = Number((price * 0.38).toFixed(2));
            const quantity = index % 11 === 0 ? 6 : 25 + (index % 40);
            const result = insertProduct.run(sku, name, category, price, cost, quantity, 10, 30);
            const product = db.prepare('SELECT id FROM products WHERE sku = ?').get(sku);
            if (centralWarehouse && result.changes > 0) {
                insertLocationStock.run(centralWarehouse.id, product.id, quantity);
            }
        });
    });

    seed();
};

const seedGermanRestaurantSales = () => {
    const admin = db.prepare('SELECT id FROM users WHERE username = ?').get('admin1');
    const menuProducts = db.prepare(`
        SELECT id, price, cost_price FROM products WHERE sku LIKE 'DE-MENU-%' ORDER BY sku
    `).all();
    if (!admin || menuProducts.length === 0) return;

    const existingSales = db.prepare(`
        SELECT COUNT(*) as count FROM sales s
        JOIN products p ON p.id = s.product_id
        WHERE p.sku LIKE 'DE-MENU-%'
    `).get();
    if (existingSales.count > 0) return;

    const insertSale = db.prepare(`
        INSERT INTO sales
            (product_id, quantity, price_per_unit, cost_price, total_amount, user_id, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    const formatDate = (daysAgo, index) => {
        const date = new Date();
        date.setDate(date.getDate() - daysAgo);
        date.setHours(11 + (index % 8), 30, 0, 0);
        return date.toISOString().slice(0, 19).replace('T', ' ');
    };

    const seed = db.transaction(() => {
        menuProducts.forEach((product, index) => {
            const quantity = 2 + (index % 7);
            const daysAgo = index % 30;
            insertSale.run(
                product.id,
                quantity,
                product.price,
                product.cost_price,
                quantity * product.price,
                admin.id,
                formatDate(daysAgo, index)
            );
        });
    });
    seed();
};

const createTables = () => {
    // Users table
    db.exec(`
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

    db.exec(`
        CREATE TABLE IF NOT EXISTS login_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            ip_address TEXT,
            logged_in_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    `);

    // Products table
    db.exec(`
        CREATE TABLE IF NOT EXISTS products (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            sku TEXT UNIQUE NOT NULL,
            name TEXT NOT NULL,
            description TEXT,
            category TEXT,
            price REAL NOT NULL,
            cost_price REAL NOT NULL DEFAULT 0,
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
    db.exec(`
        CREATE TABLE IF NOT EXISTS sales (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            product_id INTEGER NOT NULL,
            quantity INTEGER NOT NULL,
            price_per_unit REAL NOT NULL,
            cost_price REAL NOT NULL DEFAULT 0,
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
    db.exec(`
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
    db.exec(`
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
    db.exec(`
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
    `);

    db.exec(`
        CREATE TABLE IF NOT EXISTS purchase_orders (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            order_number TEXT UNIQUE NOT NULL,
            supplier_id INTEGER NOT NULL,
            status TEXT DEFAULT 'DRAFT',
            notes TEXT,
            total_amount REAL DEFAULT 0,
            created_by INTEGER NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            received_at DATETIME,
            FOREIGN KEY (supplier_id) REFERENCES suppliers(id),
            FOREIGN KEY (created_by) REFERENCES users(id)
        )
    `);

    db.exec(`
        CREATE TABLE IF NOT EXISTS purchase_order_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            purchase_order_id INTEGER NOT NULL,
            product_id INTEGER NOT NULL,
            quantity INTEGER NOT NULL,
            unit_cost REAL NOT NULL,
            received_quantity INTEGER DEFAULT 0,
            FOREIGN KEY (purchase_order_id) REFERENCES purchase_orders(id),
            FOREIGN KEY (product_id) REFERENCES products(id)
        )
    `);

    db.exec(`
        CREATE TABLE IF NOT EXISTS locations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            code TEXT UNIQUE NOT NULL,
            address TEXT,
            type TEXT DEFAULT 'STORE',
            active BOOLEAN DEFAULT 1,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    db.exec(`
        CREATE TABLE IF NOT EXISTS location_stock (
            location_id INTEGER NOT NULL,
            product_id INTEGER NOT NULL,
            quantity INTEGER NOT NULL DEFAULT 0,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (location_id, product_id),
            FOREIGN KEY (location_id) REFERENCES locations(id),
            FOREIGN KEY (product_id) REFERENCES products(id)
        )
    `);

    db.exec(`
        CREATE TABLE IF NOT EXISTS stock_transfers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            product_id INTEGER NOT NULL,
            from_location_id INTEGER NOT NULL,
            to_location_id INTEGER NOT NULL,
            quantity INTEGER NOT NULL,
            status TEXT DEFAULT 'COMPLETED',
            notes TEXT,
            created_by INTEGER NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (product_id) REFERENCES products(id),
            FOREIGN KEY (from_location_id) REFERENCES locations(id),
            FOREIGN KEY (to_location_id) REFERENCES locations(id),
            FOREIGN KEY (created_by) REFERENCES users(id)
        )
    `);

    db.exec(`
        CREATE TABLE IF NOT EXISTS audit_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            action TEXT NOT NULL,
            entity_type TEXT,
            entity_id INTEGER,
            details TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    `);

    // Create indexes for performance
    db.exec(`CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku)`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode)`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_sales_product_id ON sales(product_id)`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_sales_created_at ON sales(created_at)`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_stock_movements_product_id ON stock_movements(product_id)`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_reorder_status ON reorder_requests(status)`);
};

module.exports = {
    initializeDb,
    db: () => db,
    audit: (userId, action, entityType, entityId, details = {}) => {
        try {
            db.prepare(`INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details) VALUES (?, ?, ?, ?, ?)`).run(userId || null, action, entityType || null, entityId || null, JSON.stringify(details));
        } catch (error) {
            console.error('Audit log error:', error.message);
        }
    },
    run: (sql, params = []) => {
        try {
            const stmt = db.prepare(sql);
            const result = stmt.run(...params);
            return Promise.resolve({ lastID: result.lastInsertRowid, changes: result.changes });
        } catch (error) {
            return Promise.reject(error);
        }
    },
    get: (sql, params = []) => {
        try {
            const stmt = db.prepare(sql);
            const row = stmt.get(...params);
            return Promise.resolve(row);
        } catch (error) {
            return Promise.reject(error);
        }
    },
    all: (sql, params = []) => {
        try {
            const stmt = db.prepare(sql);
            const rows = stmt.all(...params);
            return Promise.resolve(rows || []);
        } catch (error) {
            return Promise.reject(error);
        }
    }
};
