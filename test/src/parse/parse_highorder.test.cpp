#include <string.h>

#include "../../test.h"
#include "../../../src/parse/scan.h"

using namespace std;

void TestScanPrefixed() {
	//
	// should scan valid python package names
	//
	string prefixes[] = {
		"[",
		"{",
		"(",
		"<=",
		"//",
	};
    int lenPrefixes = sizeof(prefixes) / sizeof(prefixes[0]);

	for (int i = 0; i < lenPrefixes; i += 2) {
		string prefix = prefixes[i];
		string buffer = prefix + "foo";
		ScanResult scan = scanPrefixed(buffer, 0, prefix, scanAlphabetics);
		if (!scan.matched) {
			testError("scanPrefixed(\"%s\", 0, \"%s\", scanAlphabetics) failed to scan; true != %t", cstr(buffer), cstr(prefix), scan.matched);
		}
		if (scan.index != len(buffer)) {
			testError("scanPrefixed(\"%s\", 0, \"%s\", scanAlphabetics) failed to return correct index; %d != %d", cstr(buffer), cstr(prefix), len(buffer), scan.index);
		}
	}

	//
	// should not scan missing bracket
	//
	for (int i = 0; i < lenPrefixes; i += 2) {
		string prefix = prefixes[i];
		string buffer = "foo";
		ScanResult scan = scanPrefixed(buffer, 0, prefix, scanAlphabetics);
		if (scan.matched) {
			testError("scanPrefixed(\"%s\", 0, \"%s\", scanAlphabetics) erroneously scanned; false != %t", cstr(buffer), cstr(prefix), scan.matched);
		}
		if (scan.index != 0) {
			testError("scanPrefixed(\"%s\", 0, \"%s\", scanAlphabetics) erroneously incremented index; %d != %d", cstr(buffer), cstr(prefix), len(buffer), scan.index);
		}
	}

	//
	// should not scan out of range,
	// should return the given index, even if out of range
	//
	string buffer = "[foo";
	string prefix = "[";
	ScanResult scan = scanPrefixed(buffer, len(buffer)+1, prefix, scanAlphabetics);
	if (scan.matched) {
		testError("scanPrefixed(\"%s\", 0, \"%s\", scanAlphabetics) erroneously scanned; false != %t", cstr(buffer), cstr(prefix), scan.matched);
	}
	if (scan.index != len(buffer) + 1) {
		testError("scanPrefixed(\"%s\", 0, \"%s\", scanAlphabetics) erroneously incremented index; %d != %d", cstr(buffer), cstr(prefix), len(buffer), scan.index);
	}

	//
	// should not scan empty string
	//
	buffer = "";
	prefix = "[";
	scan = scanPrefixed(buffer, 0, prefix, scanAlphabetics);
	if (scan.matched) {
		testError("scanPrefixed(\"%s\", 0, \"%s\", scanAlphabetics) erroneously scanned; false != %t", cstr(buffer), cstr(prefix), scan.matched);
	}
	if (scan.index != 0) {
		testError("scanPrefixed(\"%s\", 0, \"%s\", scanAlphabetics) erroneously incremented index; %d != %d", cstr(buffer), cstr(prefix), len(buffer), scan.index);
	}

}

