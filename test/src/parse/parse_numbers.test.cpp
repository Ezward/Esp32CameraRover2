#include <string.h>

#include "../../test.h"
#include "../../../src/parse/scan.h"

using namespace std;

void TestScanDigit() {
	//
	// should scan all digits 0..9
	// should scan a single digit
	//
	for (char i = '0'; i <= '9'; i += 1) {
		String digit = charToString(i) + charToString(i);
		ScanResult scan = scanDigit(digit, 0);
		if (!scan.matched) {
			testError("scanDigit(\"%s\", 0) failed to scan; true != %t", cstr(digit), scan.matched);
		}
		if (scan.index != 1) {
			testError("scanDigit(\"%s\", 0) failed to return correct index; 1 != %d", cstr(digit), scan.index);
		}
	}

	for (char i = 'a'; i <= 'z'; i += 1) {
		String digit = charToString(i);
		ScanResult scan = scanDigit(digit, 0);
		if (scan.matched) {
			testError("scanDigit(\"%s\", 0) erroneously scanned; false != %t", cstr(digit), scan.matched);
		}
		if (scan.index != 0) {
			testError("scanDigit(\"%s\", 0) erroneously incremented index; 0 != %d", cstr(digit), scan.index);
		}
	}

	//
	// should not scan empty string,
	// should return the given index, even if out of range
	//
	ScanResult scan = scanDigit("", 0);
	if (scan.matched) {
		testError("scanDigit(\"\", 0) erroneously scanned empty string; false != %t", scan.matched);
	}
	if (scan.index != 0) {
		testError("scanDigit(\"\", 0) returned wrong index; 0 != %d", scan.index);
	}

	//
	// should not scan out of range index,
	// should return the given index, even if out of range
	//
	scan = scanDigit("9", 1);
	if (scan.matched) {
		testError("scanDigit(\"9\", 1) erroneously scanned empty string; false != %t", scan.matched);
	}
	if (scan.index != 1) {
		testError("scanDigit(\"9\", 1) returned wrong index; 1 != %d", scan.index);
	}
}

void TestScanTwoDigits() {
	//
	// happy path
	//
	for (char i = '0'; i <= '9'; i += 1) {
		String digits = charToString(i) + charToString(i);
		ScanResult scan = scanTwoDigits(digits, 0);
		if (!scan.matched) {
			testError("scanTwoDigits(\"%s\", 0) failed to scan; true != %t", cstr(digits), scan.matched);
		}
		if (scan.index != 2) {
			testError("scanTwoDigits(\"%s\", 0) failed to return correct index; 2 != %d", cstr(digits), scan.index);
		}
	}

	//
	// should not scan on any non-digit
	//
	for (char i = '0'; i <= '9'; i += 1) {
		String digits = "a" + charToString(i);
		ScanResult scan = scanTwoDigits(digits, 0);
        if (scan.matched) {
            testError("scanTwoDigits(\"%s\", 0) incorrectly scanned; false != %t", cstr(digits), scan.matched);
		}
        if (scan.index != 0) {
            testError("scanTwoDigits(\"%s\", 0) incorrectly incremented index; 0 != %d", cstr(digits), scan.index);
		}
	}
	for (char i = '0'; i <= '9'; i += 1) {
		String digits = charToString(i) + "a";
		ScanResult scan = scanTwoDigits(digits, 0);
        if (scan.matched) {
            testError("scanTwoDigits(\"%s\", 0) incorrectly scanned; false != %t", cstr(digits), scan.matched);
		}
        if (scan.index != 0) {
            testError("scanTwoDigits(\"%s\", 0) incorrectly incremented index; 0 != %d", cstr(digits), scan.index);
		}
	}

	//
	// should only scan two digits, even if more are consecutive
	//
	for (char i = '0'; i <= '9'; i += 1) {
		String digits = charToString(i) + charToString(i) + charToString(i);
		ScanResult scan = scanTwoDigits(digits, 0);
        if (!scan.matched) {
            testError("scanTwoDigits(\"%s\", 0) failed to scan; true != %t", cstr(digits), scan.matched);
		}
		if (scan.index != 2) {
			testError("scanTwoDigits(\"%s\", 0) failed to return correct index; 2 != %d", cstr(digits), scan.index);
		}
	}

	//
	// should not scan empty string,
	//
	ScanResult scan = scanTwoDigits("", 0);
    if (scan.matched) {
        testError("scanTwoDigits(\"\", 0) erroneously scanned empty string; false != %t", scan.matched);
	}
    if (scan.index != 0) {
        testError("scanTwoDigits(\"\", 0) returned wrong index; 0 != %d", scan.index);
	}

	//
	// should not scan out of range index,
	//
	scan = scanTwoDigits("99", 3);
    if (scan.matched) {
        testError("scanTwoDigits(\"99\", 3) erroneously scanned out of range index; false != %t", scan.matched);
	}
	if (scan.index != 3) {
		testError("scanTwoDigits(\"99\", 3) returned wrong index; 3 != %d", scan.index);
	}
}

