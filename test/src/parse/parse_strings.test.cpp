#include <string.h>

#include "../../test.h"
#include "../../../src/parse/scan.h"

using namespace std;

void TestScanCharacter() {
	//
	// should scan any single character
	//
	for (char i = 'a'; i <= 'z'; i += 1) {
		String buffer = charToString(i) + charToString(i);
        
		ScanResult scan = scanChar(buffer, 0, i);
		if (!scan.matched) {
			testError("scanChar(\"%s\", 0, %c) failed to scan; true != %t", cstr(buffer), i, scan.matched);
		}
		if (1 != scan.index) {
			testError("scanChar(\"%s\", 0) failed to return correct index; 1 != %d", cstr(buffer), scan.index);
		}
	}

	//
	// should scan unicode characters
	//
	// String buffer = "日本語";
	// ScanResult scan = scanChar(buffer, strlen("日"), '本');
	// if (!scan.matched) {
	// 	testError("scanChar(\"%s\", 0, '本') failed to scan; true != %t", cstr(buffer), scan.matched);
	// }
	// if (scan.index != strlen("日本")) {
	// 	testError("scanChar(\"%s\", 0) failed to return correct index; %d != %d", cstr(buffer), strlen("日本"), scan.index);
	// }

	//
	// should not scan non-matching character
	//
	for (char i = 'a'; i <= 'z'; i += 1) {
        String buffer = charToString(i - 1) + charToString(i);

		ScanResult scan = scanChar(buffer, 0, i);
		if (scan.matched) {
			testError("scanChar(\"%s\", 0, %c) erroneously scanned; false != %t", cstr(buffer), i, scan.matched);
		}
		if (0 != scan.index) {
			testError("scanChar(\"%s\", 0, %c) erroneously incremented index; 0 != %d", cstr(buffer), i, scan.index);
		}
	}

	//
	// should not scan empty string
	//
	ScanResult scan = scanChar("", 0, 'a');
	if (scan.matched) {
		testError("scanChar(\"\", 0, 'a') erroneously scanned empty string; false != %t", scan.matched);
	}
	if (0 != scan.index) {
		testError("scanChar(\"\", 0, 'a') returned wrong index; 0 != %d", scan.index);
	}

	//
	// should not scan out of range index,
	// should return the given index, even if out of range
	//
	scan = scanChar("a", 2, 'a');
	if (scan.matched) {
		testError("scanChar(\"a\", 2, 'a') erroneously scanned out of range index; false != %t", scan.matched);
	}
	if (2 != scan.index) {
		testError("scanChar(\"a\", 2, 'a') returned wrong index; 2 != %d", scan.index);
	}
}

void TestScanCharacters() {
	//
	// should scan any single character
	//
	for (char i = 'a'; i <= 'z'; i += 1) {
		String buffer = charToString(i) + charToString(i);
        
		ScanResult scan = scanChars(buffer, 0, i);
		if (!scan.matched) {
			testError("scanChars(\"%s\", 0, %c) failed to scan; true != %t", cstr(buffer), i, scan.matched);
		}
		if (len(buffer) != scan.index) {
			testError("scanChars(\"%s\", 0) failed to return correct index; %d != %d", cstr(buffer), len(buffer), scan.index);
		}
	}

	//
	// should scan unicode characters
	//
	// String buffer = "日本語";
	// ScanResult scan = scanChar(buffer, strlen("日"), '本');
	// if (!scan.matched) {
	// 	testError("scanChar(\"%s\", 0, '本') failed to scan; true != %t", cstr(buffer), scan.matched);
	// }
	// if (scan.index != strlen("日本")) {
	// 	testError("scanChar(\"%s\", 0) failed to return correct index; %d != %d", cstr(buffer), strlen("日本"), scan.index);
	// }

	//
	// should not scan non-matching character
	//
	for (char i = 'a'; i <= 'z'; i += 1) {
        String buffer = charToString(i - 1) + charToString(i);

		ScanResult scan = scanChars(buffer, 0, i);
		if (scan.matched) {
			testError("scanChars(\"%s\", 0, %c) erroneously scanned; false != %t", cstr(buffer), i, scan.matched);
		}
		if (0 != scan.index) {
			testError("scanChars(\"%s\", 0, %c) erroneously incremented index; 0 != %d", cstr(buffer), i, scan.index);
		}
	}

	//
	// should not scan empty string
	//
	ScanResult scan = scanChars("", 0, 'a');
	if (scan.matched) {
		testError("scanChars(\"\", 0, 'a') erroneously scanned empty string; false != %t", scan.matched);
	}
	if (0 != scan.index) {
		testError("scanChars(\"\", 0, 'a') returned wrong index; 0 != %d", scan.index);
	}

	//
	// should not scan out of range index,
	// should return the given index, even if out of range
	//
	scan = scanChars("a", 2, 'a');
	if (scan.matched) {
		testError("scanChars(\"a\", 2, 'a') erroneously scanned out of range index; false != %t", scan.matched);
	}
	if (2 != scan.index) {
		testError("scanChars(\"a\", 2, 'a') returned wrong index; 2 != %d", scan.index);
	}
}

