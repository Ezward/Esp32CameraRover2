#ifndef SCAN_H
#define SCAN_H

#ifndef TESTING
    #include <Arduino.h>
#endif

#ifdef Arduino_h
    #include <WString.h>
    #define charToString(_c) (String(_c))
#else
    #include <string>
    #define String std::string
    #define charToString(_c) (String(1, _c))
#endif

#define len(_s) ((_s).length())
#define cstr(_s) ((_s).c_str())
#define tstr(_bool_) ((_bool_) ? "true" : "false")


typedef struct _ScanResult {
    bool matched;   // true if fully matched, false if not
    int index;      // if matched, index of first char after matched span,
                    // otherwise index of start of scan
} ScanResult;

typedef struct _ScanListResult {
    bool matched;   // true if fully matched, false if not
    int index;      // if matched, index of first char after matched span,
                    // otherwise index of start of scan
    int match;      // if matched, index of matched item in list
} ScanListResult;

typedef struct _ScanNumberResult {
    bool matched;   // true if fully matched, false if not
    int index;      // if matched, index of first char after matched span,
                    // otherwise index of start of scan
    bool decimal;   // true if this is a floating point number, false if integer
} ScanNumberResult;

typedef struct _ParseDecimalResult {
    bool matched;   // true if fully matched, false if not
    int index;      // if matched, index of first char after matched span,
                    // otherwise index of start of scan
    float value;   // if matched, then is the floating point value
                    // otherwise NaN (Not a Number)
} ParseDecimalResult;

typedef struct _ParseIntegerResult {
    bool matched;   // true if fully matched, false if not
    int index;      // if matched, index of first char after matched span,
                    // otherwise index of start of scan
    int value;      // if matched, then is the integer
                    // otherwise 0
} ParseIntegerResult;

typedef struct _ParseBooleanResult {
    bool matched;   // true if fully matched, false if not
    int index;      // if matched, index of first char after matched span,
                    // otherwise index of start of scan
    bool value;     // if matched, then is the boolean value
                    // otherwise false
} ParseBooleanResult;

// Scanner function type
typedef ScanResult (*Scanner)(String, int);

// scan_strings
extern ScanResult scanChar(String msg, int offset, char ch);
extern ScanResult scanChars(String msg, int offset, char ch);
extern ScanResult scanAlphabetic(String msg, int offset);
extern ScanResult scanAlphabetics(String msg, int offset);
extern ScanResult scanAlphaOrNumeric(String msg, int offset);
extern ScanResult scanAlphaNumerics(String msg, int offset);
extern ScanResult scanString(String msg, int offset, String s);
extern ScanListResult scanStrings(String msg, int offset, String list[], int lenList);

// scan_numbers
extern ScanResult scanDigit(String msg, int offset);
extern ScanResult scanDigits(String msg, int offset);
extern ScanResult scanDigitSpan(String msg, int offset, int count);
extern ScanResult scanTwoDigits(String msg, int offset);
extern ScanResult scanThreeDigits(String msg, int offset);
extern ScanResult scanFourDigits(String msg, int offset);
extern ScanResult scanTwoDigitSeparator(String msg, int offset, String separator);
extern ScanResult scanFourDigitSeparator(String msg, int offset, String separator);
extern ScanNumberResult scanUnsignedNumber(String msg, int offset);
extern ParseDecimalResult parseUnsignedFloat(String msg, int offset);
extern ParseIntegerResult parseUnsignedInt(String msg, int offset);
extern ParseBooleanResult parseBoolean(String msg, int offset);

// scan_highorder
extern ScanResult scanPrefixed(String msg, int offset, String prefix, Scanner substring);
extern ScanResult scanSuffixed(String msg, int offset, Scanner substring, String suffix);
extern ScanResult scanDelimitedPair(String msg, int offset, Scanner firstSubstring, String delimiter, Scanner secondSubstring);
extern ScanResult scanDelimited(String msg, int offset, String delimiter, Scanner substring);
extern ScanResult scanBracketed(String msg, int offset, String leftBracket, Scanner substring, String rightBracket);
extern ScanResult scanAlphaOrUnderscore(String msg, int offset);
extern ScanResult scanAlphaOrNumericOrUnderscore(String msg, int offset);
extern ScanResult scanRepeated(String msg, int offset, Scanner substring);

#endif
