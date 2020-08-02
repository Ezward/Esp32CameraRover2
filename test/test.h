#ifndef TEST_H
#define TEST_H

#include <stdio.h>
#include <string>

extern int testErrors;
#define testError(_msg, ...) do{++testErrors; printf((std::string(_msg) + std::string("\n")).c_str(), __VA_ARGS__);}while(0)

extern int testResults(std::string name);

#endif