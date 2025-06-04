#include "database/database.h"
#include <sqlite3.h>
#include <iostream>
#include <fstream>

static sqlite3* db = nullptr;

bool DB::init(const std::string& dbFile) {
    int rc = sqlite3_open(dbFile.c_str(), &db);
    if (rc != SQLITE_OK) {
        std::cerr << "Cannot open database: " << sqlite3_errmsg(db) << "\n";
        return false;
    }

 const char* createInventory = "CREATE TABLE IF NOT EXISTS inventory ("
                              "id INTEGER PRIMARY KEY,"
                              "name TEXT,"
                              "quantity INTEGER,"
                              "price REAL);";


    const char* createSales = "CREATE TABLE IF NOT EXISTS sales ("
        "id INTEGER PRIMARY KEY AUTOINCREMENT,"
        "product_id INTEGER,"
        "product_name TEXT,"
        "quantity_sold INTEGER,"
        "total_price REAL,"
        "timestamp TEXT); ";

    char* errMsg = nullptr;
    rc = sqlite3_exec(db, createInventory, nullptr, nullptr, &errMsg);
    if (rc != SQLITE_OK) {
        std::cerr << "SQL error: " << errMsg << "\n";
        sqlite3_free(errMsg);
        return false;
    }

    rc = sqlite3_exec(db, createSales, nullptr, nullptr, &errMsg);
    if (rc != SQLITE_OK) {
        std::cerr << "SQL error: " << errMsg << "\n";
        sqlite3_free(errMsg);
        return false;
    }

    return true;
}

bool DB::addProduct(const Product& p) {
    const char* sql = "INSERT INTO inventory (id, name, quantity, price) VALUES (?, ?, ?, ?);";
    sqlite3_stmt* stmt;
    sqlite3_prepare_v2(db, sql, -1, &stmt, nullptr);
    sqlite3_bind_int(stmt, 1, p.id);
    sqlite3_bind_text(stmt, 2, p.name.c_str(), -1, SQLITE_TRANSIENT);
    sqlite3_bind_int(stmt, 3, p.quantity);
    sqlite3_bind_double(stmt, 4, p.price);
    bool success = sqlite3_step(stmt) == SQLITE_DONE;
    sqlite3_finalize(stmt);
    return success;
}

bool DB::updateProduct(const Product& p) {
    const char* sql = "UPDATE inventory SET name = ?, quantity = ?, price = ? WHERE id = ?;";
    sqlite3_stmt* stmt;
    sqlite3_prepare_v2(db, sql, -1, &stmt, nullptr);
    sqlite3_bind_text(stmt, 1, p.name.c_str(), -1, SQLITE_TRANSIENT);
    sqlite3_bind_int(stmt, 2, p.quantity);
    sqlite3_bind_double(stmt, 3, p.price);
    sqlite3_bind_int(stmt, 4, p.id);
    bool success = sqlite3_step(stmt) == SQLITE_DONE;
    sqlite3_finalize(stmt);
    return success;
}

bool DB::deleteProduct(int id) {
    const char* sql = "DELETE FROM inventory WHERE id = ?;";
    sqlite3_stmt* stmt;
    sqlite3_prepare_v2(db, sql, -1, &stmt, nullptr);
    sqlite3_bind_int(stmt, 1, id);
    bool success = sqlite3_step(stmt) == SQLITE_DONE;
    sqlite3_finalize(stmt);
    return success;
}

bool DB::recordSale(int productId, const std::string& name, int qty, double total) {
    const char* sql = "INSERT INTO sales (product_id, product_name, quantity_sold, total_price, timestamp) VALUES (?, ?, ?, ?, datetime('now'));";
    sqlite3_stmt* stmt;
    sqlite3_prepare_v2(db, sql, -1, &stmt, nullptr);
    sqlite3_bind_int(stmt, 1, productId);
    sqlite3_bind_text(stmt, 2, name.c_str(), -1, SQLITE_TRANSIENT);
    sqlite3_bind_int(stmt, 3, qty);
    sqlite3_bind_double(stmt, 4, total);
    bool success = sqlite3_step(stmt) == SQLITE_DONE;
    sqlite3_finalize(stmt);
    return success;
}

void DB::viewSales() {
    const char* sql = "SELECT product_id, product_name, quantity_sold, total_price, timestamp FROM sales;";
    sqlite3_stmt* stmt;
    sqlite3_prepare_v2(db, sql, -1, &stmt, nullptr);
    while (sqlite3_step(stmt) == SQLITE_ROW) {
        int id = sqlite3_column_int(stmt, 0);
        const char* name = reinterpret_cast<const char*>(sqlite3_column_text(stmt, 1));
        int qty = sqlite3_column_int(stmt, 2);
        double price = sqlite3_column_double(stmt, 3);
        const char* time = reinterpret_cast<const char*>(sqlite3_column_text(stmt, 4));

        std::cout << id << ", " << name << ", " << qty << ", $" << price << ", " << time << "\n";
    }
    sqlite3_finalize(stmt);
}

void DB::exportSalesCSV(const std::string& output) {
    std::ofstream out(output);
    out << "ProductID,Name,QuantitySold,TotalPrice,Timestamp\n";
    const char* sql = "SELECT product_id, product_name, quantity_sold, total_price, timestamp FROM sales;";
    sqlite3_stmt* stmt;
    sqlite3_prepare_v2(db, sql, -1, &stmt, nullptr);
    while (sqlite3_step(stmt) == SQLITE_ROW) {
        out << sqlite3_column_int(stmt, 0) << ','
            << reinterpret_cast<const char*>(sqlite3_column_text(stmt, 1)) << ','
            << sqlite3_column_int(stmt, 2) << ','
            << sqlite3_column_double(stmt, 3) << ','
            << reinterpret_cast<const char*>(sqlite3_column_text(stmt, 4)) << "\n";
    }
    sqlite3_finalize(stmt);
}