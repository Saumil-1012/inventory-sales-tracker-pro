#pragma once
#include <string>
#include <map>

enum class Role { ADMIN, STAFF, INVALID };

struct User {
    std::string username;
    std::string passwordHash;  // SHA256 recommended for production
    Role role;
};

class Auth {
private:
    static const std::map<std::string, User> USERS;
    
public:
    static Role login();
    static bool validateCredentials(const std::string& username, const std::string& password);
};
