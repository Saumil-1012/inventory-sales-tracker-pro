CXX = g++
CXXFLAGS = -std=c++11 -Wall -I/Library/Developer/CommandLineTools/usr/include
LDFLAGS = -lsqlite3
TARGET = tracker

SRC = main.cpp \
      inventory/inventory.cpp \
      sales/sales.cpp \
      auth/login.cpp \
      utils.cpp \
      database/database.cpp \
      ui/ui.cpp

all: $(TARGET)

$(TARGET): $(SRC)
	$(CXX) $(CXXFLAGS) -o $(TARGET) $(SRC) $(LDFLAGS)

clean:
	rm -f $(TARGET)
