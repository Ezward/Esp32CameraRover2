: ${STRIP:=false}
: ${COMPRESS:=false}  # NOTE: asset_to_c_header.sh will gzip before converting to .h file.

rm -f client/bundle.js
rm -f client/bundle.js.gz
rm -f client/bundle.jsdoc.js

#
# bundle javascript
#
# Concatenate the javascript files, ordering
# them so that dependencies are early in the 
# file.  So main.js, which is the entry point,
# is _last_ in the file and we guarantee
# all of it's dependencies are satisfied.
#
echo "//////////// bundle.js //////////////" > client/bundle.js
cat client/js/wheels.js >> client/bundle.js
cat client/js/config.js >> client/bundle.js
cat client/js/canvas_painter.js >> client/bundle.js
cat client/js/canvas_view_controller.js >> client/bundle.js
cat client/js/command_socket.js >> client/bundle.js
cat client/js/dom_utilities.js >> client/bundle.js
cat client/js/utilities.js >> client/bundle.js
cat client/js/fetch_utilities.js >> client/bundle.js
cat client/js/gamepad.js >> client/bundle.js
cat client/js/gamepad_view_controller.js >> client/bundle.js
cat client/js/goto_goal_model.js >> client/bundle.js
cat client/js/goto_goal_view_controller.js >> client/bundle.js
cat client/js/message_bus.js >> client/bundle.js
cat client/js/motor_view_controller.js >> client/bundle.js
cat client/js/plot.js >> client/bundle.js
cat client/js/pose_canvas_painter.js >> client/bundle.js
cat client/js/range_widget_controller.js >> client/bundle.js
cat client/js/reset_telemetry_view_controller.js >> client/bundle.js
cat client/js/rollback_state.js >> client/bundle.js
cat client/js/rover_command.js >> client/bundle.js
cat client/js/rover_view_manager.js >> client/bundle.js
cat client/js/speed_control_model.js >> client/bundle.js
cat client/js/speed_view_controller.js >> client/bundle.js
cat client/js/streaming_socket.js >> client/bundle.js
cat client/js/tab_view_controller.js >> client/bundle.js
cat client/js/telemetry_canvas_painter.js >> client/bundle.js
cat client/js/telemetry_listener.js >> client/bundle.js
cat client/js/telemetry_model_listener.js >> client/bundle.js
cat client/js/telemetry_view_manager.js >> client/bundle.js
cat client/js/turtle_keyboard_controller.js >> client/bundle.js
cat client/js/turtle_view_controller.js >> client/bundle.js
cat client/js/view_state_tools.js >> client/bundle.js
cat client/js/view_validation_tools.js >> client/bundle.js
cat client/js/view_widget_tools.js >> client/bundle.js
cat client/js/main.js >> client/bundle.js

# 
# strip jsdoc comments; '/** ... */'
# and typescript directives '///...'
#
if [ "$STRIP" == "true" ]; then
    cp client/bundle.js client/bundle.jsdoc.js
    # sed '/\/\*\*.*\*\// d; /\/\*\*/,/\*\// d' client/bundle.jsdoc.js > client/bundle.js

    # replace inline jsdoc /** .. */ with empty string
    sed 's/\/\*\*.*\*\///g' client/bundle.js > client/bundle.1.js

    # delete multiline jsdoc /** .. */
    sed '/\/\*\*/,/\*\//d' client/bundle.1.js > client/bundle.2.js

    # delete triple-slash comment lines (typescript directives) ///
    sed '/^\/\/\//d' client/bundle.2.js > client/bundle.js

    rm -f client/bundle.1.js
    rm -f client/bundle.2.js
fi

#
# gzip compress the bundle
# NOTE: the asset_to_c_header already does the gzip,
#       so this would only be useful if serving
#       from a file rather that as a header.
#
if [ "$COMPRESS" == "true" ]; then
    gzip -9 -f client/bundle.js
fi

#
# bundle css
#
cat client/css/styles.css > client/bundle.css
cat client/css/tab.css >> client/bundle.css
