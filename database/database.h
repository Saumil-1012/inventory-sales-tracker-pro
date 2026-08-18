#pragma once
#include <string>
#include <vector>
#include "inventory/inventory.h"

namespace DB {
    bool init(const std::string& dbFile);

    bool addProduct(const Product& p);
    bool updateProduct(const Product& p);
    bool deleteProduct(int id);
    bool getProduct(int id, Product& out);
    std::vector<Product> getAllProducts();

    bool recordSale(int productId, const std::string& name, int qty, double total);
    void viewSales();
    void exportSalesCSV(const std::string& output);
    void clearDatabase();
}
