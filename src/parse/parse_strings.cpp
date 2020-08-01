#include "scan.h"

/*
** scan/parse strings, characters, alphanumerics, etc.
*/

//
// scan for the given character
//
// NOTE: this scans unicode characters.  The offset is in bytes;
//       it should not be assumed the offset will increase
//       by only one when a character is matched; it will
//       increase by the 'width' or number of bytes in the
//       character.
//
ScanResult scanChar(
    String msg,     // IN : the string to scan
    int offset,     // IN : the index into the string to start scanning
    char ch)        // IN : the character to match
                    // RET: scan result 
                    //      matched is true if completely matched, false otherwise
                    //      if matched, offset is index of character after matched span, 
                    //      otherwise return the offset argument unchanged.
{
	if (offset >= 0 && offset < len(msg)) {
        if (ch == msg[offset]) {
            return {true, offset + 1};
        }
	}
	return {false, offset};
}

//
// scan for a single alphabetic character
// like 'a' or 'B'
//
ScanResult scanAlphabetic(
    String msg,     // IN : the string to scan
    int offset)     // IN : the index into the string to start scanning
                    // RET: scan result 
                    //      matched is true if completely matched, false otherwise
                    //      if matched, offset is index of character after matched span, 
                    //      otherwise return the offset argument unchanged.
{
	if (offset >= 0 && offset < len(msg)) {
		if (((msg[offset] >= 'a') && (msg[offset] <= 'z')) || ((msg[offset] >= 'A') && (msg[offset] <= 'Z'))) {
			return {true, offset + 1};
		}
	}
	return {false, offset};
}

//
// greedy scan for a string of one or more alphabetic characters
// like "a", "abc"
//
ScanResult scanAlphabetics(
    String msg,     // IN : the string to scan
    int offset)     // IN : the index into the string to start scanning
                    // RET: scan result 
                    //      matched is true if completely matched, false otherwise
                    //      if matched, offset is index of character after matched span, 
                    //      otherwise return the offset argument unchanged.
{
	return scanRepeated(msg, offset, scanAlphabetic);
}

//
// scan for a single alphabetic or numeric character
// like 'a' or '1'
//
ScanResult scanAlphaOrNumeric(
    String msg,     // IN : the string to scan
    int offset)     // IN : the index into the string to start scanning
                    // RET: scan result 
                    //      matched is true if completely matched, false otherwise
                    //      if matched, offset is index of character after matched span, 
                    //      otherwise return the offset argument unchanged.
{
	ScanResult scan = scanAlphabetic(msg, offset);
	if (!scan.matched) {
		scan = scanDigit(msg, offset);
	}
	return scan;
}

//
// scan for string that starts with a letter, the optionally
// has a span of one or more alphabetic and/or digits
// like "a", "a1", "aa1", "a1a1"
//
ScanResult scanAlphaNumerics(
    String msg,     // IN : the string to scan
    int offset)     // IN : the index into the string to start scanning
                    // RET: scan result 
                    //      matched is true if completely matched, false otherwise
                    //      if matched, offset is index of character after matched span, 
                    //      otherwise return the offset argument unchanged.
{
	ScanResult scan = scanAlphabetic(msg, offset);
	if (scan.matched) {
		scan = scanRepeated(msg, scan.index, scanAlphaOrNumeric);
		return {true, scan.index};
	}
	return {false, offset};
}

//
// scan for alphabetic or underscore character
//
ScanResult scanAlphaOrUnderscore(
    String msg,     // IN : the string to scan
    int offset)     // IN : the index into the string to start scanning
                    // RET: scan result 
                    //      matched is true if completely matched, false otherwise
                    //      if matched, offset is index of character after matched span, 
                    //      otherwise return the offset argument unchanged.
{
	ScanResult scan = scanAlphabetic(msg, offset);
	if (!scan.matched) {
		scan = scanChar(msg, offset, '_');
	}
	return scan;
}

//
// scan for alphabetic or digit or underscore character
//
ScanResult scanAlphaOrNumericOrUnderscore(
    String msg,     // IN : the string to scan
    int offset)     // IN : the index into the string to start scanning
                    // RET: scan result 
                    //      matched is true if completely matched, false otherwise
                    //      if matched, offset is index of character after matched span, 
                    //      otherwise return the offset argument unchanged.
{
	ScanResult scan = scanAlphaOrNumeric(msg, offset);
	if (!scan.matched) {
		scan = scanChar(msg, offset, '_');
	}
	return scan;
}

//
// scan for a given string
//
ScanResult scanString(
    String msg,     // IN : the string to scan
    int offset,     // IN : the index into the string to start scanning
    String s)       // IN : the string to match
                    // RET: scan result 
                    //      matched is true if completely matched, false otherwise
                    //      if matched, offset is index of character after matched span, 
                    //      otherwise return the offset argument unchanged.
{
	//
	// scanning empty string should work if we
	// are within msg or at end of msg
	//
	const int sLen = len(s);
	const int msgLen = len(msg);
	int msgIndex = offset;
	int sIndex = 0;
	while (sIndex < sLen) {
		if (msgIndex >= msgLen || msg[msgIndex] != s[sIndex]) {
			break;
		}
		sIndex += 1;
		msgIndex += 1;
	}
	if (msgIndex <= msgLen && sIndex == sLen) {
		return {true, msgIndex};
	}
	return {false, offset};
}

//
// scan for any of a list of strings
//
ScanListResult scanStrings(
    String msg,     // IN : the string to scan
    int offset,     // IN : the index into the string to start scanning
    String list[],  // IN : the list of strings that are matches (any one can match)
    int lenList)    // IN : number of strings in list
                    // RET: scan result 
                    //      matched is true if completely matched, false otherwise
                    //      if matched, offset is index of character after matched span, 
                    //      otherwise return the offset argument unchanged.
                    //      if matched, match is the index of the matched string in list
                    //      otherwise it is zero.
{
	for (int j = 0; j < lenList; j += 1) {
		ScanResult scan = scanString(msg, offset, list[j]);
		if (scan.matched) {
			return {true, scan.index, j};
		}
	}
	return {false, offset, 0};
}
