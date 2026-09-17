# Inventory & Sales Tracker Pro - Backend

Production-ready Node.js/Express REST API with SQLite database.

## Quick Start

```bash
# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Start server
npm start

# Development with auto-reload
npm run dev
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Create new user
- `POST /api/auth/login` - Login and get JWT token

### Inventory
- `GET /api/inventory` - List all products
- `GET /api/inventory/:id` - Get product details
- `GET /api/inventory/search/:query` - Search by SKU/barcode
- `POST /api/inventory` - Create product (Admin only)
- `PUT /api/inventory/:id` - Update product (Admin only)
- `DELETE /api/inventory/:id` - Delete product (Admin only)
- `POST /api/inventory/:id/adjust-stock` - Adjust stock quantity

### Sales
- `POST /api/sales` - Record a sale
- `GET /api/sales` - View sales history
- `GET /api/sales/report/:start_date/:end_date` - Sales report
- `POST /api/sales/:id/cancel` - Cancel/reverse a sale

### Analytics
- `GET /api/analytics/dashboard` - Dashboard stats
- `GET /api/analytics/top-products` - Top selling products
- `GET /api/analytics/sales-trend/:days` - Sales trend
- `GET /api/analytics/stock-history/:product_id` - Stock movements
- `GET /api/analytics/category-breakdown` - Category sales

## Database Schema

Tables:
- `users` - User accounts with roles (ADMIN, STAFF)
- `products` - Product catalog with stock levels
- `sales` - Sales transactions
- `stock_movements` - Audit trail of all stock changes
- `suppliers` - Supplier information
- `reorder_requests` - Automated reorder requests

## Security

- JWT token-based authentication
- Bcrypt password hashing
- Role-based access control (RBAC)
- Input validation with express-validator
- SQL injection prevention (parameterized queries)
- CORS protection with helmet

## Testing

```bash
# Example: Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'

# Example: Create product (with token)
curl -X POST http://localhost:5000/api/inventory \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"sku":"SKU001","name":"Widget","price":29.99,"quantity":100}'

# Example: Record sale
curl -X POST http://localhost:5000/api/sales \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"product_id":1,"quantity":5,"price_per_unit":29.99}'
```

## Performance

- Indexed queries on SKU, barcode, product_id
- Connection pooling ready
- Pagination support for large datasets
- Response caching headers

## Production Deployment

1. Generate strong JWT_SECRET
2. Use environment-specific .env files
3. Enable HTTPS/TLS
4. Set up database backups
5. Configure rate limiting
6. Enable request logging
7. Use process manager (PM2, systemd)

## Contributing

See CONTRIBUTING.md for code standards.
