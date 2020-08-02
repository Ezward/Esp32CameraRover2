#include "test.h"

int testErrors = 0;

int testResults(std::string test) {
    if(0 == testErrors) {
        printf("%s: Passed\n", test.c_str());
    } else {
        printf("%s: %d Test Failures\n", test.c_str(), testErrors);
    }
    return testErrors;
}