void TestScanThreeDigits() {
	//
	// happy path
	//
	for (char i = '0'; i <= '9'; i += 1) {
		String digits = charToString(i) + charToString(i) + charToString(i);
		ScanResult scan = scanThreeDigits(digits, 0);
        if (!scan.matched) {
            testError("scanThreeDigits(\"%s\", 0) failed to scan; true != %t", cstr(digits), scan.matched);
		}
		if (scan.index != 3) {
			testError("scanThreeDigits(\"%s\", 0) failed to return correct index; 3 != %d", cstr(digits), scan.index);
		}
	}

	//
	// should fail is any non digits
	//
	for (char i = '0'; i <= '9'; i += 1) {
		String digits = "a" + charToString(i) + charToString(i);
		ScanResult scan = scanThreeDigits(digits, 0);
        if (scan.matched) {
            testError("scanThreeDigits(\"%s\", 0) incorrectly scanned; false != %t", cstr(digits), scan.matched);
		}
        if (scan.index != 0) {
            testError("scanThreeDigits(\"%s\", 0) incorrectly incremented index; 0 != %d", cstr(digits), scan.index);
		}
	}
	for (char i = '0'; i <= '9'; i += 1) {
		String digits = charToString(i) + charToString(i) + "a";
		ScanResult scan = scanThreeDigits(digits, 0);
        if (scan.matched) {
            testError("scanThreeDigits(\"%s\", 0) incorrectly scanned; false != %t", cstr(digits), scan.matched);
		}
        if (scan.index != 0) {
            testError("scanThreeDigits(\"%s\", 0) incorrectly incremented index; 0 != %d", cstr(digits), scan.index);
		}
	}

	//
	// should only scan 3 digits even if there are more
	//
	for (char i = '0'; i <= '9'; i += 1) {
		String digits = charToString(i) + charToString(i) + charToString(i) + charToString(i);
		ScanResult scan = scanThreeDigits(digits, 0);
        if (!scan.matched) {
            testError("scanThreeDigits(\"%s\", 0) failed to scan; true != %t", cstr(digits), scan.matched);
		}
		if (scan.index != 3) {
			testError("scanThreeDigits(\"%s\", 0) failed to return correct index; 3 != %d", cstr(digits), scan.index);
		}
	}

	//
	// should not scan empty string,
	//
	ScanResult scan = scanThreeDigits("", 0);
    if (scan.matched) {
        testError("scanThreeDigits(\"\", 0) erroneously scanned empty string; false != %t", scan.matched);
	}
	if (scan.index != 0) {
		testError("scanThreeDigits(\"\", 0) returned wrong index; 0 != %d", scan.index);
	}

	//
	// should not scan out of range index,
	//
	scan = scanThreeDigits("999", 4);
    if (scan.matched) {
        testError("scanThreeDigits(\"999\", 4) erroneously scanned out of range index; false != %t", scan.matched);
	}
	if (scan.index != 4) {
		testError("scanThreeDigits(\"999\", 4) returned wrong index; 4 != %d", scan.index);
	}
}


