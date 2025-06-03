#include "utils.h"
#include <fstream>
#include <iostream>
#include <ctime>

void Utils::backupFiles() {
    std::ifstream inventory("data/inventory.txt");
    std::ifstream sales("data/sales.txt");
    std::ofstream invBackup("backup/inventory_backup.txt");
    std::ofstream salesBackup("backup/sales_backup.txt");

    if (inventory && sales) {
        invBackup << inventory.rdbuf();
        salesBackup << sales.rdbuf();
        std::cout << "Backup completed successfully.\n";
    } else {
        std::cout << "Backup failed: Could not open files.\n";
    }
}