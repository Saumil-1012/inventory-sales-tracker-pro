#include <iostream>
#include "inventory/inventory.h"
#include "sales/sales.h"
#include "utils.h"
#include "auth/login.h"
#include "ui/ui.h"

int main() {
    Inventory inventory("data/inventory.txt");
    Sales sales("data/sales.txt");

    Role role = Auth::login();
    if (role == Role::INVALID) return 1;

    bool isAdmin = (role == Role::ADMIN);
    int choice;

    do {
        UI::clearScreen();
        UI::showBanner(isAdmin ? "Admin" : "Staff");
        UI::showMenu(isAdmin);
        choice = UI::getChoice();

        switch (choice) {
            case 1: inventory.display(); break;
            case 2: if (isAdmin) inventory.addProduct(); else std::cout << "Access denied.\n"; break;
            case 3: if (isAdmin) inventory.editProduct(); else std::cout << "Access denied.\n"; break;
            case 4: if (isAdmin) inventory.deleteProduct(); else std::cout << "Access denied.\n"; break;
            case 5: inventory.restockProduct(); break;
            case 6: sales.sellProduct(inventory); break;
            case 7: sales.viewSales(); break;
            case 8: sales.salesReport(); break;
            case 9: sales.topSellingProduct(); break;
            case 10: Utils::backupFiles(); break;
            case 11: {
                std::cin.ignore();
                std::string keyword;
                std::cout << "Enter product name or ID: ";
                std::getline(std::cin, keyword);
                inventory.searchProduct(keyword);
                break;
            }
            case 12: {
                int threshold;
                std::cout << "Enter stock threshold: ";
                std::cin >> threshold;
                inventory.lowStockAlert(threshold);
                break;
            }
            case 13: inventory.sortInventoryByPrice(); break;
            case 14: inventory.inventoryValueReport(); break;
            case 15: {
                std::cin.ignore();
                std::string keyword;
                std::cout << "Enter product name or ID: ";
                std::getline(std::cin, keyword);
                sales.searchSalesByProduct(keyword);
                break;
            }
            case 16: {
                std::cin.ignore();
                std::string date;
                std::cout << "Enter date (e.g. Jun 03): ";
                std::getline(std::cin, date);
                sales.filterSalesByDate(date);
                break;
            }
            case 17: {
                int line;
                std::cout << "Enter sale line number to cancel: ";
                std::cin >> line;
                sales.cancelSaleEntry(line, inventory);
                break;
            }
            case 18: sales.exportCSV("sales_export.csv"); break;
            case 19: std::cout << "Exiting...\n"; break;
            case 20: {
                if (isAdmin) {
                    std::cin.ignore();
                    std::string file;
                    std::cout << "Enter CSV file path: ";
                    std::getline(std::cin, file);
                    inventory.importFromCSV(file);
                } else {
                    std::cout << "Access denied.\n";
                }
                break;
            }
            default: std::cout << "Invalid choice.\n";
        }

        if (choice != 19) UI::pause();

    } while (choice != 19);

    return 0;
}
