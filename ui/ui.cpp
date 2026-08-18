#include "ui.h"
#include <cstdlib>
#include <iostream>
#include <limits>

void UI::showBanner(const std::string& role) {
    std::cout << "\033[1;36m========================================================\033[0m\n";
    std::cout << "     Futuristic Inventory & Sales Command Center  //  " << role << "\n";
    std::cout << "\033[1;36m========================================================\033[0m\n";
}

void UI::showPulseHeader(const std::string& title) {
    std::cout << "\n\033[1;32m[2030 OPS SIGNAL]\033[0m " << title << "\n";
}

void UI::showMenu(bool isAdmin) {
    std::cout << "\n1. View Inventory\n";
    if (isAdmin) {
        std::cout << "2. Add Product\n3. Edit Product\n4. Delete Product\n";
        std::cout << "20. Import Inventory from CSV\n";
    }
    std::cout << "5. Restock Product\n6. Sell Product\n7. View Sales\n8. Sales Report\n";
    std::cout << "9. Top Selling Product\n10. Backup Data\n11. Search Product\n";
    std::cout << "12. Low Stock Alert\n13. Sort Inventory by Price\n14. Inventory Value Report\n";
    std::cout << "15. Search Sales\n16. Filter Sales by Date\n17. Cancel Sale Entry\n";
    std::cout << "18. Export Sales CSV\n19. Exit\n21. 2030 Smart Pulse\n";
}

void UI::clearScreen() {
    if (std::getenv("TERM") != nullptr) {
        std::system("clear");
    }
}

void UI::pause() {
    std::cout << "\nPress Enter to continue...";
    std::cin.ignore(std::numeric_limits<std::streamsize>::max(), '\n');
}

int UI::getChoice() {
    int choice;
    std::cout << "Enter your choice: ";
    std::cin >> choice;
    if (std::cin.fail()) {
        std::cin.clear();
        std::cin.ignore(10000, '\n');
        return -1;
    }
    return choice;
}
