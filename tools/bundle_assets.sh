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
cat client/js/config/wheels.js >> client/bundle.js
cat client/js/config/config.js >> client/bundle.js

cat client/js/utilities/dom_utilities.js >> client/bundle.js
cat client/js/utilities/utilities.js >> client/bundle.js
cat client/js/utilities/fetch_utilities.js >> client/bundle.js
cat client/js/utilities/message_bus.js >> client/bundle.js
cat client/js/utilities/rollback_state.js >> client/bundle.js

cat client/js/camera/streaming_socket.js >> client/bundle.js

cat client/js/view/view_state_tools.js >> client/bundle.js
cat client/js/view/view_validation_tools.js >> client/bundle.js
cat client/js/view/view_widget_tools.js >> client/bundle.js
cat client/js/view/widget/range/range_widget_controller.js >> client/bundle.js
cat client/js/view/widget/tabs/tab_view_controller.js >> client/bundle.js
cat client/js/view/widget/canvas/plot.js >> client/bundle.js
cat client/js/view/widget/canvas/canvas_painter.js >> client/bundle.js
cat client/js/view/widget/canvas/canvas_view_controller.js >> client/bundle.js

cat client/js/command/command_socket.js >> client/bundle.js
cat client/js/command/rover_command.js >> client/bundle.js

cat client/js/telemetry/pose/pose_canvas_painter.js >> client/bundle.js
cat client/js/telemetry/motor/telemetry_canvas_painter.js >> client/bundle.js
cat client/js/telemetry/telemetry_listener.js >> client/bundle.js
cat client/js/telemetry/telemetry_model_listener.js >> client/bundle.js
cat client/js/telemetry/reset_telemetry_view_controller.js >> client/bundle.js
cat client/js/telemetry/telemetry_view_manager.js >> client/bundle.js

cat client/js/control/joystick/gamepad.js >> client/bundle.js
cat client/js/control/joystick/gamepad_view_controller.js >> client/bundle.js
cat client/js/control/goto_goal/goto_goal_model.js >> client/bundle.js
cat client/js/control/goto_goal/goto_goal_view_controller.js >> client/bundle.js
cat client/js/control/turtle/turtle_keyboard_controller.js >> client/bundle.js
cat client/js/control/turtle/turtle_view_controller.js >> client/bundle.js
cat client/js/control/rover_view_manager.js >> client/bundle.js

cat client/js/calibration/motor/motor_view_controller.js >> client/bundle.js
cat client/js/calibration/pid/speed_control_model.js >> client/bundle.js
cat client/js/calibration/pid/speed_view_controller.js >> client/bundle.js

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
