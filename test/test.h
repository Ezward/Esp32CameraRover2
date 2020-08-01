#ifndef TEST_H
#define TEST_H

#include <stdio.h>

extern int testErrors;
#define testError (++testErrors, printf)

#endif