void TestScanAlphabetic() {
	//
	// should one alphabetic character
	//
	for (char i = 'a'; i <= 'z'; i += 1) {
		String buffer = charToString(i);
		ScanResult scan = scanAlphabetic(buffer.c_str(), 0);
		if (!scan.matched) {
			testError("scanAlphabetic(\"%s\", 0) failed to scan; true != %t", cstr(buffer), scan.matched);
		}
		if (scan.index != len(buffer)) {
			testError("scanAlphabetic(\"%s\", 0) failed to return correct index; %d != %d", cstr(buffer), len(buffer), scan.index);
		}
	}
	for (char i = 'A'; i <= 'Z'; i += 1) {
		String buffer = charToString(i);
		ScanResult scan = scanAlphabetic(buffer, 0);
		if (!scan.matched) {
			testError("scanAlphabetic(\"%s\", 0) failed to scan; true != %t", cstr(buffer), scan.matched);
		}
		if (scan.index != len(buffer)) {
			testError("scanAlphabetic(\"%s\", 0) failed to return correct index; %d != %d", cstr(buffer), len(buffer), scan.index);
		}
	}

	//
	// should not scan non-matching character
	//
	String buffer = ":b";
	ScanResult scan = scanAlphabetic(cstr(buffer), 0);
	if (scan.matched) {
		testError("scanAlphabetic(\"%s\", 0) erroneously scanned; false != %t", cstr(buffer), scan.matched);
	}
	if (scan.index != 0) {
		testError("scanAlphabetic(\"%s\", 0) erroneously incremented index; 0 != %d", cstr(buffer), scan.index);
	}

	//
	// should not scan empty string,
	//
	scan = scanAlphabetic("", 0);
	if (scan.matched) {
		testError("scanAlphabetic(\"\", 0) erroneously scanned empty string; false != %t", scan.matched);
	}
	if (scan.index != 0) {
		testError("scanAlphabetic(\"\", 0) returned wrong index; 0 != %d", scan.index);
	}

	//
	// should not scan out of range,
	// should return the given index, even if out of range
	//
	scan = scanAlphabetic("a", 2);
	if (scan.matched) {
		testError("scanAlphabetic(\"a\", 2) erroneously scanned out of range index; false != %t", scan.matched);
	}
	if (scan.index != 2) {
		testError("scanAlphabetic(\"a\", 2) returned wrong index; 2 != %d", scan.index);
	}
}

