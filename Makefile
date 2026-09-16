CXX = g++
CXXFLAGS = -std=c++17 -Wall -Wextra
TARGET = inventory_tracker
SOURCES = main.cpp utils.cpp inventory/inventory.cpp sales/sales.cpp auth/login.cpp ui/ui.cpp
OBJECTS = $(SOURCES:.cpp=.o)

all: $(TARGET)

$(TARGET): $(OBJECTS)
	$(CXX) $(CXXFLAGS) -o $(TARGET) $(OBJECTS)

%.o: %.cpp
	$(CXX) $(CXXFLAGS) -c $< -o $@

clean:
	rm -f $(OBJECTS) $(TARGET)

rebuild: clean all

run: $(TARGET)
	./$(TARGET)

.PHONY: all clean rebuild run
