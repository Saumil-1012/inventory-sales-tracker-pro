#pragma once
#include <string>

namespace UI {
    void showBanner(const std::string& role);
    void showMenu(bool isAdmin);
    void clearScreen();
    void pause();
    int getChoice();
    void showPulseHeader(const std::string& title);
}
