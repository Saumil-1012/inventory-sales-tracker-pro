#include "sales.h"
#include <iostream>
#include <fstream>
#include <sstream>
#include <map>
#include <ctime>

Sales::Sales(const std::string& filename) : filename(filename) {}

void Sales::sellProduct(Inventory& inventory) {
    int id, qty;
    std::cout << "Enter product ID: ";
    std::cin >> id;
    std::cout << "Enter quantity: ";
    std::cin >> qty;

    Product* product = inventory.getProduct(id);
    if (product && inventory.updateStock(id, qty)) {
        double total = product->price * qty;
        time_t now = time(0);

        std::ofstream out(filename, std::ios::app);
        out << product->id << "," << product->name << "," << qty << "," << total << "," << ctime(&now);
        std::cout << "Sale recorded. Total: $" << total << "\n";
    } else {
        std::cout << "Sale failed. Invalid product or insufficient stock.\n";
    }
}

void Sales::viewSales() const {
    std::ifstream in(filename);
    std::string line;
    std::cout << "\n--- Sales Record ---\n";
    while (getline(in, line)) {
        std::cout << line;
    }
}

void Sales::salesReport() const {
    std::ifstream in(filename);
    std::string line;
    int transactions = 0;
    double totalRevenue = 0;
    while (getline(in, line)) {
        std::stringstream ss(line);
        std::string id, name, qty, total;
        getline(ss, id, ',');
        getline(ss, name, ',');
        getline(ss, qty, ',');
        getline(ss, total, ',');
        totalRevenue += std::stod(total);
        transactions++;
    }
    std::cout << "\nTotal Transactions: " << transactions << "\nTotal Revenue: $" << totalRevenue << "\n";
}

void Sales::topSellingProduct() const {
    std::ifstream in(filename);
    std::string line;
    std::map<std::string, int> productSales;
    while (getline(in, line)) {
        std::stringstream ss(line);
        std::string id, name, qty;
        getline(ss, id, ',');
        getline(ss, name, ',');
        getline(ss, qty, ',');
        productSales[name] += std::stoi(qty);
    }

    std::string topProduct;
    int maxSold = 0;
    for (const auto& entry : productSales) {
        if (entry.second > maxSold) {
            maxSold = entry.second;
            topProduct = entry.first;
        }
    }
    std::cout << "\nTop Selling Product: " << topProduct << " (Sold " << maxSold << " units)\n";
}

void Sales::monthlySummary(const std::string& month) const {
    std::ifstream in(filename);
    std::string line;
    double revenue = 0;
    int count = 0;
    std::cout << "\nSales for " << month << ":\n";
    while (getline(in, line)) {
        if (line.find(month) != std::string::npos) {
            std::stringstream ss(line);
            std::string id, name, qty, total, date;
            getline(ss, id, ',');
            getline(ss, name, ',');
            getline(ss, qty, ',');
            getline(ss, total, ',');
            getline(ss, date);
            revenue += std::stod(total);
            count++;
            std::cout << line;
        }
    }
    std::cout << "\nTotal Sales in " << month << ": " << count << " | Revenue: $" << revenue << "\n";
}

void Sales::exportCSV(const std::string& outputFile) const {
    std::ifstream in(filename);
    std::ofstream out(outputFile);
    std::string line;
    out << "ProductID,Name,Quantity,Total,Date\n";
    while (getline(in, line)) {
        out << line;
    }
    std::cout << "Sales exported to " << outputFile << "\n";
}

void Sales::searchSalesByProduct(const std::string& keyword) const {
    std::ifstream in(filename);
    std::string line;
    bool found = false;
    std::cout << "\nSales matching \"" << keyword << "\":\n";
    while (getline(in, line)) {
        if (line.find(keyword) != std::string::npos) {
            std::cout << line;
            found = true;
        }
    }
    if (!found)
        std::cout << "No matching sales found.\n";
}

void Sales::filterSalesByDate(const std::string& date) const {
    std::ifstream in(filename);
    std::string line;
    bool found = false;
    std::cout << "\nSales on \"" << date << "\":\n";
    while (getline(in, line)) {
        if (line.find(date) != std::string::npos) {
            std::cout << line;
            found = true;
        }
    }
    if (!found)
        std::cout << "No sales found on this date.\n";
}

void Sales::cancelSaleEntry(int lineNumber, Inventory& inventory) {
    std::ifstream in(filename);
    std::vector<std::string> lines;
    std::string line;
    int current = 1;
    bool restored = false;

    while (getline(in, line)) {
        if (current == lineNumber) {
            std::stringstream ss(line);
            std::string idStr, name, qtyStr, totalStr, date;
            getline(ss, idStr, ',');
            getline(ss, name, ',');
            getline(ss, qtyStr, ',');
            getline(ss, totalStr, ',');
            getline(ss, date);
            int id = std::stoi(idStr);
            int qty = std::stoi(qtyStr);
            Product* p = inventory.getProduct(id);
            if (p) {
                p->quantity += qty;
                restored = true;
            }
        } else {
            lines.push_back(line);
        }
        current++;
    }
    in.close();

    std::ofstream out(filename);
    for (const auto& l : lines) {
        out << l;
    }

    if (restored) {
        std::cout << "Sale entry removed and inventory restored.\n";
    } else {
        std::cout << "Entry not found or product missing.\n";
    }
}
