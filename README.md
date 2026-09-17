# Inventory & Sales Tracker Pro

A full-stack inventory and restaurant operations dashboard built with React, Express, and SQLite.

## Features

- Dashboard KPIs, sales charts, and revenue distribution
- Inventory management with cost price and margin tracking
- 100 German restaurant menu products included for demonstration
- Sales recording and transaction reversal
- Profit analytics by product and category
- Inventory intelligence: ABC analysis, stockout risk, turnover, dead stock, and overstock
- Supplier management and purchase orders
- Purchase receiving with automatic inventory updates
- Multi-location stock and warehouse/store transfers
- Demand forecasting and reorder recommendations
- Role management, audit logs, and database backups
- Responsive React interface

## Requirements

- Node.js 20 or newer
- npm
- macOS, Linux, or Windows

## Run Locally

Open two terminals from the repository root.

### 1. Start the backend

```bash
cd backend
npm install
PORT=3001 npm start
```

The API runs at `http://localhost:3001`.

### 2. Start the frontend

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:3000` in a browser.

The database is created automatically at `backend/data/inventory.db`. On first startup, demo users, suppliers, locations, restaurant products, and sales history are seeded automatically. Existing data is preserved on later starts.

## Demo Login

- Admin: `admin1` / `Saumil123`
- Staff: `staff1` / `staff123`

## Main Screens

- **Dashboard**: sales, revenue, inventory value, and charts
- **Inventory**: products, stock levels, margins, and barcodes
- **Sales**: record and reverse transactions
- **Analytics**: profitability and inventory intelligence
- **Purchasing**: suppliers, purchase orders, and receiving
- **Locations**: warehouse/store stock and transfers
- **Operations**: forecasts, reorder requests, user roles, audit logs, and backups
- **Settings**: password, login history, preferences, and dark mode

## Production Build

```bash
cd frontend
npm run build
```

The backend can also be started with Docker from the repository root:

```bash
docker compose up --build
```

For production, set a strong `JWT_SECRET` and use a managed database instead of the local SQLite file.

## SaaS Production Foundation

The repository includes a PostgreSQL service, tenant/subscription schema, recipe and ingredient schema, and a migration runner. To apply the PostgreSQL foundation locally:

```bash
docker compose up -d db
cd backend
DATABASE_URL=postgresql://inventory_user:change-me@localhost:5432/inventory_saas npm run migrate:postgres
```

The existing SQLite demo remains the default local development mode while tenant-aware query wiring and Stripe checkout are completed. Do not use the SQLite mode for production customer data.

Organization accounts use the PostgreSQL SaaS APIs. The legacy SQLite inventory, sales, analytics, purchasing, locations, and operations endpoints reject organization tokens so demo data cannot leak between tenants.
