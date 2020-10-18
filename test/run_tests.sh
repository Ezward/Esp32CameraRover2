
# test string parsing code
gcc -DTESTING -std=c++11 -Wc++11-extensions -lstdc++ test.cpp src/parse/parse_strings.test.cpp ../src/parse/*.cpp; ./a.out; rm a.out

# test higher order parsing functions
gcc -DTESTING -std=c++11 -Wc++11-extensions -lstdc++ test.cpp src/parse/parse_highorder.test.cpp ../src/parse/*.cpp; ./a.out; rm a.out

# test number parsing functions
gcc -DTESTING -std=c++11 -Wc++11-extensions -lstdc++ test.cpp src/parse/parse_numbers.test.cpp ../src/parse/*.cpp; ./a.out; rm a.out

# test rover command parsing functions
gcc -DTESTING -std=c++11 -Wc++11-extensions -lstdc++ test.cpp src/rover/rover_parse.test.cpp ../src/rover/rover_parse.cpp ../src/parse/*.cpp; ./a.out; rm a.out

# test message bux
gcc -DTESTING -std=c++11 -Wc++11-extensions -lstdc++ test.cpp src/message_bus/message_bus.test.cpp ../src/message_bus/message_bus.cpp; ./a.out; rm a.out
