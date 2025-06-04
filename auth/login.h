#pragma once
#include <string>

enum class Role { ADMIN, STAFF, INVALID };

class Auth {
public:
    static Role login();
};
