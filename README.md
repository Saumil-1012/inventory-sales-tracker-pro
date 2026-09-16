# Inventory & Sales Tracker Pro

A robust command-line inventory management system with role-based access control, real-time sales tracking, and comprehensive reporting capabilities.

## Overview

**Inventory & Sales Tracker Pro** is a multi-user inventory management solution designed for retail and warehouse operations. It provides role-based access (Admin/Staff), real-time stock monitoring, transaction history, and detailed business analytics.

### Key Features

- **Role-Based Access Control**: Admin and Staff roles with differentiated permissions
- **Inventory Management**: Add, edit, delete, and search products
- **Sales Tracking**: Record sales transactions with automatic timestamp logging
- **Stock Monitoring**: Real-time low-stock alerts and inventory value reports
- **Data Export**: Export sales records to CSV format
- **Backup & Recovery**: Automated file-based backup system
- **Advanced Queries**: Sort by price, filter by date, search by product/ID
- **Transaction Reversal**: Cancel sale entries with automatic stock restoration

## System Requirements

- **C++17** compatible compiler (GCC 7.0+, Clang 5.0+, MSVC 2017+)
- **Python 3.7+** (for monitoring utilities)
- **Unix/Linux/macOS/Windows** compatible shell
- Minimum 10MB free disk space

## Build Instructions

### Prerequisites

```bash
# macOS (using Homebrew)
brew install gcc

# Debian/Ubuntu
sudo apt-get install build-essential

# RHEL/CentOS
sudo yum install gcc-c++
```

### Compilation

```bash
# Clone or navigate to project root
cd inventory-sales-tracker-pro

# Build the project
make clean && make

# Run the application
make run

# Or execute directly
./inventory_tracker
```

### Build Targets

| Command | Action |
|---------|--------|
| `make all` | Compile all sources (default) |
| `make clean` | Remove compiled objects and executable |
| `make rebuild` | Full clean build |
| `make run` | Build and execute |

## Usage

### Login

On application start, authenticate with credentials:

```
=== Inventory & Sales Tracker Login ===
Username: admin
Password: admin123
```

**Default Accounts:**
- **Admin**: username: `admin`, password: `admin123`
- **Staff**: username: `staff`, password: `staff123`

> **Security Notice**: Change default credentials in `auth/login.cpp` before production deployment.

### Main Menu

#### Admin Functions
1. **View Inventory** - Display all products with current stock
2. **Add Product** - Create new product entry (ID, name, price, quantity)
3. **Edit Product** - Modify existing product details
4. **Delete Product** - Remove product from inventory
5. **Restock Product** - Add quantity to existing product
6. **Sell Product** - Record sales transaction with stock deduction
7. **View Sales History** - Display all recorded transactions
8. **Sales Report** - Summary statistics of sales transactions
9. **Top Selling Product** - Identify most-sold item by volume
10. **Backup Files** - Create copies of inventory and sales data
11. **Search Product** - Query by product ID or name
12. **Low Stock Alert** - Flag items below user-specified threshold
13. **Sort by Price** - Reorder inventory by price (ascending)
14. **Inventory Value Report** - Calculate total asset value
15. **Search Sales by Product** - Filter transactions by product
16. **Filter Sales by Date** - Display transactions from specific date
17. **Cancel Sale Entry** - Reverse a transaction and restore stock
18. **Export Sales to CSV** - Generate reportable CSV file
20. **Import from CSV** - Bulk load products from external file

#### Staff Functions
- Menu items 1, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18 available
- Items 2, 3, 4, 20 restricted (Admin only)

### Example Workflows

**Adding a Product (Admin)**
```
Choice: 2
Enter product ID: SKU001
Enter product name: Widget A
Enter price: 29.99
Enter quantity: 150
Product added successfully.
```

**Recording a Sale (Any User)**
```
Choice: 6
Enter product ID: SKU001
Enter quantity to sell: 5
Sale recorded successfully.
```

**Viewing Low Stock Items**
```
Choice: 12
Enter stock threshold: 20
LOW STOCK: Widget B (ID: SKU002) - Qty: 15
LOW STOCK: Gadget X (ID: SKU005) - Qty: 8
```

## Data Storage

### File Structure

```
inventory-sales-tracker-pro/
├── data/
│   ├── inventory.txt      # Product master data
│   └── sales.txt          # Transaction log
├── backup/
│   ├── inventory_backup.txt
│   └── sales_backup.txt
├── src files...
└── inventory_tracker      # Compiled executable
```

### Data Format

**inventory.txt** (space-delimited):
```
SKU001 Widget_A 29.99 145
SKU002 Widget_B 19.50 8
SKU003 Gadget_X 49.99 42
```

