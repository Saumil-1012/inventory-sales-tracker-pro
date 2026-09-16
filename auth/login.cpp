#include "login.h"
#include <iostream>
#include <string>

// Default credentials: admin/admin123, staff/staff123
// TODO: Replace with database or config file before production
// SECURITY WARNING: Passwords are plaintext here for demo. Use bcrypt/Argon2 in production.

const std::map<std::string, User> Auth::USERS = {
    {
        "admin",
        {"admin", "admin123", Role::ADMIN}  // TODO: Replace with hash
    },
    {
        "staff",
        {"staff", "staff123", Role::STAFF}  // TODO: Replace with hash
    }
};

bool Auth::validateCredentials(const std::string& username, const std::string& password) {
    auto it = USERS.find(username);
    
    if (it == USERS.end()) {
        return false;
    }
    
    // In production, use proper password hashing (bcrypt, Argon2, etc.)
    // This simple comparison is only for development
    return it->second.passwordHash == password;
}

Role Auth::login() {
    std::string username, password;
    int attempts = 3;
    
    while (attempts > 0) {
        std::cout << "\n=== Inventory & Sales Tracker ===\n";
        std::cout << "Username: ";
        std::cin >> username;
        std::cout << "Password: ";
        std::cin >> password;
        
        if (validateCredentials(username, password)) {
            auto user = USERS.at(username);
            std::cout << "\n✓ Login successful. Welcome, " << username << "!\n";
            return user.role;
        }
        
        attempts--;
        if (attempts > 0) {
            std::cerr << "\n✗ Invalid credentials. " << attempts << " attempt(s) remaining.\n";
        } else {
            std::cerr << "\n✗ Maximum login attempts exceeded. Exiting.\n";
        }
    }
    
    return Role::INVALID;
}
