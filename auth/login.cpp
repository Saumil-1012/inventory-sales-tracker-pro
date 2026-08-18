#include "login.h"
#include <iostream>
#include <fstream>
#include <sstream>

Role Auth::login() {
    std::string username, password;
    std::cout << "Username: ";
    std::cin >> username;
    std::cout << "Password: ";
    std::cin >> password;

    std::ifstream file("Data/login.txt");
    std::string line;
    while (getline(file, line)) {
        std::stringstream ss(line);
        std::string storedUser, storedPass, role;
        getline(ss, storedUser, ',');
        getline(ss, storedPass, ',');
        getline(ss, role);

        if (username == storedUser && password == storedPass) {
            if (role == "admin") return Role::ADMIN;
            if (role == "staff") return Role::STAFF;
        }
    }

    std::cout << "Login failed.\n";
    return Role::INVALID;
}