void TestScanSuffixed() {
	//
	// should scan valid python package names
	//
	string suffixes[] = {
		"]",
		"}",
		")",
		"=>",
		"//",
	};
    const int lenSuffixes = sizeof(suffixes) / sizeof(suffixes[0]);

	for (int i = 0; i < lenSuffixes; i += 2) {
		string suffix = suffixes[i];
		string buffer = "foo" + suffix;
		ScanResult scan = scanSuffixed(buffer, 0, scanAlphabetics, suffix);
		if (!scan.matched) {
			testError("scanSuffixed(\"%s\", 0, \"%s\", scanAlphabetics) failed to scan; true != %t", cstr(buffer), cstr(suffix), scan.matched);
		}
		if (scan.index != len(buffer)) {
			testError("scanSuffixed(\"%s\", 0, \"%s\", scanAlphabetics) failed to return correct index; %d != %d", cstr(buffer), cstr(suffix), len(buffer), scan.index);
		}
	}

	//
	// should not scan missing bracket
	//
	for (int i = 0; i < lenSuffixes; i += 2) {
		string suffix = suffixes[i];
		string buffer = "foo";
		ScanResult scan = scanSuffixed(buffer, 0, scanAlphabetics, suffix);
		if (scan.matched) {
			testError("scanSuffixed(\"%s\", 0, \"%s\", scanAlphabetics) erroneously scanned; false != %t", cstr(buffer), cstr(suffix), scan.matched);
		}
		if (scan.index != 0) {
			testError("scanSuffixed(\"%s\", 0, \"%s\", scanAlphabetics) erroneously incremented index; %d != %d", cstr(buffer), cstr(suffix), len(buffer), scan.index);
		}
	}

	//
	// should not scan out of range,
	// should return the given index, even if out of range
	//
	string buffer = "foo]";
	string suffix = "]";
	ScanResult scan = scanSuffixed(buffer, len(buffer)+1, scanAlphabetics, suffix);
	if (scan.matched) {
		testError("scanSuffixed(\"%s\", 0, \"%s\", scanAlphabetics) erroneously scanned; false != %t", cstr(buffer), cstr(suffix), scan.matched);
	}
	if (scan.index != len(buffer) + 1) {
		testError("scanSuffixed(\"%s\", 0, \"%s\", scanAlphabetics) erroneously incremented index; %d != %d", cstr(buffer), cstr(suffix), len(buffer), scan.index);
	}

	//
	// should not scan empty string
	//
	buffer = "";
	suffix = "]";
	scan = scanSuffixed(buffer, 0, scanAlphabetics, suffix);
	if (scan.matched) {
		testError("scanSuffixed(\"%s\", 0, \"%s\", scanAlphabetics) erroneously scanned; false != %t", cstr(buffer), cstr(suffix), scan.matched);
	}
	if (scan.index != 0) {
		testError("scanSuffixed(\"%s\", 0, \"%s\", scanAlphabetics) erroneously incremented index; %d != %d", cstr(buffer), cstr(suffix), len(buffer), scan.index);
	}

}


