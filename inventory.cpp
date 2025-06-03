#include "inventory.h"
#include <iostream>
#include <fstream>
#include <sstream>
#include <algorithm>

Inventory::Inventory(const std::string& filename) : filename(filename) {
    load();
}


void Inventory::load() {
    products.clear();
    std::ifstream in(filename);
    std::string line;
    while (getline(in, line)) {
        std::stringstream ss(line);
        Product p;
        std::string quantity, price;
        getline(ss, line, ','); p.id = std::stoi(line);
        getline(ss, p.name, ',');
        getline(ss, quantity, ','); p.quantity = std::stoi(quantity);
        getline(ss, price); p.price = std::stod(price);
        products.push_back(p);
    }
}

void Inventory::save() {
    std::ofstream out(filename);
    for (auto& p : products)
        out << p.id << "," << p.name << "," << p.quantity << "," << p.price << "\n";
}

void Inventory::display() const {
    std::cout << "\nID | Name      | Qty | Price\n";
    for (const auto& p : products) {
        std::cout << p.id << "  | " << p.name << " | " << p.quantity << " | $" << p.price << "\n";
    }
}

void Inventory::addProduct() {
    Product p;
    p.id = products.empty() ? 1 : products.back().id + 1;
    std::cin.ignore();
    std::cout << "Enter name: ";
    getline(std::cin, p.name);
    std::cout << "Enter quantity: ";
    std::cin >> p.quantity;
    std::cout << "Enter price: ";
    std::cin >> p.price;
    products.push_back(p);
    save();
    std::cout << "Product added.\n";
}

void Inventory::editProduct() {
    int id;
    std::cout << "Enter product ID to edit: ";
    std::cin >> id;
    for (auto& p : products) {
        if (p.id == id) {
            std::cin.ignore();
            std::cout << "New name: ";
            getline(std::cin, p.name);
            std::cout << "New price: ";
            std::cin >> p.price;
            save();
            std::cout << "Product updated.\n";
            return;
        }
    }
    std::cout << "Product not found.\n";
}

void Inventory::deleteProduct() {
    int id;
    std::cout << "Enter product ID to delete: ";
    std::cin >> id;
    auto it = std::remove_if(products.begin(), products.end(), [id](const Product& p) { return p.id == id; });
    if (it != products.end()) {
        products.erase(it, products.end());
        save();
        std::cout << "Product deleted.\n";
    } else {
        std::cout << "Product not found.\n";
    }
}

void Inventory::restockProduct() {
    int id, qty;
    std::cout << "Enter product ID: ";
    std::cin >> id;
    std::cout << "Enter quantity to add: ";
    std::cin >> qty;
    for (auto& p : products) {
        if (p.id == id) {
            p.quantity += qty;
            save();
            std::cout << "Stock updated.\n";
            return;
        }
    }
    std::cout << "Product not found.\n";
}

bool Inventory::updateStock(int id, int quantityChange) {
    for (auto& p : products) {
        if (p.id == id && p.quantity >= quantityChange) {
            p.quantity -= quantityChange;
            save();
            return true;
        }
    }
    return false;
}

Product* Inventory::getProduct(int id) {
    for (auto& p : products)
        if (p.id == id) return &p;
    return nullptr;
}