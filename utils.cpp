#include "utils.h"
#include <fstream>
#include <iostream>
#include <ctime>
#include <sys/stat.h>

void Utils::backupFiles() {
    mkdir("backup", 0755);
    std::ifstream inventory("data/inventory.txt");
    std::ifstream sales("data/sales.txt");
    std::ofstream invBackup("backup/inventory_backup.txt");
    std::ofstream salesBackup("backup/sales_backup.txt");

    if (inventory && sales) {
        invBackup << inventory.rdbuf();
        salesBackup << sales.rdbuf();
        std::cout << "Backup completed successfully.\n";
        inventory.close();
        sales.close();
        invBackup.close();
        salesBackup.close();
    } else {
        std::cout << "Backup failed: Could not open files.\n";
    }
}