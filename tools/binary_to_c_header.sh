#!/bin/bash

#
# read the webpage, compress it and conver the result into
# a c-language compatible header file.
# (effectively taking the web page and turning into data so
# the webserver can serve it without reading from a file).
#

# TODO: add argument checking and help
# TODO: interpolate the names in thse two lines from the first argument
echo "#define index_ov2640_html_gz_len sizeof(index_ov2640_html_gz)" > $2
echo "const uint8_t index_ov2640_html_gz[] = {" >> $2

#
# gzip file and convert file to c-language array of hex literals
#
gzip -c $1 | hexdump -v -e '16/1 "_x%02X" "\n"' | sed 's/_/\\/g; s/\\x  //g; s/.*/    "&"/' >> $2

echo "};" >> $2
