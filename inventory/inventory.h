#pragma once
#include <string>
#include <vector>

struct Product {
    std::string id;
    std::string name;
    double price;
    int quantity;
};

class Inventory {
private:
    std::string filename;
    std::vector<Product> products;
    void loadFromFile();
    bool saveToFile();
    int findProductIndex(const std::string& id) const;

public:
    Inventory(const std::string& filename);
    ~Inventory();
    void display() const;
    void addProduct();
    void editProduct();
    void deleteProduct();
    void restockProduct();
    void searchProduct(const std::string& keyword) const;
    void lowStockAlert(int threshold) const;
    void sortInventoryByPrice();
    void inventoryValueReport() const;
    void importFromCSV(const std::string& csvFile);
    const std::vector<Product>& getProducts() const;
    void updateProduct(const std::string& id, int quantityChange);
};
