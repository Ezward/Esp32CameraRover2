#!/bin/bash

# this should be run from the root of the project folder

# bundle .js and .css into concatenated files respectively
tools/bundle_assets.sh

# convert html, js and css into a binary array in a c-header
# so they can be compiled into the application and
# served from memory.
tools/asset_to_c_header.sh index.html index_html.h
tools/asset_to_c_header.sh bundle.js bundle_js.h
tools/asset_to_c_header.sh bundle.css bundle_css.h