void TestScanAlphabetics() {
	//
	// should scan run of alphabetic characters
	//
	char i;
	String buffer = "";
	for (char i = 'a'; i <= 'z'; i += 1) {
        buffer += i;
	}
	for (char i = 'A'; i <= 'Z'; i += 1) {
		buffer += i;
	}
	ScanResult scan = scanAlphabetics(buffer, 0);
	if (!scan.matched) {
		testError("scanAlphabetics(\"%s\", 0, %c) failed to scan; true != %t", cstr(buffer), i, scan.matched);
	}
	if (scan.index != len(buffer)) {
		testError("scanAlphabetics(\"%s\", 0) failed to return correct index; %d != %d", cstr(buffer), len(buffer), scan.index);
	}

	//
	// should not scan digits or underscore or empty string
	//
	String testData[] = {
		"00",
		"11",
		"22",
		"33",
		"44",
		"55",
		"66",
		"77",
		"88",
		"99",
		":b",
		"_b",
		"",
	};
    const int lenTestData = sizeof(testData) / sizeof(testData[0]);

	for (int i = 0; i < lenTestData; i += 1) {
		buffer = testData[i];
		scan = scanAlphabetics(buffer, 0);
		if (scan.matched) {
			testError("scanAlphabetics(\"%s\", 0, %c) erroneously scanned; false != %t", cstr(buffer), i, scan.matched);
		}
		if (scan.index != 0) {
			testError("scanAlphabetics(\"%s\", 0, %c) erroneously incremented index; 0 != %d", cstr(buffer), i, scan.index);
		}
	}

	//
	// should not scan out of range,
	// should return the given index, even if out of range
	//
	scan = scanAlphabetics("a", 2);
	if (scan.matched) {
		testError("scanAlphabetics(\"a\", 2) erroneously scanned out of range index; false != %t", scan.matched);
	}
	if (scan.index != 2) {
		testError("scanAlphabetics(\"a\", 2) returned wrong index; 2 != %d", scan.index);
	}
}

void TestScanAlphaOrNumeric() {
	//
	// should one alphabetic character
	//
	char i;
	String buffer;
	for (char i = 'a'; i <= 'z'; i += 1) {
		buffer = charToString(i);
		ScanResult scan = scanAlphaOrNumeric(buffer, 0);
		if (!scan.matched) {
			testError("scanAlphaOrNumeric(\"%s\", 0) failed to scan; true != %t", cstr(buffer), scan.matched);
		}
		if (scan.index != len(buffer)) {
			testError("scanAlphaOrNumeric(\"%s\", 0) failed to return correct index; %d != %d", cstr(buffer), len(buffer), scan.index);
		}
	}
	for (char i = 'A'; i <= 'Z'; i += 1) {
		buffer = charToString(i);
		ScanResult scan = scanAlphaOrNumeric(buffer, 0);
		if (!scan.matched) {
			testError("scanAlphaOrNumeric(\"%s\", 0) failed to scan; true != %t", cstr(buffer), scan.matched);
		}
		if (scan.index != len(buffer)) {
			testError("scanAlphaOrNumeric(\"%s\", 0) failed to return correct index; %d != %d", cstr(buffer), len(buffer), scan.index);
		}
	}
	for (char i = '0'; i <= '9'; i += 1) {
		buffer = charToString(i);
		ScanResult scan = scanAlphaOrNumeric(buffer, 0);
		if (!scan.matched) {
			testError("scanAlphaOrNumeric(\"%s\", 0) failed to scan; true != %t", cstr(buffer), scan.matched);
		}
		if (scan.index != len(buffer)) {
			testError("scanAlphaOrNumeric(\"%s\", 0) failed to return correct index; %d != %d", cstr(buffer), len(buffer), scan.index);
		}
	}

	//
	// should not scan non-matching character
	//
	buffer = ":b";
	ScanResult scan = scanAlphaOrNumeric(buffer, 0);
	if (scan.matched) {
		testError("scanAlphaOrNumeric(\"%s\", 0, %c) erroneously scanned; false != %t", cstr(buffer), i, scan.matched);
	}
	if (scan.index != 0) {
		testError("scanAlphaOrNumeric(\"%s\", 0, %c) erroneously incremented index; 0 != %d", cstr(buffer), i, scan.index);
	}

	//
	// should not scan empty string,
	//
	scan = scanAlphaOrNumeric("", 0);
	if (scan.matched) {
		testError("scanAlphaOrNumeric(\"\", 0) erroneously scanned empty string; false != %t", scan.matched);
	}
	if (scan.index != 0) {
		testError("scanAlphaOrNumeric(\"\", 0) returned wrong index; 0 != %d", scan.index);
	}

	//
	// should not scan out of range,
	// should return the given index, even if out of range
	//
	scan = scanAlphaOrNumeric("a", 2);
	if (scan.matched) {
		testError("scanAlphaOrNumeric(\"a\", 2) erroneously scanned out of range index; false != %t", scan.matched);
	}
	if (scan.index != 2) {
		testError("scanAlphaOrNumeric(\"a\", 2) returned wrong index; 2 != %d", scan.index);
	}
}

