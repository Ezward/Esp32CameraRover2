#include "scan.h"

/*
** higher order scanners; these compose other scanners into more complex scanners.
 */

//
// higher order scanner: scan a prefixed substring
//
// NOTE: this does not try to handle ambiguous grammar
//       between prefix and substring.  The caller must make sure the
//       prefix does not appear ambiguously in the substring.
//
ScanResult scanPrefixed(
    String msg,         // IN : the string to scan
    int offset,         // IN : the index into the string to start scanning
    String prefix,      // IN : the prefix string to match
    Scanner substring)  // IN : scanner to match substring
                        // RET: scan result 
                        //      matched is true if completely matched, false otherwise
                        //      if matched, offset is index of character after matched span, 
                        //      otherwise return the offset argument unchanged.
{
	return scanBracketed(msg, offset, prefix, substring, "");
}

//
// higher order scanner: scan substring and it's suffix
//
// NOTE: this does not try to handle ambiguous grammar
//       between suffix and substring.  The caller must make sure the
//       suffix does not appear ambiguously in the substring.
//
ScanResult scanSuffixed(
    String msg,         // IN : the string to scan
    int offset,         // IN : the index into the string to start scanning
    Scanner substring,  // IN : scanner to match the substring
    String suffix)      // IN : the suffix to match after the substring is matched
                        // RET: scan result 
                        //      matched is true if completely matched, false otherwise
                        //      if matched, offset is index of character after matched span, 
                        //      otherwise return the offset argument unchanged.
{
	return scanBracketed(msg, offset, "", substring, suffix);
}

//
// higher order scanner: scan two substrings separated by a delimiter
//
// NOTE: this does not try to handle ambiguous grammar
//       between delimiter and substring.  The caller must make sure the
//       delimiter does not appear ambiguously in the substring.
//
ScanResult scanDelimitedPair(
    String msg,                 // IN : the string to scan
    int offset,                 // IN : the index into the string to start scanning
    Scanner firstSubstring,     // IN : scanner to match the first substring
	String delimiter,           // IN : the delimiter to match between substrings
    Scanner secondSubstring)    // IN : the scanner to match the second substring
                                // RET: scan result 
                                //      matched is true if completely matched, false otherwise
                                //      if matched, offset is index of character after matched span, 
                                //      otherwise return the offset argument unchanged.
{
	ScanResult scan = firstSubstring(msg, offset);
	if (scan.matched) {
		scan = scanString(msg, scan.index, delimiter);
		if (scan.matched) {
			// must have another firstSubstring after delimiter
			scan = secondSubstring(msg, scan.index);
			if (scan.matched) {
				return {true, scan.index};
			}
		}
	}
	return {false, offset};
}

//
// higher order scanner: scan substrings separated by delimiters
// (no starting or ending delimiters)
//
// NOTE: this does not try to handle ambiguous grammar
//       between delimiter and substring.  The caller must make sure the
//       delimiter does not appear ambiguously in the substring.
//
ScanResult scanDelimited(
    String msg,         // IN : the string to scan
    int offset,         // IN : the index into the string to start scanning
	String delimiter,   // IN : the delimiter to match between substrings
    Scanner substring)  // IN : the scanner to match the all delimited substrings
                        // RET: scan result 
                        //      matched is true if completely matched, false otherwise
                        //      if matched, offset is index of character after matched span, 
                        //      otherwise return the offset argument unchanged.
{
	ScanResult scan = substring(msg, offset);
	while (scan.matched) {
		scan = scanString(msg, scan.index, delimiter);
		if (scan.matched) {
			// must have another substring after delimiter
			scan = substring(msg, scan.index);
		} else {
			return {true, scan.index};
		}
	}
	return {false, offset};
}

//
// higher order scanner: scan a bracketed substring.
//
// NOTE: this does not try to handle ambiguous grammar
//       between brackets and substring.  The caller must make sure the
//       brackets to not appear ambiguously in the substring.
//
ScanResult scanBracketed(
    String msg,         // IN : the string to scan
    int offset,         // IN : the index into the string to start scanning
    String leftBracket, // IN : left bracket to match
    Scanner substring,  // IN : scanner for substring to match
    String rightBracket)// IN : right bracket to match
                        // RET: scan result 
                        //      matched is true if completely matched, false otherwise
                        //      if matched, offset is index of character after matched span, 
                        //      otherwise return the offset argument unchanged.
{
	ScanResult scan = scanString(msg, offset, leftBracket);
	if (scan.matched) {
		scan = substring(msg, scan.index);
		if (scan.matched) {
			scan = scanString(msg, scan.index, rightBracket);
			if (scan.matched) {
				return {true, scan.index};
			}
		}
	}
	return {false, offset};
}

//
// greedy scan repeated pattern
//
ScanResult scanRepeated(
    String msg,         // IN : the string to scan
    int offset,         // IN : the index into the string to start scanning
    Scanner substring)  // IN : scanner to match repeated substrings
                        // RET: scan result 
                        //      matched is true if completely matched, false otherwise
                        //      if matched, offset is index of character after matched span, 
                        //      otherwise return the offset argument unchanged.
{
	ScanResult scan = substring(msg, offset);
	if (scan.matched) {
		while (scan.matched) {
			scan = substring(msg, scan.index);
		}
		return {true, scan.index};
	}
	return {false, offset};
}
