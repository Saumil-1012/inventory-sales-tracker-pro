#pragma once
#include <string>
#include "inventory.h"

class Sales {
private:
    std::string filename;

public:
    Sales(const std::string& filename);
    void sellProduct(Inventory& inventory);
    void viewSales() const;
    void salesReport() const;
    void topSellingProduct() const;
    void monthlySummary(const std::string& month) const;
    void exportCSV(const std::string& outputFile) const;
};