
# test string parsing code
gcc -std=c++11 -Wc++11-extensions -lstdc++ test.cpp src/parse/parse_strings.test.cpp ../src/parse/*.cpp; ./a.out; rm a.out

# test higher order parsing functions
gcc -std=c++11 -Wc++11-extensions -lstdc++ test.cpp src/parse/parse_highorder.test.cpp ../src/parse/*.cpp; ./a.out; rm a.out

# test number parsing functions
gcc -std=c++11 -Wc++11-extensions -lstdc++ test.cpp src/parse/parse_numbers.test.cpp ../src/parse/*.cpp; ./a.out; rm a.out
