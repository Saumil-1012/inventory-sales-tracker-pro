#pragma once
#include <string>
#include "inventory/inventory.h"

class Sales {
private:
    std::string filename;

public:
    Sales(const std::string& filename);
    void sellProduct(Inventory& inventory);
    void viewSales() const;
    void salesReport() const;
    void topSellingProduct() const;
    void smartSalesPulse() const;
    void monthlySummary(const std::string& month) const;
    void exportCSV(const std::string& outputFile) const;
    void searchSalesByProduct(const std::string& keyword) const;
    void filterSalesByDate(const std::string& date) const;
    void cancelSaleEntry(int lineNumber, Inventory& inventory);
};