void TestScanAlphaNumerics() {
	//
	// should scan run of alphabetic characters
	//
	char i;
	String buffer = "";
	for (char i = 'a'; i <= 'z'; i += 1) {
        buffer += i;
	}
	for (char i = 'A'; i <= 'Z'; i += 1) {
		buffer += i;
	}
	for (char i = '0'; i <= '9'; i += 1) {
		buffer += i;
	}
	buffer += buffer;
	ScanResult scan = scanAlphaNumerics(buffer, 0);
	if (!scan.matched) {
		testError("scanAlphaNumerics(\"%s\", 0, %c) failed to scan; true != %t", cstr(buffer), i, scan.matched);
	}
	if (scan.index != len(buffer)) {
		testError("scanAlphaNumerics(\"%s\", 0) failed to return correct index; %d != %d", cstr(buffer), len(buffer), scan.index);
	}

	//
	// should not scan non-matching character
	//
	buffer = "a1A:b2B";
	scan = scanAlphaNumerics(buffer, 0);
	if (!scan.matched) {
		testError("scanAlphaNumerics(\"%s\", 0, %c) failed to scan; true != %t", cstr(buffer), i, scan.matched);
	}
	if (scan.index != 3) {
		testError("scanAlphaNumerics(\"%s\", 0, %c) erroneously incremented index; 3 != %d", cstr(buffer), i, scan.index);
	}

	//
	// should not scan empty string,
	//
	scan = scanAlphaNumerics("", 0);
	if (scan.matched) {
		testError("scanAlphaNumerics(\"\", 0) erroneously scanned empty string; false != %t", scan.matched);
	}
	if (scan.index != 0) {
		testError("scanAlphaNumerics(\"\", 0) returned wrong index; 0 != %d", scan.index);
	}

	//
	// should not scan out of range,
	// should return the given index, even if out of range
	//
	scan = scanAlphaNumerics("a1A", 4);
	if (scan.matched) {
		testError("scanAlphaNumerics(\"a1A\", 4) erroneously scanned out of range index; false != %t", scan.matched);
	}
	if (scan.index != 4) {
		testError("scanAlphaNumerics(\"a\", 4) returned wrong index; 4 != %d", scan.index);
	}
}

void TestScanAlphaOrUnderscore() {
	//
	// should one alphabetic character
	//
	char i;
	String buffer = "";
	for (char i = 'a'; i <= 'z'; i += 1) {
		buffer = charToString(i);
		ScanResult scan = scanAlphaOrUnderscore(buffer, 0);
		if (!scan.matched) {
			testError("scanAlphaOrUnderscore(\"%s\", 0) failed to scan; true != %t", cstr(buffer), scan.matched);
		}
		if (scan.index != len(buffer)) {
			testError("scanAlphaOrUnderscore(\"%s\", 0) failed to return correct index; %d != %d", cstr(buffer), len(buffer), scan.index);
		}
	}
	for (char i = 'A'; i <= 'Z'; i += 1) {
		buffer = charToString(i);
		ScanResult scan = scanAlphaOrUnderscore(buffer, 0);
		if (!scan.matched) {
			testError("scanAlphaOrUnderscore(\"%s\", 0) failed to scan; true != %t", cstr(buffer), scan.matched);
		}
		if (scan.index != len(buffer)) {
			testError("scanAlphaOrUnderscore(\"%s\", 0) failed to return correct index; %d != %d", cstr(buffer), len(buffer), scan.index);
		}
	}
	buffer = "_";
	ScanResult scan = scanAlphaOrUnderscore(buffer, 0);
	if (!scan.matched) {
		testError("scanAlphaOrUnderscore(\"%s\", 0) failed to scan; true != %t", cstr(buffer), scan.matched);
	}
	if (scan.index != len(buffer)) {
		testError("scanAlphaOrUnderscore(\"%s\", 0) failed to return correct index; %d != %d", cstr(buffer), len(buffer), scan.index);
	}

	//
	// should not scan non-matching character
	//
	buffer = "9b_B";
	scan = scanAlphaOrUnderscore(buffer, 0);
	if (scan.matched) {
		testError("scanAlphaOrUnderscore(\"%s\", 0, %c) erroneously scanned; false != %t", cstr(buffer),  i, scan.matched);
	}
	if (scan.index != 0) {
		testError("scanAlphaOrUnderscore(\"%s\", 0, %c) erroneously incremented index; 0 != %d", cstr(buffer),  i, scan.index);
	}

	//
	// should not scan empty string,
	//
	scan = scanAlphaOrUnderscore("", 0);
	if (scan.matched) {
		testError("scanAlphaOrUnderscore(\"\", 0) erroneously scanned empty string; false != %t", scan.matched);
	}
	if (scan.index != 0) {
		testError("scanAlphaOrUnderscore(\"\", 0) returned wrong index; 0 != %d", scan.index);
	}

	//
	// should not scan out of range,
	// should return the given index, even if out of range
	//
	scan = scanAlphaOrUnderscore("b_B", 4);
	if (scan.matched) {
		testError("scanAlphaOrUnderscore(\"b_B\", 4) erroneously scanned out of range index; false != %t", scan.matched);
	}
	if (scan.index != 4) {
		testError("scanAlphaOrUnderscore(\"b_B\", 4) returned wrong index; 4 != %d", scan.index);
	}
}