void TestScanFourDigits() {
	//
	// happy path
	//
	for (char i = '0'; i <= '9'; i += 1) {
		String digits = charToString(i) + charToString(i) + charToString(i) + charToString(i);
		ScanResult scan = scanFourDigits(digits, 0);
        if (!scan.matched) {
            testError("scanFourDigits(\"%s\", 0) failed to scan; true != %t", cstr(digits), scan.matched);
		}
		if (scan.index != len(digits)) {
			testError("scanFourDigits(\"%s\", 0) failed to return correct index; %d != %d", cstr(digits), len(digits), scan.index);
		}
	}

	//
	// should fail is any non digits
	//
	for (char i = '0'; i <= '9'; i += 1) {
		String digits = charToString(i) + charToString(i) + "a" + charToString(i) + charToString(i);
		ScanResult scan = scanFourDigits(digits, 0);
        if (scan.matched) {
            testError("scanFourDigits(\"%s\", 0) incorrectly scanned; false != %t", cstr(digits), scan.matched);
		}
        if (scan.index != 0) {
            testError("scanFourDigits(\"%s\", 0) incorrectly incremented index; 0 != %d", cstr(digits), scan.index);
		}
	}
	for (char i = '0'; i <= '9'; i += 1) {
		String digits = charToString(i) + charToString(i) + charToString(i) + "a" + charToString(i);
		ScanResult scan = scanFourDigits(digits, 0);
        if (scan.matched) {
            testError("scanFourDigits(\"%s\", 0) incorrectly scanned; false != %t", cstr(digits), scan.matched);
		}
        if (scan.index != 0) {
            testError("scanFourDigits(\"%s\", 0) incorrectly incremented index; 0 != %d", cstr(digits), scan.index);
		}
	}

	//
	// should only scan 4 digits even if there are more
	//
	for (char i = '0'; i <= '9'; i += 1) {
		String digits = charToString(i) + charToString(i) + charToString(i) + charToString(i) + charToString(i);
		ScanResult scan = scanFourDigits(digits, 0);
        if (!scan.matched) {
            testError("scanFourDigits(\"%s\", 0) failed to scan; true != %t", cstr(digits), scan.matched);
		}
		if (scan.index != 4) {
			testError("scanFourDigits(\"%s\", 0) failed to return correct index; 4 != %d", cstr(digits), scan.index);
		}
	}

	//
	// should not scan empty string,
	//
	ScanResult scan = scanFourDigits("", 0);
    if (scan.matched) {
        testError("scanFourDigits(\"\", 0) erroneously scanned empty string; false != %t", scan.matched);
	}
	if (scan.index != 0) {
		testError("scanFourDigits(\"\", 0) returned wrong index; 0 != %d", scan.index);
	}

	//
	// should not scan out of range index,
	//
	scan = scanFourDigits("9999", 5);
    if (scan.matched) {
        testError("scanFourDigits(\"9999\", 5) erroneously scanned out of range index; false != %t", scan.matched);
	}
	if (scan.index != 5) {
		testError("scanFourDigits(\"9999\", 5) returned wrong index; 5 != %d", scan.index);
	}
}


