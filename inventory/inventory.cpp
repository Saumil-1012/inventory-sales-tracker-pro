#include "inventory.h"
#include <iostream>
#include <fstream>
#include <algorithm>
#include <iomanip>
#include <sstream>

Inventory::Inventory(const std::string& filename) : filename(filename) {
    loadFromFile();
}

Inventory::~Inventory() {
    saveToFile();
}

void Inventory::loadFromFile() {
    std::ifstream file(filename);
    if (!file.is_open()) {
        // File doesn't exist yet; will be created on first save
        return;
    }

    Product p;
    int lineNum = 0;
    
    while (file >> p.id >> p.name >> p.price >> p.quantity) {
        if (p.price < 0 || p.quantity < 0) {
            std::cerr << "WARNING: Invalid data on line " << lineNum 
                      << "; skipping product " << p.id << "\n";
            continue;
        }
        products.push_back(p);
        lineNum++;
    }
    
    file.close();
}

bool Inventory::saveToFile() {
    std::ofstream file(filename);
    if (!file.is_open()) {
        return false;
    }
    
    for (const auto& p : products) {
        file << p.id << " " << p.name << " " << p.price << " " << p.quantity << "\n";
    }
    
    bool success = file.good();
    file.close();
    return success;
}

int Inventory::findProductIndex(const std::string& id) const {
    for (size_t i = 0; i < products.size(); ++i) {
        if (products[i].id == id) return i;
    }
    return -1;
}

void Inventory::display() const {
    if (products.empty()) {
        std::cout << "No products in inventory.\n";
        return;
    }
    std::cout << std::left << std::setw(10) << "ID" << std::setw(20) << "Name" 
              << std::setw(10) << "Price" << std::setw(10) << "Quantity\n";
    std::cout << std::string(50, '-') << "\n";
    for (const auto& p : products) {
        std::cout << std::left << std::setw(10) << p.id << std::setw(20) << p.name 
                  << std::setw(10) << p.price << std::setw(10) << p.quantity << "\n";
    }
}

void Inventory::addProduct() {
    Product p;
    
    std::cout << "Enter product ID: ";
    std::cin >> p.id;
    
    if (findProductIndex(p.id) != -1) {
        std::cerr << "ERROR: Product ID '" << p.id << "' already exists.\n";
        return;
    }
    
    std::cin.ignore();
    std::cout << "Enter product name: ";
    std::getline(std::cin, p.name);
    
    if (p.name.empty()) {
        std::cerr << "ERROR: Product name cannot be empty.\n";
        return;
    }
    
    std::cout << "Enter price: $";
    if (!(std::cin >> p.price) || p.price < 0) {
        std::cerr << "ERROR: Invalid price. Must be a non-negative number.\n";
        std::cin.clear();
        std::cin.ignore(10000, '\n');
        return;
    }
    
    std::cout << "Enter quantity: ";
    if (!(std::cin >> p.quantity) || p.quantity < 0) {
        std::cerr << "ERROR: Invalid quantity. Must be a non-negative integer.\n";
        std::cin.clear();
        std::cin.ignore(10000, '\n');
        return;
    }
    
    products.push_back(p);
    if (!saveToFile()) {
        std::cerr << "ERROR: Failed to save product to file.\n";
        products.pop_back();
        return;
    }
    
    std::cout << "✓ Product added: ID=" << p.id << ", Name=" << p.name << "\n";
}

void Inventory::editProduct() {
    std::string id;
    std::cout << "Enter product ID to edit: ";
    std::cin >> id;
    int idx = findProductIndex(id);
    if (idx == -1) {
        std::cout << "Product not found.\n";
        return;
    }
    std::cin.ignore();
    std::cout << "Enter new name: ";
    std::getline(std::cin, products[idx].name);
    std::cout << "Enter new price: ";
    std::cin >> products[idx].price;
    std::cout << "Enter new quantity: ";
    std::cin >> products[idx].quantity;
    saveToFile();
    std::cout << "Product updated successfully.\n";
}

void Inventory::deleteProduct() {
    std::string id;
    std::cout << "Enter product ID to delete: ";
    std::cin >> id;
    int idx = findProductIndex(id);
    if (idx == -1) {
        std::cout << "Product not found.\n";
        return;
    }
    products.erase(products.begin() + idx);
    saveToFile();
    std::cout << "Product deleted successfully.\n";
}

void Inventory::restockProduct() {
    std::string id;
    std::cout << "Enter product ID: ";
    std::cin >> id;
    int idx = findProductIndex(id);
    if (idx == -1) {
        std::cout << "Product not found.\n";
        return;
    }
    int qty;
    std::cout << "Enter quantity to add: ";
    std::cin >> qty;
    products[idx].quantity += qty;
    saveToFile();
    std::cout << "Restocked successfully.\n";
}

void Inventory::searchProduct(const std::string& keyword) const {
    bool found = false;
    for (const auto& p : products) {
        if (p.id.find(keyword) != std::string::npos || 
            p.name.find(keyword) != std::string::npos) {
            std::cout << p.id << " | " << p.name << " | " << p.price << " | " << p.quantity << "\n";
            found = true;
        }
    }
    if (!found) std::cout << "No products found.\n";
}

void Inventory::lowStockAlert(int threshold) const {
    bool found = false;
    for (const auto& p : products) {
        if (p.quantity < threshold) {
            std::cout << "LOW STOCK: " << p.name << " (ID: " << p.id << ") - Qty: " << p.quantity << "\n";
            found = true;
        }
    }
    if (!found) std::cout << "No low stock items.\n";
}

void Inventory::sortInventoryByPrice() {
    std::sort(products.begin(), products.end(), [](const Product& a, const Product& b) {
        return a.price < b.price;
    });
    saveToFile();
    std::cout << "Inventory sorted by price.\n";
    display();
}

void Inventory::inventoryValueReport() const {
    double totalValue = 0;
    for (const auto& p : products) {
        totalValue += p.price * p.quantity;
    }
    std::cout << "Total Inventory Value: $" << std::fixed << std::setprecision(2) << totalValue << "\n";
}

void Inventory::importFromCSV(const std::string& csvFile) {
    std::ifstream file(csvFile);
    if (!file.is_open()) {
        std::cout << "Could not open CSV file.\n";
        return;
    }
    std::string line;
    std::getline(file, line); // skip header
    while (std::getline(file, line)) {
        std::stringstream ss(line);
        Product p;
        char comma;
        ss >> p.id >> comma >> p.name >> comma >> p.price >> comma >> p.quantity;
        products.push_back(p);
    }
    file.close();
    saveToFile();
    std::cout << "CSV imported successfully.\n";
}

const std::vector<Product>& Inventory::getProducts() const {
    return products;
}

void Inventory::updateProduct(const std::string& id, int quantityChange) {
    int idx = findProductIndex(id);
    if (idx != -1) {
        products[idx].quantity += quantityChange;
        saveToFile();
    }
}