**sales.txt** (pipe-delimited):
```
SKU001 | 5 | Nov 20 2024 14:32:15
SKU002 | 2 | Nov 20 2024 15:18:42
```

## Architecture

### Core Components

**Inventory Module** (`inventory/inventory.{h,cpp}`)
- Product CRUD operations
- File persistence with in-memory cache
- Linear search optimization for datasets < 100K items
- CSV import/export with header detection

**Sales Module** (`sales/sales.{h,cpp}`)
- Transaction recording with UTC timestamps
- Aggregation queries (top products, date filtering)
- Sale reversal with inventory reconciliation
- CSV export for external reporting

**Auth Module** (`auth/login.{h,cpp}`)
- Role-based access enumeration (ADMIN, STAFF, INVALID)
- Credential verification (file-based, not encrypted)

**UI Module** (`ui/ui.{h,cpp}`)
- Cross-platform screen management (Windows/Unix)
- Menu system with role-aware filtering
- Input validation and buffering

**Utils Module** (`utils.{h,cpp}`)
- File backup with directory creation
- Error handling and resource cleanup

### Design Patterns

- **Separation of Concerns**: Data (Inventory/Sales) separate from UI
- **Encapsulation**: Private data members, public interfaces
- **Single Responsibility**: Each class handles one domain
- **Resource Management**: RAII-style destructors for file I/O

## Python Utilities

### Monitoring Tool (`realtime_data.py`)

Real-time inventory monitoring with low-stock alerting.

**Usage:**

```bash
# Start continuous monitoring
python3 realtime_data.py

# Generate report (one-time)
python3 realtime_data.py report

# Configure threshold (edit file)
LOW_STOCK_THRESHOLD = 10  # in realtime_data.py
```

**Output:**
- Logs low-stock events to `data/alerts.log`
- Console display with timestamp and product details
- Stop with Ctrl+C

## Performance Characteristics

| Operation | Complexity | Notes |
|-----------|-----------|-------|
| Product Lookup | O(n) | Linear search; suitable for n < 100K |
| Product Insert | O(1) | Append + file write |
| Product Delete | O(n) | Requires array compaction |
| Sales Query | O(n*m) | Full file scan per query |
| Sort by Price | O(n log n) | std::sort with comparator |

**Optimization Recommendations for Scale:**
- Implement B-tree or hash index for product lookups
- Use SQLite instead of flat files for >100K products
- Add in-memory caching with LRU eviction for sales queries
- Implement transaction logging for ACID compliance

## Security Considerations

⚠️ **Production Deployment Warnings:**

1. **Hardcoded Credentials**: Replace with hashed password file or LDAP integration
2. **No Encryption**: Sensitive data stored in plaintext; use encrypted filesystem
3. **Input Validation**: Limited; add regex/type validation before file writes
4. **Access Logging**: No audit trail; consider syslog integration
5. **File Permissions**: Ensure `data/` and `backup/` are readable only by app user

### Recommendations

```bash
# Set restrictive permissions
chmod 700 data/ backup/
chmod 600 data/*.txt backup/*.txt

# Run with minimal privileges
useradd -r -s /bin/false inventory_app
chown -R inventory_app:inventory_app /opt/inventory_tracker
```

## Troubleshooting

### Compilation Errors

**Error**: `error: 'to_string' is not a member of 'std'`
- **Solution**: Ensure `-std=c++17` flag is set in Makefile

**Error**: `undefined reference to 'Inventory::loadFromFile()'`
- **Solution**: Rebuild with `make clean && make`

### Runtime Issues

**"Backup failed: Could not open files"**
- Ensure `data/` directory exists and contains `inventory.txt` and `sales.txt`
- Check file permissions: `ls -la data/`

**"Product not found" when searching**
- Verify product ID exactly matches (case-sensitive)
- Try viewing full inventory first to confirm data exists

**"No sales history" / "No inventory data"**
- Files may be empty; add test data manually or via import

## Contributing

Code contributions should follow these guidelines:

1. **Naming Conventions**:
   - Classes: PascalCase (`ProductManager`)
   - Methods: camelCase (`loadFromFile()`)
   - Constants: UPPER_SNAKE_CASE (`MAX_PRODUCTS`)

2. **Error Handling**: All file operations should check open/read status
3. **Documentation**: Add comments for algorithms and non-obvious logic
4. **Testing**: Verify changes don't break existing menus/workflows

## License

See LICENSE file for details.

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | Nov 2024 | Initial release with core inventory/sales management |

## Support & Contact

For issues or feature requests, refer to internal project documentation or contact the development team.

---

**Last Updated**: November 2024  
**Status**: Production-Ready  
**Maintainer**: Development Team