void TestScanDigitSpan() {
	//
	// happy path
	//
	for (char i = '0'; i <= '9'; i += 1) {
		String digits = charToString(i) + charToString(i) + charToString(i) + charToString(i);
		ScanResult scan = scanDigitSpan(digits, 0, len(digits));
        if (!scan.matched) {
            testError("scanDigitSpan(\"%s\", 0, %d) failed to scan; true != %t", cstr(digits), len(digits), scan.matched);
		}
		if (scan.index != len(digits)) {
			testError("scanDigitSpan(\"%s\", 0) failed to return correct index; %d != %d", cstr(digits), len(digits), scan.index);
		}
	}

	//
	// should fail on any non digits
	//
	for (char i = '0'; i <= '9'; i += 1) {
		String digits = charToString(i) + "a" + charToString(i) + charToString(i);
		ScanResult scan = scanDigitSpan(digits, 0, len(digits));
        if (scan.matched) {
            testError("scanDigitSpan(\"%s\", 0, %d) erroneously scanned; true != %t", cstr(digits), len(digits), scan.matched);
		}
		if (scan.index != 0) {
			testError("scanDigitSpan(\"%s\", 0) erroneously incremented index; %d != %d", cstr(digits), len(digits), scan.index);
		}
	}
	for (char i = '0'; i <= '9'; i += 1) {
		String digits = charToString(i) + charToString(i) + charToString(i) + "a";
		ScanResult scan = scanDigitSpan(digits, 0, len(digits));
        if (scan.matched) {
            testError("scanDigitSpan(\"%s\", 0, %d) erroneously scanned; true != %t", cstr(digits), len(digits), scan.matched);
		}
		if (scan.index != 0) {
			testError("scanDigitSpan(\"%s\", 0) erroneously incremented index; %d != %d", cstr(digits), len(digits), scan.index);
		}
	}

	//
	// should only scan 'count' digits even if there are more
	//
	for (char i = '0'; i <= '9'; i += 1) {
		String digits = charToString(i) + charToString(i) + charToString(i) + charToString(i);
		ScanResult scan = scanDigitSpan(digits, 0, len(digits)-1);
		if (!scan.matched) {
			testError("scanDigitSpan(\"%s\", 0, %d) failed to scan; true != %t", cstr(digits), len(digits)-1, scan.matched);
		}
		if (scan.index != len(digits) - 1) {
			testError("scanDigitSpan(\"%s\", 0) failed to return correct index; %d != %d", cstr(digits), len(digits)-1, scan.index);
		}
	}

	//
	// scanning zero chars should succeed, even on empty buffer.
	//
	ScanResult scan = scanDigitSpan("", 0, 0);
    if (!scan.matched) {
        testError("scanDigitSpan(\"\", 0, 0) failed to scan zero chars in empty string; false != %t", scan.matched);
	}
	if (scan.index != 0) {
		testError("scanDigitSpan(\"\", 0, 0) returned wrong index; 0 != %d", scan.index);
	}

	//
	// should not scan and should return the given index if out of range
	//
	scan = scanDigitSpan("9", 2, 1);
	if (scan.matched) {
		testError("scanDigitSpan(\"\", 0, %c) erroneously scanned empty string; false != %t", ':', scan.matched);
	}
	if (scan.index != 2) {
		testError("scanDigitSpan(\"\", 0, %c) returned wrong index; 2 != %d", ':', scan.index);
	}
}


void TestScanTwoDigitSeparator() {
	//
	// happy path
	//
	for (char i = '0'; i <= '9'; i += 1) {
		String digits = charToString(i) + charToString(i) + ":" + charToString(i);
		ScanResult scan = scanTwoDigitSeparator(digits, 0, ":");
		if (!scan.matched) {
			testError("scanTwoDigitSeparator(\"%s\", 0, \":\") failed to scan; true != %t", cstr(digits), scan.matched);
		}
		if (scan.index != len(digits) - 1) {
			testError("scanTwoDigitSeparator(\"%s\", 0, \":\") failed to return correct index; %d != %d", cstr(digits), len(digits)-1, scan.index);
		}
	}

	//
	// should fail if it does not see separator
	//
	for (char i = '0'; i <= '9'; i += 1) {
		String digits = charToString(i) + charToString(i) + charToString(i);
		ScanResult scan = scanTwoDigitSeparator(digits, 0, ":");
		if (scan.matched) {
			testError("scanTwoDigitSeparator(\"%s\", 0, \":\") erroneously scanned; false != %t", cstr(digits), scan.matched);
		}
		if (scan.index != 0) {
			testError("scanTwoDigitSeparator(\"%s\", 0, \":\") erroneously incremented index; 0 != %d", cstr(digits), scan.index);
		}
	}

	//
	// should not scan empty string,
	//
	ScanResult scan = scanTwoDigitSeparator("", 0, ":");
    if (scan.matched) {
        testError("scanTwoDigitSeparator(\"\", 0, \":\") erroneously scanned empty string; false != %t", scan.matched);
	}
	if (scan.index != 0) {
		testError("scanTwoDigitSeparator(\"\", 0, \":\") returned wrong index; 0 != %d", scan.index);
	}

	//
	// should not scan out of range index,
	//
	scan = scanTwoDigitSeparator("99:", 4, ":");
    if (scan.matched) {
        testError("scanTwoDigitSeparator(\"99:\", 4, \":\") erroneously scanned out of range index; false != %t", scan.matched);
	}
	if (scan.index != 4) {
		testError("scanTwoDigitSeparator(\"99:\", 4, \":\") returned wrong index; 4 != %d", scan.index);
	}
}