void TestScanBracketed() {
	//
	// should scan valid python package names
	//
    {
        string brackets[] = {
            "[", "]",
            "{", "}",
            "(", ")",
            "<=", "=>",
            "//", "//",
        };
        const int lenBrackets = sizeof(brackets) / sizeof(brackets[0]);

        for (int i = 0; i < lenBrackets; i += 2) {
            string leftBracket = brackets[i];
            string rightBracket = brackets[i+1];
            string buffer = leftBracket + "foo" + rightBracket;
            ScanResult scan = scanBracketed(buffer, 0, leftBracket, scanAlphabetics, rightBracket);
            if (!scan.matched) {
                testError("scanBracketed(\"%s\", 0, \"%s\", \"%s\", scanAlphabetics) failed to scan; true != %t", cstr(buffer), cstr(leftBracket), cstr(rightBracket), scan.matched);
            }
            if (scan.index != len(buffer)) {
                testError("scanBracketed(\"%s\", 0, \"%s\", \"%s\", scanAlphabetics) failed to return correct index; %d != %d", cstr(buffer), cstr(leftBracket), cstr(rightBracket), len(buffer), scan.index);
            }
        }
    }

	//
	// should not scan missing bracket
	//
    {
        string brackets[] = {
            "[", "}",
            "{", "]",
        };
        const int lenBrackets = sizeof(brackets) / sizeof(brackets[0]);

        for (int i = 0; i < lenBrackets; i += 2) {
            string leftBracket = brackets[i];
            string rightBracket = brackets[i+1];
            string buffer = "[foo]";
            ScanResult scan = scanBracketed(buffer, 0, leftBracket, scanAlphabetics, rightBracket);
            if (scan.matched) {
                testError("scanBracketed(\"%s\", 0, \"%s\", \"%s\", scanAlphabetics) erroneously scanned; false != %t", cstr(buffer), cstr(leftBracket), cstr(rightBracket), scan.matched);
            }
            if (scan.index != 0) {
                testError("scanBracketed(\"%s\", 0, \"%s\", \"%s\", scanAlphabetics) erroneously incremented index; %d != %d", cstr(buffer), cstr(leftBracket), cstr(rightBracket), len(buffer), scan.index);
            }
        }
    }

	//
	// should not scan out of range,
	// should return the given index, even if out of range
	//
	string buffer = "[foo]";
	string leftBracket = "[";
	string rightBracket = "]";
	ScanResult scan = scanBracketed(buffer, len(buffer)+1, leftBracket, scanAlphabetics, rightBracket);
	if (scan.matched) {
		testError("scanBracketed(\"%s\", 0, \"%s\", \"%s\", scanAlphabetics) erroneously scanned; false != %t", cstr(buffer), cstr(leftBracket), cstr(rightBracket), scan.matched);
	}
	if (scan.index != len(buffer) + 1) {
		testError("scanBracketed(\"%s\", 0, \"%s\", \"%s\", scanAlphabetics) erroneously incremented index; %d != %d", cstr(buffer), cstr(leftBracket), cstr(rightBracket), len(buffer), scan.index);
	}

	//
	// should not scan empty string
	//
	buffer = "";
	leftBracket = "[";
	rightBracket = "]";
	scan = scanBracketed(buffer, 0, leftBracket, scanAlphabetics, rightBracket);
	if (scan.matched) {
		testError("scanBracketed(\"%s\", 0, \"%s\", \"%s\", scanAlphabetics) erroneously scanned; false != %t", cstr(buffer), cstr(leftBracket), cstr(rightBracket), scan.matched);
	}
	if (scan.index != 0) {
		testError("scanBracketed(\"%s\", 0, \"%s\", \"%s\", scanAlphabetics) erroneously incremented index; %d != %d", cstr(buffer), cstr(leftBracket), cstr(rightBracket), len(buffer), scan.index);
	}
}

void TestScanDelimitedPair() {
	//
	// should scan valid python package names
	//
	{
		string testData[][2] = {
			{"abc.123", "."},
			{"abc/123", "/"},
			{"abc123", ""},
		};
        const int lenTestData = sizeof(testData) / sizeof(testData[0]);

		for (int i = 0; i < lenTestData; i += 1) {
			string *testDatum = testData[i];
			ScanResult scan = scanDelimitedPair(testDatum[0], 0, scanAlphabetics, testDatum[1], scanDigits);
			if (!scan.matched) {
				testError("scanDelimitedPair(\"%s\", 0) failed to scan; true != %t", cstr(testDatum[0]), scan.matched);
			}
			if (scan.index != len(testDatum[0])) {
				testError("scanDelimitedPair(\"%s\", 0) failed to return correct index; %d != %d", cstr(testDatum[0]), len(testDatum[0]), scan.index);
			}
		}
	}

	string testData[] = {
		".123",     // should not scan starting delimiter
		"abc.",     // should not scan hanging delimiter
		"abc123",   // should not scan missing delimiter
		"abc..123", // should not scan multiple delimiters
		"abc-123",  // should not scan non-matching character
		"abc 123",  // should not scan non-matching character
		"",         // should not scan empty string
	};
    const int lenTestData = sizeof(testData) / sizeof(testData[0]);

	//
	// should not scan hanging period
	//
	for (int i = 0; i < lenTestData; i += 1) {
		string testDatum = testData[i];
		ScanResult scan = scanDelimitedPair(testDatum, 0, scanAlphabetics, ".", scanDigits);
		if (scan.matched) {
			testError("scanDelimitedPair(\"%s\", 0) erroneously scanned; false != %t", cstr(testDatum), scan.matched);
		}
		if (scan.index != 0) {
			testError("scanDelimitedPair(\"%s\", 0) erroneously incremented index; 0 != %d", cstr(testDatum), scan.index);
		}
	}

	//
	// should not scan out of range,
	// should return the given index, even if out of range
	//
	string testDatum = "abc.123";
	ScanResult scan = scanDelimitedPair(testDatum, len(testDatum)+1, scanAlphabetics, ".", scanDigits);
	if (scan.matched) {
		testError("scanDelimitedPair(\"%s\", 0) erroneously scanned; false != %t", cstr(testDatum), scan.matched);
	}
	if (scan.index != len(testDatum) + 1) {
		testError("scanDelimitedPair(\"%s\", 0) erroneously incremented index; %d != %d", cstr(testDatum), len(testDatum)+1, scan.index);
	}
}