void TestScanAlphaOrNumericOrUnderscore() {
	//
	// should one alphabetic character
	//
	char i;
	String buffer = "";
	for (char i = 'a'; i <= 'z'; i += 1) {
		buffer = charToString(i);
		ScanResult scan = scanAlphaOrNumericOrUnderscore(buffer, 0);
		if (!scan.matched) {
			testError("scanAlphaOrNumericOrUnderscore(\"%s\", 0) failed to scan; true != %t", cstr(buffer), scan.matched);
		}
		if (scan.index != len(buffer)) {
			testError("scanAlphaOrNumericOrUnderscore(\"%s\", 0) failed to return correct index; %d != %d", cstr(buffer), len(buffer), scan.index);
		}
	}
	for (char i = 'A'; i <= 'Z'; i += 1) {
		buffer = charToString(i);
		ScanResult scan = scanAlphaOrNumericOrUnderscore(buffer, 0);
		if (!scan.matched) {
			testError("scanAlphaOrNumericOrUnderscore(\"%s\", 0) failed to scan; true != %t", cstr(buffer), scan.matched);
		}
		if (scan.index != len(buffer)) {
			testError("scanAlphaOrNumericOrUnderscore(\"%s\", 0) failed to return correct index; %d != %d", cstr(buffer), len(buffer), scan.index);
		}
	}
	for (char i = '0'; i <= '9'; i += 1) {
		buffer = charToString(i);
		ScanResult scan = scanAlphaOrNumericOrUnderscore(buffer, 0);
		if (!scan.matched) {
			testError("scanAlphaOrNumericOrUnderscore(\"%s\", 0) failed to scan; true != %t", cstr(buffer), scan.matched);
		}
		if (scan.index != len(buffer)) {
			testError("scanAlphaOrNumericOrUnderscore(\"%s\", 0) failed to return correct index; %d != %d", cstr(buffer), len(buffer), scan.index);
		}
	}
	buffer = "_";
	ScanResult scan = scanAlphaOrNumericOrUnderscore(buffer, 0);
	if (!scan.matched) {
		testError("scanAlphaOrNumericOrUnderscore(\"%s\", 0) failed to scan; true != %t", cstr(buffer), scan.matched);
	}
	if (scan.index != len(buffer)) {
		testError("scanAlphaOrNumericOrUnderscore(\"%s\", 0) failed to return correct index; %d != %d", cstr(buffer), len(buffer), scan.index);
	}

	//
	// should not scan non-matching character
	//
	buffer = ":b_1_B";
	scan = scanAlphaOrNumericOrUnderscore(buffer, 0);
	if (scan.matched) {
		testError("scanAlphaOrNumericOrUnderscore(\"%s\", 0, %c) erroneously scanned; false != %t", cstr(buffer), i, scan.matched);
	}
	if (scan.index != 0) {
		testError("scanAlphaOrNumericOrUnderscore(\"%s\", 0, %c) erroneously incremented index; 0 != %d", cstr(buffer), i, scan.index);
	}

	//
	// should not scan empty string,
	//
	scan = scanAlphaOrNumericOrUnderscore("", 0);
	if (scan.matched) {
		testError("scanAlphaOrNumericOrUnderscore(\"\", 0) erroneously scanned empty string; false != %t", scan.matched);
	}
	if (scan.index != 0) {
		testError("scanAlphaOrNumericOrUnderscore(\"\", 0) returned wrong index; 0 != %d", scan.index);
	}

	//
	// should not scan out of range,
	// should return the given index, even if out of range
	//
	scan = scanAlphaOrNumericOrUnderscore("b_1_B", 6);
	if (scan.matched) {
		testError("scanAlphaOrNumericOrUnderscore(\"b_1_B\", 6) erroneously scanned out of range index; false != %t", scan.matched);
	}
	if (scan.index != 6) {
		testError("scanAlphaOrNumericOrUnderscore(\"b_1_B\", 6) returned wrong index; 6 != %d", scan.index);
	}
}