void TestScanFourDigitSeparator() {
	//
	// happy path
	//
	for (char i = '0'; i <= '9'; i += 1) {
		String digits = charToString(i) + charToString(i) + charToString(i) + charToString(i) + ":" + charToString(i);
		ScanResult scan = scanFourDigitSeparator(digits, 0, ":");
		if (!scan.matched) {
			testError("scanFourDigitSeparator(\"%s\", 0, \":\") failed to scan; true != %t", cstr(digits), scan.matched);
		}
		if (scan.index != len(digits) - 1) {
			testError("scanFourDigitSeparator(\"%s\", 0, \":\") failed to return correct index; %d != %d", cstr(digits), len(digits)-1, scan.matched);
		}
	}

	//
	// should fail if it does not see separator
	//
	for (char i = '0'; i <= '9'; i += 1) {
		String digits = charToString(i) + charToString(i) + charToString(i) + charToString(i) + charToString(i);
		ScanResult scan = scanFourDigitSeparator(digits, 0, ":");
		if (scan.matched) {
			testError("scanFourDigitSeparator(\"%s\", 0, \":\") erroneously scanned; false != %t", cstr(digits), scan.matched);
		}
		if (scan.index != 0) {
			testError("scanFourDigitSeparator(\"%s\", 0, \":\") erroneously incremented index; 0 != %d", cstr(digits), scan.index);
		}
	}

	//
	// should not scan empty string
	//
	ScanResult scan = scanFourDigitSeparator("", 0, ":");
    if (scan.matched) {
        testError("scanFourDigitSeparator(\"\", 0, \":\") erroneously scanned empty string; false != %t", scan.matched);
	}
	if (scan.index != 0) {
		testError("scanFourDigitSeparator(\"\", 0, \":\") returned wrong index; 0 != %d", scan.index);
	}

	//
	// should not scan out of range index,
	//
	scan = scanFourDigitSeparator("9999:", 4, ":");
    if (scan.matched) {
        testError("scanFourDigitSeparator(\"9999:\", 4, \":\") erroneously scanned out of range index; false != %t", scan.matched);
	}
	if (scan.index != 4) {
		testError("scanFourDigitSeparator(\"9999:\", 4, \":\") returned wrong index; 4 != %d", scan.index);
	}
}


