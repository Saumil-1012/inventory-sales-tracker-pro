#pragma once
#include <vector>
#include <string>

struct Product {
    int id;
    std::string name;
    int quantity;
    double price;
};


class Inventory {
private:
    std::string filename;
    std::vector<Product> products;
    void load();
    void save();

public:
    Inventory(const std::string& filename);
    void display() const;
    void addProduct();
    void editProduct();
    void deleteProduct();
    void restockProduct();
    bool updateStock(int id, int quantityChange);
    Product* getProduct(int id);
};