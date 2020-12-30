
#
# bundle javascript
#
echo "//////////// bundle.js //////////////" > client/bundle.js
cat client/js/wheels.js >> client/bundle.js
cat client/js/config.js >> client/bundle.js
cat client/js/canvas_view_controller.js >> client/bundle.js
cat client/js/command_socket.js >> client/bundle.js
cat client/js/dom_utilities.js >> client/bundle.js
cat client/js/utilities.js >> client/bundle.js
cat client/js/fetch_utilities.js >> client/bundle.js
cat client/js/gamepad.js >> client/bundle.js
cat client/js/gamepad_listener.js >> client/bundle.js
cat client/js/gamepad_view_controller.js >> client/bundle.js
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
cat client/js/telemetry_view_manager.js >> client/bundle.js
cat client/js/turtle_keyboard_controller.js >> client/bundle.js
cat client/js/turtle_view_controller.js >> client/bundle.js
cat client/js/view_state_tools.js >> client/bundle.js
cat client/js/view_validation_tools.js >> client/bundle.js
cat client/js/view_widget_tools.js >> client/bundle.js
cat client/js/main.js >> client/bundle.js

#
# bundle css
#
cat client/css/styles.css > client/bundle.css
cat client/css/tab.css >> client/bundle.css