void TestScanUnsignedNumber() {
	//
	// should scan run of alphabetic characters
	//
	String buffer = "1234567890";
	ScanNumberResult scan = scanUnsignedNumber(buffer, 0);
	if (!scan.matched) {
		testError("scanUnsignedNumber(\"%s\", 0) failed to scan; true != %t", cstr(buffer), scan.matched);
	}
	if (scan.index != len(buffer)) {
		testError("scanUnsignedNumber(\"%s\", 0) failed to return correct index; %d != %d", cstr(buffer), len(buffer), scan.index);
	}
	if (scan.decimal) {
		testError("scanUnsignedNumber(\"%s\", 0) erroneously scanned decimal number; false != %t", cstr(buffer), scan.decimal);
	}

	buffer = "1234567890.0987654321";
	scan = scanUnsignedNumber(buffer, 0);
	if (!scan.matched) {
		testError("scanUnsignedNumber(\"%s\", 0) failed to scan; true != %t", cstr(buffer), scan.matched);
	}
	if (scan.index != len(buffer)) {
		testError("scanUnsignedNumber(\"%s\", 0) failed to return correct index; %d != %d", cstr(buffer), len(buffer), scan.index);
	}
	if (!scan.decimal) {
		testError("scanUnsignedNumber(\"%s\", 0) erroneously scanned integer number; true != %t", cstr(buffer), scan.decimal);
	}

	//
	// should not scan hanging decimal point
	//
	buffer = "1234567890.";
	scan = scanUnsignedNumber(buffer, 0);
	if (scan.matched) {
		testError("scanUnsignedNumber(\"%s\", 0) erroneously scanned; false != %t", cstr(buffer), scan.matched);
	}
	if (scan.index != 0) {
		testError("scanUnsignedNumber(\"%s\", 0) erroneously incremented index; 0 != %d", cstr(buffer), scan.index);
	}

	//
	// should not scan non-matching character
	//
	buffer = "-123456789";
	scan = scanUnsignedNumber(buffer, 0);
	if (scan.matched) {
		testError("scanUnsignedNumber(\"%s\", 0) erroneously scanned; false != %t", cstr(buffer), scan.matched);
	}
	if (scan.index != 0) {
		testError("scanUnsignedNumber(\"%s\", 0) erroneously incremented index; 0 != %d", cstr(buffer), scan.index);
	}

	//
	// should not scan empty string,
	//
	scan = scanUnsignedNumber("", 0);
	if (scan.matched) {
		testError("scanUnsignedNumber(\"\", 0) erroneously scanned empty string; false != %t", scan.matched);
	}
	if (scan.index != 0) {
		testError("scanUnsignedNumber(\"\", 0) returned wrong index; 0 != %d", scan.index);
	}

	//
	// should not scan out of range,
	// should return the given index, even if out of range
	//
	scan = scanUnsignedNumber(buffer, len(buffer) + 1);
	if (scan.matched) {
		testError("scanUnsignedNumber(\"%s\", %d) erroneously scanned out of range index; false != %t", cstr(buffer), len(buffer)+1, scan.matched);
	}
	if (scan.index != len(buffer) + 1) {
		testError("scanUnsignedNumber(\"%s\", %d) returned wrong index; 6 != %d", cstr(buffer), len(buffer)+1, scan.index);
	}
}


void TestParseUnsignedFloat() {
	//
	// should scan run of digits and a decimal and parse as float
	//
	String buffer = "1.1";
	ParseDecimalResult scan = parseUnsignedFloat(buffer, 0);
	if (!scan.matched) {
		testError("parseUnsignedFloat(\"%s\", 0) failed to scan; true != %t", cstr(buffer), scan.matched);
	}
	if (scan.index != len(buffer)) {
		testError("parseUnsignedFloat(\"%s\", 0) failed to return correct index; %d != %d", cstr(buffer), len(buffer), scan.index);
	}
	if (scan.value != 1.1) {
		testError("parseUnsignedFloat(\"%s\", 0) returned incorrect value; 1.1 != %f", cstr(buffer), scan.value);
	}

    //
    // should can number without a decimal and parse as float
    //
	buffer = "123";
	scan = parseUnsignedFloat(buffer, 0);
	if (!scan.matched) {
		testError("parseUnsignedFloat(\"%s\", 0) failed to scan; true != %t", cstr(buffer), scan.matched);
	}
	if (scan.index != len(buffer)) {
		testError("parseUnsignedFloat(\"%s\", 0) failed to return correct index; %d != %d", cstr(buffer), len(buffer), scan.index);
	}
	if (scan.value != 123) {
		testError("parseUnsignedFloat(\"%s\", 0) returned incorrect value; 123 != %f", cstr(buffer), scan.value);
	}

}


void TestParseUnsignedInt() {
	//
	// should scan run of digits and parse into an integer
	//
	String buffer = "123";
	ParseIntegerResult scan = parseUnsignedInt(buffer, 0);
	if (!scan.matched) {
		testError("parseUnsignedInt(\"%s\", 0) failed to scan; true != %t", cstr(buffer), scan.matched);
	}
	if (scan.index != len(buffer)) {
		testError("parseUnsignedInt(\"%s\", 0) failed to return correct index; %d != %d", cstr(buffer), len(buffer), scan.index);
	}
	if (scan.value != 123) {
		testError("parseUnsignedInt(\"%s\", 0) returned incorrect value; 123 != %d", cstr(buffer), scan.value);
	}
}

