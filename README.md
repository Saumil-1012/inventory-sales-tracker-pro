# Inventory & Sales Tracker Pro (C++)

A terminal-based Inventory and Sales Tracker for small businesses written in C++.

## 🔧 Features

- Add, Edit, Delete products from inventory
- Real-time stock update after each sale
- Track and store sales with timestamp
- Sales analytics (total revenue, top-selling product)
- Monthly sales summary
- CSV export for business records
- Backup system to prevent data loss

## 🖥️ How to Run

```bash
make
./tracker
```

## 📁 Data Files

- `data/inventory.txt` – product ID, name, quantity, price
- `data/sales.txt` – logged sales
- `backup/` – auto backup folder

## 📤 CSV Export

Generates a `sales_export.csv` file with all transactions.

## 📅 Monthly Summary

Filter and report monthly revenue and sales count.

## 📜 License

MIT – free for commercial or personal use.