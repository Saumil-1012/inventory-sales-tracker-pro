#include "ui.h"
#include <iostream>
#include <cstdlib>

namespace UI {
    
    void clearScreen() {
        #ifdef _WIN32
            system("cls");
        #else
            system("clear");
        #endif
    }

    void showBanner(const std::string& role) {
        std::cout << "\n";
        std::cout << "========================================\n";
        std::cout << "  Inventory & Sales Tracker Pro\n";
        std::cout << "  User: " << role << "\n";
        std::cout << "========================================\n\n";
    }

    void showMenu(bool isAdmin) {
        std::cout << "--- MAIN MENU ---\n\n";
        
        // Common operations for all users
        std::cout << " 1. View Inventory\n";
        std::cout << " 5. Restock Product\n";
        std::cout << " 6. Sell Product\n";
        std::cout << " 7. View Sales History\n";
        std::cout << " 8. Sales Report\n";
        std::cout << " 9. Top Selling Product\n";
        std::cout << "10. Backup Files\n";
        std::cout << "11. Search Product\n";
        std::cout << "12. Low Stock Alert\n";
        std::cout << "13. Sort Inventory by Price\n";
        std::cout << "14. Inventory Value Report\n";
        std::cout << "15. Search Sales by Product\n";
        std::cout << "16. Filter Sales by Date\n";
        std::cout << "17. Cancel Sale Entry\n";
        std::cout << "18. Export Sales to CSV\n";
        
        // Admin-only operations
        if (isAdmin) {
            std::cout << "\n--- ADMIN ONLY ---\n";
            std::cout << " 2. Add Product\n";
            std::cout << " 3. Edit Product\n";
            std::cout << " 4. Delete Product\n";
            std::cout << "20. Import from CSV\n";
        }
        
        std::cout << "\n19. Exit\n";
        std::cout << "\nEnter choice: ";
    }

    int getChoice() {
        int choice;
        if (!(std::cin >> choice)) {
            std::cin.clear();
            std::cin.ignore(10000, '\n');
            return -1;
        }
        return choice;
    }

    void pause() {
        std::cout << "\n--- Press Enter to continue ---";
        std::cin.ignore();
        std::cin.get();
    }
    
    void displayError(const std::string& message) {
        std::cerr << "\n✗ ERROR: " << message << "\n";
    }
    
    void displaySuccess(const std::string& message) {
        std::cout << "\n✓ " << message << "\n";
    }
}