void TestScanDelimited() {
	//
	// should scan valid python package names
	//
	{
		string testData[][2] = {
			{"a.b.c", "."},
			{"a/b/c", "/"},
			// {"abc", ""},  // FAIL: detects empty string after 'c'
		};
        const int lenTestData = sizeof(testData) / sizeof(testData[0]);

		for (int i = 0; i < lenTestData; i += 1) {
			string *testDatum = testData[i];
			ScanResult scan = scanDelimited(testDatum[0], 0, testDatum[1], scanAlphabetic);
			if (!scan.matched) {
				testError("scanDelimited(\"%s\", 0) failed to scan; true != %t", cstr(testDatum[0]), scan.matched);
			}
			if (scan.index != len(testDatum[0])) {
				testError("scanDelimited(\"%s\", 0) failed to return correct index; %d != %d", cstr(testDatum[0]), len(testDatum[0]), scan.index);
			}
		}
	}

	string testData[] = {
		".a.b.c", // should not scan starting delimiter
		"a.b.c.", // should not scan hanging delimiter
		"",       // should not scan empty string
	};
    const int lenTestData = sizeof(testData) / sizeof(testData[0]);

	for (int i = 0; i < lenTestData; i += 1) {
		string testDatum = testData[i];
		ScanResult scan = scanDelimited(testDatum, 0, ".", scanAlphabetic);
		if (scan.matched) {
			testError("scanDelimited(\"%s\", 0) erroneously scanned; false != %t", cstr(testDatum), scan.matched);
		}
		if (scan.index != 0) {
			testError("scanDelimited(\"%s\", 0) erroneously incremented index; 0 != %d", cstr(testDatum), scan.index);
		}
	}

	//
	// should not scan out of range,
	// should return the given index, even if out of range
	//
	string testDatum = "abc.123";
	ScanResult scan = scanDelimitedPair(testDatum, len(testDatum)+1, scanAlphabetics, ".", scanDigits);
	if (scan.matched) {
		testError("scanDelimitedPair(\"%s\", 0) erroneously scanned; false != %t", cstr(testDatum), scan.matched);
	}
	if (scan.index != len(testDatum) + 1) {
		testError("scanDelimitedPair(\"%s\", 0) erroneously incremented index; %d != %d", cstr(testDatum), len(testDatum)+1, scan.index);
	}
}

int main() {
    // from test folder run: 
    // gcc -std=c++11 -Wc++11-extensions -lstdc++ test.cpp src/parse/parse_highorder.test.cpp ../src/parse/*.cpp; ./a.out; rm a.out

    TestScanPrefixed();
    TestScanSuffixed();
    TestScanBracketed();
    TestScanDelimitedPair();
    TestScanDelimited();

    if(0 == testErrors) {
        printf("parse_highorder: Passed\n");
    } else {
        printf("parse_highorder: %d Test Failures\n", testErrors);
    }
    return testErrors;
}
