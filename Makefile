all:
	g++ -o tracker main.cpp inventory.cpp sales.cpp utils.cpp

clean:
	rm -f tracker

