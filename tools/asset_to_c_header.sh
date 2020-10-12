#!/bin/bash

#
# read the the asset file at 'client/$1', then compress it and 
# convert the result int0 c-language compatible header file
# in the src file.
# (effectively taking the asset and turning into data so
# the webserver can serve it without reading from a file).
#
# Usage from root of project folder:
#  tools/asset_to_c_header.sh bundle.css
# will create the header file 'src/bundle_css.h'
#

# TODO: add argument checking and help

#
# replace period with underscore to create name prefix
#
PREFIX="${1//\./_}"

#
# output declaration
#
echo "#define ${PREFIX}_len sizeof(${PREFIX}_gz)" > "src/${PREFIX}.h"
echo "const uint8_t ${PREFIX}_gz[] = {" >> "src/${PREFIX}.h"

#
# gzip file and convert file to c-language array of hex literals
#
gzip -c "client/$1" | hexdump -v -e '16/1 "_x%02X" "\n"' | sed 's/_/\\/g; s/\\x  //g; s/.*/    "&"/' >> "src/${PREFIX}.h"

#
# close declaration
#
echo "};" >> "src/${PREFIX}.h"
