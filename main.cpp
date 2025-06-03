#include <iostream>
#include "inventory.h"
#include "sales.h"

int main() {
    Inventory inventory("data/inventory.txt");
    Sales sales("data/sales.txt");

    int choice;
    do {
        std::cout << "\n--- Inventory & Sales Tracker Pro ---\n";
        std::cout << "1. View Inventory\n2. Add Product\n3. Edit Product\n4. Delete Product\n";
        std::cout << "5. Restock Product\n6. Sell Product\n7. View Sales\n8. Sales Report\n";
        std::cout << "9. Top Selling Product\n10. Backup Data\n11. Exit\n";
        std::cout << "Enter choice: ";
        std::cin >> choice;

        switch (choice) {
            case 1: inventory.display(); break;
            case 2: inventory.addProduct(); break;
            case 3: inventory.editProduct(); break;
            case 4: inventory.deleteProduct(); break;
            case 5: inventory.restockProduct(); break;
            case 6: sales.sellProduct(inventory); break;
            case 7: sales.viewSales(); break;
            case 8: sales.salesReport(); break;
            case 9: sales.topSellingProduct(); break;
            case 10: Utils::backupFiles(); break;
            case 11: std::cout << "Exiting...\n"; break;
            default: std::cout << "Invalid choice.\n";
        }
    } while (choice != 11);

    return 0;
}