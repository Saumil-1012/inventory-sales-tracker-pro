#include "utils.h"
#include <sys/stat.h>
#include <sys/types.h>
#include <fstream>
#include <iostream>
#include <ctime>


void Utils::backupFiles() {
    const std::string backupDir = "backup";
    mkdir(backupDir.c_str(), 0777);

    std::ifstream inventory("Data/inventory.txt");
    std::ifstream sales("Data/sales.txt");
    std::ofstream invBackup(backupDir + "/inventory_backup.txt");
    std::ofstream salesBackup(backupDir + "/sales_backup.txt");

    if (inventory && sales && invBackup && salesBackup) {
        invBackup << inventory.rdbuf();
        salesBackup << sales.rdbuf();
        std::cout << "Backup completed successfully.\n";
    } else {
        std::cout << "Backup failed: Could not open files.\n";
    }
}