void TestScanString() {
	//
	// should scan all characters in target string
	//
	String buffer = "thisIsATest!";

	ScanResult scan = scanString(buffer, 0, buffer);
	if (!scan.matched) {
		testError("scanString(\"%s\", 0) failed to scan; true != %t", cstr(buffer), scan.matched);
	}
	if (scan.index != len(buffer)) {
		testError("scanString(\"%s\", 0) failed to return correct index; %d != %d", cstr(buffer), len(buffer), scan.index);
	}

	buffer = "日本語";
	scan = scanString(buffer, 0, "日本");
	if (!scan.matched) {
		testError("scanString(\"%s\", 0) failed to scan; true != %t", cstr(buffer), scan.matched);
	}
	if (scan.index != strlen("日本")) {
		testError("scanString(\"%s\", 0) failed to return correct index; %d != %d", cstr(buffer), strlen("日本"), scan.index);
	}

	//
	// should scan empty target string,
	// anywhere within or at end of buffer
	//
	buffer = "TEST";
	for (int i = 0; i <= len(buffer); i += 1) {
		scan = scanString(buffer, i, "");
	    if (!scan.matched) {
		    testError("scanString(\"%s\", %d, \"\") failed to scan; true != %t", cstr(buffer), i, scan.matched);
		}
		if (scan.index != i) {
			testError("scanString(\"%s\", %d, \"\") failed to return correct index; %d != %d", cstr(buffer), i, i, scan.index);
		}
	}

	//
	// should not scan empty target string past end of buffer
	//
	scan = scanString(buffer, len(buffer)+1, "");
	if (scan.matched) {
		testError("scanString(\"%s\", %d, \"\") erroneously scanned out of range index; false != %t", cstr(buffer), len(buffer)+1, scan.matched);
	}
	if (scan.index != len(buffer) + 1) {
		testError("scanString(\"%s\", %d, \"\") returned wrong index; 6 != %d", cstr(buffer), len(buffer)+1, index);
	}

	//
	// should not scan non-matching character
	//
	String notBuffer = "thisIs!ATest!";
	scan = scanString(buffer, 0, notBuffer);
	if (scan.matched) {
		testError("scanString(\"%s\", 0, %s) erroneously scanned; false != %t", cstr(buffer), cstr(notBuffer), scan.matched);
	}
	if (scan.index != 0) {
		testError("scanString(\"%s\", 0, %s) erroneously incremented index; 0 != %d", cstr(buffer), cstr(notBuffer), scan.index);
	}

	//
	// should not scan empty buffer,
	//
	buffer = "targetString";
	scan = scanString("", 0, buffer);
	if (scan.matched) {
		testError("scanString(\"\", 0, \"%s\") erroneously scanned empty string; false != %t", cstr(buffer), scan.matched);
	}
	if (scan.index != 0) {
		testError("scanString(\"\", 0, \"%s\") returned wrong index; 0 != %d", cstr(buffer), scan.index);
	}

	//
	// should not scan out of range,
	// should return the given index, even if out of range
	// even if target string is empty
	//
	scan = scanString(buffer, len(buffer)+1, buffer);
	if (scan.matched) {
		testError("scanString(\"%s\", %d, \"%s\") erroneously scanned out of range index; false != %t", cstr(buffer), len(buffer)+1, cstr(buffer), scan.matched);
	}
	if (scan.index != len(buffer) + 1) {
		testError("scanString(\"%s\", %d, \"%s\") returned wrong index; 6 != %d", cstr(buffer), len(buffer)+1, cstr(buffer), scan.index);
	}
}