void TestParseBoolean() {
	//
	// should scan run of alphabetic characters
	//
    {
        String buffers[] = {"TRUE", "True", "true"};
        int lenBuffers = sizeof(buffers) / sizeof(buffers[0]);

        for (int i = 0; i < lenBuffers; i += 1) {
            String buffer = buffers[i];
            ParseBooleanResult scan = parseBoolean(buffer, 0);
            if (!scan.matched) {
                testError("parseBoolean(\"%s\", 0) failed to scan; true != %s\n", cstr(buffer), tstr(scan.matched));
            }
            if (len(buffer) != scan.index) {
                testError("parseBoolean(\"%s\", 0) failed to return correct character index; %d != %d\n", cstr(buffer), len(buffer), scan.index);
            }
            if (true != scan.value) {
                testError("parseBoolean(\"%s\", 0) failed to return correct value; true != %s\n", cstr(buffer), tstr(scan.value));
            }
        }
    }

    {
        String buffers[] = {"FALSE", "False", "false"};
        int lenBuffers = sizeof(buffers) / sizeof(buffers[0]);

        for (int i = 0; i < lenBuffers; i += 1) {
            String buffer = buffers[i];
            ParseBooleanResult scan = parseBoolean(buffer, 0);
            if (!scan.matched) {
                testError("parseBoolean(\"%s\", 0) failed to scan; true != %s\n", cstr(buffer), tstr(scan.matched));
            }
            if (scan.index != len(buffer)) {
                testError("parseBoolean(\"%s\", 0) failed to return correct character index; %d != %d\n", cstr(buffer), len(buffer), scan.index);
            }
            if (false != scan.value) {
                testError("parseBoolean(\"%s\", 0) failed to return correct value; false != %s\n", cstr(buffer), tstr(scan.value));
            }
        }
    }

	//
	// should not scan non-matching character
	//
	String buffer = "notAMatch";
	ParseBooleanResult scan = parseBoolean(buffer, 0);
	if (scan.matched) {
		testError("parseBoolean(\"%s\", 0) erroneously scanned; false != %s\n", cstr(buffer), tstr(scan.matched));
	}
	if (scan.index != 0) {
		testError("parseBoolean(\"%s\", 0) erroneously incremented index; 0 != %d\n", cstr(buffer), scan.index);
	}
    if (false != scan.value) {
        testError("parseBoolean(\"%s\", 0) failed to return correct value; false != %s\n", cstr(buffer), tstr(scan.value));
    }

	//
	// should not scan empty string,
	//
	scan = parseBoolean("", 0);
	if (scan.matched) {
		testError("parseBoolean(\"\", 0) erroneously scanned empty string; false != %s\n", tstr(scan.matched));
	}
	if (scan.index != 0) {
		testError("parseBoolean(\"\", 0) returned wrong index; 0 != %d\n", scan.index);
	}
    if (false != scan.value) {
        testError("parseBoolean(\"\", 0) failed to return correct value; false != %s\n", tstr(scan.value));
    }

	//
	// should not scan out of range,
	// should return the given index, even if out of range
	//
    scan = parseBoolean("true", 4);
	if (scan.matched) {
		testError("parseBoolean(\"true\", 4) erroneously scanned empty string; false != %s\n", tstr(scan.matched));
	}
	if (4 != scan.index) {
		testError("parseBoolean(\"true\", 4) returned wrong index; 4 != %d\n",  scan.index);
	}
    if (false != scan.value) {
        testError("parseBoolean(\"true\", 4) failed to return correct value; false != %s\n",  tstr(scan.value));
    }

}

int main() {
    // from test folder run: 
    // gcc -std=c++11 -Wc++11-extensions -lstdc++ test.cpp src/parse/parse_numbers.test.cpp ../src/parse/*.cpp; ./a.out; rm a.out

    TestScanDigit();
    TestScanTwoDigits();
    TestScanThreeDigits();
    TestScanFourDigits();
    TestScanDigitSpan();
    TestScanTwoDigitSeparator();
    TestScanFourDigitSeparator();
    TestScanUnsignedNumber();
    TestParseUnsignedFloat();
    TestParseUnsignedInt();
    TestParseBoolean();

    return testResults("parse_numbers");
}
