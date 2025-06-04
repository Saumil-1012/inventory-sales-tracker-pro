# 🧾 Inventory & Sales Tracker – Terminal Edition (C++11)

A modular, file-based terminal application for small businesses to manage inventory and sales in real-time. Built in modern C++11 with extensibility in mind.

---

## 📌 Project Objective

Design a console-based system that:
- Manages product inventory (add/edit/delete)
- Tracks real-time sales
- Provides daily and monthly analytics
- Exports data for reporting and backup

---

## 🔧 Technical Stack

- Language: C++11
- Storage: Text-based (`inventory.txt`, `sales.txt`)
- Concepts: OOP, File I/O, Vectors, Time Handling, Sorting, Modularization
- Optional Extensions: CSV, SQLite, GUI with Qt

---

## 🧾 Inventory Management Features

- `addProduct()` – Add new product with ID, name, quantity, price
- `editProduct(int id)` – Update product name or price
- `deleteProduct(int id)` – Remove a product
- `viewInventory()` – Display all products
- `searchProduct(std::string keyword)` – Search by ID or name
- `lowStockAlert(int threshold)` – View items with low stock
- `updateStock(int id, int delta)` – Adjust stock after sales
- `restockProduct(int id, int amount)` – Increase product quantity
- `sortInventoryByPrice()` – View inventory sorted by price
- `inventoryValueReport()` – Calculate total inventory worth

---

## 💵 Sales Management Features

- `sellProduct()` – Register a sale and update inventory
- `viewSales()` – Show all sale logs
- `searchSalesByProduct()` – Search all sales for a product
- `salesReport()` – View total revenue and sales count
- `topSellingProduct()` – Identify most sold item
- `filterSalesByDate(std::string date)` – Filter sales by specific date
- `cancelSaleEntry(int lineNumber)` – Remove mistaken entry and restore stock

---

## 📊 Reporting / Analytics

- `dailySummary()` – Show today's total revenue
- `monthlySummary(std::string month)` – View summary for a specific month
- `stockToRevenueRatio()` – Compare total stock value to revenue
- `generateReportCSV()` – Export sales data to CSV
- `backupData()` – Backup all records to `/backup/`

---

## 📁 Data Format

**inventory.txt**
```
ProductID,Name,Quantity,Price
```

**sales.txt**
```
ProductID,Name,QuantitySold,TotalPrice,Timestamp
```

---

## 📈 Development Phases

1. **Core Features**: Add/Sell/View products
2. **Reporting**: Revenue, Top Sellers
3. **Search/Filter**: Date-based, name-based
4. **Utilities**: Backup, CSV Export
5. **(Optional)**: Admin login, GUI, SQLite backend

---

## 📄 License

MIT License – Free to use and modify.






🔁 ✅ Additional Functionalities You Can Implement
🧾 Advanced Inventory Management Functions
bulkImportInventory(std::string filename)
→ Import multiple products from a .csv or .txt file into inventory

checkProductExistence(int id)
→ Return true/false if a product with a given ID exists (for error prevention)

saveInventorySnapshot()
→ Save a snapshot of current inventory into backup/inventory_YYYYMMDD.txt

categoryWiseInventorySummary()
→ If products have categories (like fruit, dairy, etc.), show stock grouped by category

sortInventoryByQuantity()
→ Sort items based on remaining quantity (ascending or descending)

autoGenerateProductID()
→ Automatically assign new IDs for added products, avoiding duplicates

💵 Enhanced Sales Management Features
generateCustomerInvoice()
→ Create a human-readable invoice after each sale in invoices/

multiProductSale()
→ Support selling multiple different products in a single transaction

undoLastSale()
→ Undo the last sale entry and restore inventory

applyDiscount(int productID, double percent)
→ Apply a discount on a specific product during sale

dailySalesSummary(std::string date)
→ Show a summary for any selected day, not just today

markSaleAsReturned(int saleID)
→ Track customer returns and adjust inventory/revenue accordingly

📊 Enhanced Analytics & Reporting
generateTopNProductsReport(int N)
→ List top N best-selling products by quantity or revenue

compareDailyRevenues(std::string date1, std::string date2)
→ Compare revenue between two dates

averageBasketSize()
→ Calculate the average number of items per sale (helps in business insight)

revenuePerProduct()
→ How much each product has contributed to total revenue

identifyDeadStock()
→ List products that haven’t been sold for X days

🔐 Administrative & Utility Features
adminLogin()
→ Protect sensitive operations like delete/edit using password authentication

logErrorsToFile(std::string message)
→ Write program errors or failed operations into log.txt for debugging

autoBackupOnExit()
→ Automatically back up inventory and sales when user exits the program

generateHTMLReport()
→ Export inventory/sales report in a styled .html file for business use

restoreFromBackup(std::string fileName)
→ Restore old inventory or sales data from backup folder

🧪 Debug & Testing Utilities (for development)
runSelfTest()
→ Validate data consistency: inventory quantities, ID uniqueness, and file health

simulateRandomSales(int count)
→ For testing purposes, simulate N random sales and observe system behavior