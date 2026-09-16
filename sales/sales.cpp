#include "sales.h"
#include "../inventory/inventory.h"
#include <iostream>
#include <fstream>
#include <iomanip>
#include <sstream>
#include <ctime>
#include <algorithm>

Sales::Sales(const std::string& filename) : filename(filename) {}

void Sales::sellProduct(Inventory& inventory) {
    std::string id;
    int qty;
    std::cout << "Enter product ID: ";
    std::cin >> id;
    std::cout << "Enter quantity to sell: ";
    std::cin >> qty;

    inventory.updateProduct(id, -qty);
    
    time_t now = time(0);
    tm* timeinfo = localtime(&now);
    char buffer[80];
    strftime(buffer, sizeof(buffer), "%b %d %Y %H:%M:%S", timeinfo);

    std::ofstream file(filename, std::ios::app);
    file << id << " | " << qty << " | " << buffer << "\n";
    file.close();
    std::cout << "Sale recorded successfully.\n";
}

void Sales::viewSales() const {
    std::ifstream file(filename);
    if (!file.is_open()) {
        std::cout << "No sales history.\n";
        return;
    }
    std::string line;
    std::cout << std::left << std::setw(15) << "Product ID" << std::setw(10) << "Quantity" << std::setw(30) << "Date\n";
    std::cout << std::string(55, '-') << "\n";
    while (std::getline(file, line)) {
        std::cout << line << "\n";
    }
    file.close();
}

void Sales::salesReport() const {
    std::ifstream file(filename);
    if (!file.is_open()) {
        std::cout << "No sales data.\n";
        return;
    }
    std::string line;
    int totalSales = 0;
    while (std::getline(file, line)) {
        totalSales++;
    }
    file.close();
    std::cout << "Total sales transactions: " << totalSales << "\n";
}

void Sales::topSellingProduct() const {
    std::ifstream file(filename);
    if (!file.is_open()) {
        std::cout << "No sales data available.\n";
        return;
    }
    
    std::map<std::string, int> productSales;
    std::string line;
    
    while (std::getline(file, line)) {
        if (line.empty()) continue;
        
        // Parse: ID|Quantity|Timestamp
        size_t pos1 = line.find('|');
        if (pos1 == std::string::npos) continue;
        
        std::string id = line.substr(0, pos1);
        size_t pos2 = line.find('|', pos1 + 1);
        if (pos2 == std::string::npos) continue;
        
        try {
            int qty = std::stoi(line.substr(pos1 + 1, pos2 - pos1 - 1));
            productSales[id] += qty;
        } catch (const std::exception& e) {
            std::cerr << "WARNING: Malformed sales entry: " << line << "\n";
        }
    }
    file.close();
    
    if (productSales.empty()) {
        std::cout << "No sales transactions recorded.\n";
        return;
    }
    
    // Find top seller
    std::string topProduct;
    int maxQty = 0;
    
    for (const auto& entry : productSales) {
        if (entry.second > maxQty) {
            maxQty = entry.second;
            topProduct = entry.first;
        }
    }
    
    std::cout << "Top Selling Product: " << topProduct << " (" << maxQty << " units)\n";
}

void Sales::monthlySummary(const std::string& month) const {
    std::ifstream file(filename);
    if (!file.is_open()) return;
    std::string line;
    int count = 0;
    while (std::getline(file, line)) {
        if (line.find(month) != std::string::npos) {
            count++;
        }
    }
    file.close();
    std::cout << "Sales in " << month << ": " << count << " transactions.\n";
}

void Sales::exportCSV(const std::string& outputFile) const {
    std::ifstream infile(filename);
    std::ofstream outfile(outputFile);
    if (!infile.is_open() || !outfile.is_open()) {
        std::cout << "Export failed.\n";
        return;
    }
    outfile << "Product ID,Quantity,Date\n";
    std::string line;
    while (std::getline(infile, line)) {
        outfile << line << "\n";
    }
    infile.close();
    outfile.close();
    std::cout << "Exported to " << outputFile << "\n";
}

void Sales::searchSalesByProduct(const std::string& keyword) const {
    std::ifstream file(filename);
    if (!file.is_open()) {
        std::cout << "No sales data.\n";
        return;
    }
    std::string line;
    bool found = false;
    while (std::getline(file, line)) {
        if (line.find(keyword) != std::string::npos) {
            std::cout << line << "\n";
            found = true;
        }
    }
    file.close();
    if (!found) std::cout << "No sales found for this product.\n";
}

void Sales::filterSalesByDate(const std::string& date) const {
    std::ifstream file(filename);
    if (!file.is_open()) {
        std::cout << "No sales data.\n";
        return;
    }
    std::string line;
    bool found = false;
    while (std::getline(file, line)) {
        if (line.find(date) != std::string::npos) {
            std::cout << line << "\n";
            found = true;
        }
    }
    file.close();
    if (!found) std::cout << "No sales found for this date.\n";
}

void Sales::cancelSaleEntry(int lineNumber, Inventory& inventory) {
    std::ifstream infile(filename);
    if (!infile.is_open()) return;
    
    std::vector<std::string> lines;
    std::string line;
    int lineCount = 0;
    
    while (std::getline(infile, line)) {
        lineCount++;
        if (lineCount == lineNumber) {
            std::stringstream ss(line);
            std::string id, qty_str;
            std::getline(ss, id, '|');
            std::getline(ss, qty_str, '|');
            int qty = std::stoi(qty_str);
            inventory.updateProduct(id, qty); // restore quantity
        } else {
            lines.push_back(line);
        }
    }
    infile.close();

    std::ofstream outfile(filename);
    for (const auto& l : lines) {
        outfile << l << "\n";
    }
    outfile.close();
    std::cout << "Sale entry cancelled.\n";
}
