#include "scan.h"
#include <stdlib.h>

/*
** scan/parse digits and numbers.
 */

//
// scan for a single digit character
//
ScanResult scanDigit(
    String msg,     // IN : the string to scan
    int offset)     // IN : the index into the string to start scanning
                    // RET: scan result 
                    //      matched is true if completely matched, false otherwise
                    //      if matched, offset is index of character after matched span, 
                    //      otherwise return the offset argument unchanged.
{
	if (offset >= 0 && offset < len(msg) && msg[offset] >= '0' && msg[offset] <= '9') {
		return {true, offset + 1};
	}
	return {false, offset};
}

//
// greedy scan one or more digits
//
ScanResult scanDigits(
    String msg,     // IN : the string to scan
    int offset)     // IN : the index into the string to start scanning
                    // RET: scan result 
                    //      matched is true if completely matched, false otherwise
                    //      if matched, offset is index of character after matched span, 
                    //      otherwise return the offset argument unchanged.
{
	return scanRepeated(msg, offset, scanDigit);
}

//
// scan exact number of digits
//
ScanResult scanDigitSpan(
    String msg,     // IN : the string to scan
    int offset,     // IN : the index into the string to start scanning
    int count)      // IN : the number digits to match in the span
                    // RET: scan result 
                    //      matched is true if completely matched, false otherwise
                    //      if matched, offset is index of character after matched span, 
{
    ScanResult scan = {true, offset};
	for (int n = count; scan.matched && n > 0; n -= 1) {
		scan = scanDigit(msg, scan.index);
	}
	if (scan.matched) {
		return scan;
	}
	return {false, offset};
}

ScanResult scanTwoDigits(
    String msg,     // IN : the string to scan
    int offset)     // IN : the index into the string to start scanning
                    // RET: scan result 
                    //      matched is true if completely matched, false otherwise
                    //      if matched, offset is index of character after matched span, 
                    //      otherwise return the offset argument unchanged.
{
	return scanDigitSpan(msg, offset, 2);
}

ScanResult scanThreeDigits(
    String msg,     // IN : the string to scan
    int offset)     // IN : the index into the string to start scanning
                    // RET: scan result 
                    //      matched is true if completely matched, false otherwise
                    //      if matched, offset is index of character after matched span, 
                    //      otherwise return the offset argument unchanged.
{
	return scanDigitSpan(msg, offset, 3);
}

ScanResult scanFourDigits(
    String msg,     // IN : the string to scan
    int offset)     // IN : the index into the string to start scanning
                    // RET: scan result 
                    //      matched is true if completely matched, false otherwise
                    //      if matched, offset is index of character after matched span, 
                    //      otherwise return the offset argument unchanged.
{
	return scanDigitSpan(msg, offset, 4);
}

ScanResult scanTwoDigitSeparator(
    String msg,         // IN : the string to scan
    int offset,         // IN : the index into the string to start scanning
    String separator)   // IN : the suffix to match after the digits
                        // RET: scan result 
                        //      matched is true if completely matched, false otherwise
                        //      if matched, offset is index of character after matched span, 
                        //      otherwise return the offset argument unchanged.
{
	return scanSuffixed(msg, offset, scanTwoDigits, separator);
}

ScanResult scanFourDigitSeparator(
    String msg,         // IN : the string to scan
    int offset,         // IN : the index into the string to start scanning
    String separator)   // IN : the suffix to match after the digits
                        // RET: scan result 
                        //      matched is true if completely matched, false otherwise
                        //      if matched, offset is index of character after matched span, 
                        //      otherwise return the offset argument unchanged.
{
	return scanSuffixed(msg, offset, scanFourDigits, separator);
}

//
// scan an unsigned number like '123' or '456.789'
// and return if it matched, it's ending offset
// and if it included a decimal
//
ScanNumberResult scanUnsignedNumber(
    String msg,     // IN : the string to scan
    int offset)     // IN : the index into the string to start scanning
                    // RET: scan result 
                    //      matched is true if completely matched, false otherwise
                    //      if matched, offset is index of character after matched span, 
                    //      otherwise return the offset argument unchanged.
                    //      if matched, decimal is true if a floating point number was matched
                    //      and false if an integer was matched or if matched is false.
{
	ScanResult scan = scanDigits(msg, offset);
	if (!scan.matched) {
		return {false, offset, false}; // failed scanning integer
	}

	//
	// scan decimal
	//
	scan = scanChar(msg, scan.index, '.');
	if (!scan.matched) {
		return {true, scan.index, false}; // matched integer
	}

	scan = scanDigits(msg, scan.index);
	if (scan.matched) {
		return {true, scan.index, true}; // matched float
	}

	return {false, offset, true}; // failed scanning float
}

ParseDecimalResult parseUnsignedFloat(
    String msg,     // IN : the string to scan
    int offset)     // IN : the index into the string to start scanning
                    // RET: scan result 
                    //      matched is true if completely matched, false otherwise
                    //      if matched, offset is index of character after matched span, 
                    //      otherwise return the offset argument unchanged.
                    //      if matched, value is the floating point value
                    //      otherwise it is floating point zero.
{
	ScanNumberResult scan = scanUnsignedNumber(msg, offset);
	if (scan.matched) {
		double f = strtod(cstr(msg) + offset, NULL);
		return {true, scan.index, f};
	}
	return {false, offset, 0.0};
}

ParseIntegerResult parseUnsignedInt(
    String msg,     // IN : the string to scan
    int offset)     // IN : the index into the string to start scanning
                    // RET: scan result 
                    //      matched is true if completely matched, false otherwise
                    //      if matched, offset is index of character after matched span, 
                    //      otherwise return the offset argument unchanged.
                    //      if matched, value is the floating point value
                    //      otherwise it is floating point zero.
{
	ScanResult scan = scanDigits(msg, offset);
	if (scan.matched) {
		int i = atoi(cstr(msg) + offset);
		return {true, scan.index, i};
	}
	return {false, offset, 0};
}

String booleans[] = {
    "true",
    "True",
    "TRUE",
    "false",
    "False",
    "FALSE"
};
const int lenBooleans = sizeof(booleans) / sizeof(booleans[0]);

ParseBooleanResult parseBoolean(
    String msg,     // IN : the string to scan
    int offset)     // IN : the index into the string to start scanning
                    // RET: scan result 
                    //      matched is true if completely matched, false otherwise
                    //      if matched, offset is index of character after matched span, 
                    //      otherwise return the offset argument unchanged.
                    //      if matched, value is the floating point value
                    //      otherwise it is floating point zero.
{
	ScanListResult scan = scanStrings(msg, offset, booleans, lenBooleans);
	if (scan.matched) {
		return {true, scan.index, scan.match < 3};    // first three values are true, next 3 are false
	}
	return {false, offset, false};
}