void TestScanStrings() {
	//
	// should scan run of alphabetic characters
	//
	String buffers[] = {"thisIsATest!", "thisIsAnotherTest"};
    int lenBuffers = sizeof(buffers) / sizeof(buffers[0]);

	for (int i = 0; i < lenBuffers; i += 1) {
		String buffer = buffers[i];
		ScanListResult scan = scanStrings(buffer, 0, buffers, lenBuffers);
		if (!scan.matched) {
			testError("scanStrings(\"%s\", 0, \"%v\") failed to scan; true != %t", cstr(buffer), buffers, scan.matched);
		}
		if (scan.index != len(buffer)) {
			testError("scanStrings(\"%s\", 0, \"%v\") failed to return correct character index; %d != %d", cstr(buffer), buffers, len(buffer), scan.index);
		}
		if (i != scan.match) {
			testError("scanStrings(\"%s\", 0, \"%v\") failed to return correct string index; %d != %d", cstr(buffer), buffers, i, scan.match);
		}
	}

	//
	// should not scan non-matching character
	//
	String buffer = "notAMatch";
	ScanListResult scan = scanStrings(buffer, 0, buffers, lenBuffers);
	if (scan.matched) {
		testError("scanStrings(\"%s\", 0, \"%v\") erroneously scanned; false != %t", cstr(buffer), buffers, scan.matched);
	}
	if (scan.index != 0) {
		testError("scanStrings(\"%s\", 0, \"%v\") erroneously incremented index; 0 != %d", cstr(buffer), buffers, scan.index);
	}
    if (0 != scan.match) {
        testError("scanStrings(\"%s\", 0, \"%v\") failed to return correct string index; 0 != %d", cstr(buffer), buffers, scan.match);
    }

	//
	// should not scan empty string,
	//
	scan = scanStrings("", 0, buffers, lenBuffers);
	if (scan.matched) {
		testError("scanStrings(\"\", 0, %v) erroneously scanned empty string; false != %t", buffers, scan.matched);
	}
	if (scan.index != 0) {
		testError("scanStrings(\"\", 0, %v) returned wrong index; 0 != %d", buffers, scan.index);
	}
    if (0 != scan.match) {
        testError("scanStrings(\"\", 0, \"%v\") failed to return correct string index; 0 != %d", buffers, scan.match);
    }

	//
	// should not scan out of range,
	// should return the given index, even if out of range
	//
	for (int i = 0; i < lenBuffers; i += 1) {
		String buffer = buffers[i];
		scan = scanStrings(buffer, len(buffer)+1, buffers, lenBuffers);
        if (scan.matched) {
            testError("scanStrings(\"%s\", %d, %v) erroneously scanned out of range index; false != %t", cstr(buffer), len(buffer)+1, buffers, scan.matched);
		}
		if (scan.index != len(buffer) + 1) {
			testError("scanStrings(\"%s\", %d, %v) returned wrong index; 6 != %d", cstr(buffer), len(buffer)+1, buffers, scan.index);
		}
		if (0 != scan.match) {
			testError("scanStrings(\"%s\", %d, %v) returned wrong string index; 0 != %d", cstr(buffer), len(buffer)+1, buffers, scan.match);
		}
	}
}



int main() {
    // from test folder run: 
    // gcc -std=c++11 -Wc++11-extensions -lstdc++ test.cpp src/parse/parse_strings.test.cpp ../src/parse/*.cpp; ./a.out; rm a.out

    TestScanCharacter();
    TestScanCharacters();
    TestScanAlphabetic();
    TestScanAlphabetics();
    TestScanAlphaOrNumeric();
    TestScanAlphaNumerics();
    TestScanAlphaOrUnderscore();
    TestScanAlphaOrNumericOrUnderscore();
    TestScanString();
    TestScanStrings();

    return testResults("parse_strings");
}
