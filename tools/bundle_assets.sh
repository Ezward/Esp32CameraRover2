
#
# bundle javascript
#
echo "//////////// bundle.js //////////////" > client/bundle.js
cat client/js/command_socket.js >> client/bundle.js
cat client/js/dom_utilities.js >> client/bundle.js
cat client/js/utilities.js >> client/bundle.js
cat client/js/fetch_utilities.js >> client/bundle.js
cat client/js/gamepad.js >> client/bundle.js
cat client/js/gamepad_listener.js >> client/bundle.js
cat client/js/gamepad_view_controller.js >> client/bundle.js
cat client/js/message_bus.js >> client/bundle.js
cat client/js/motor_view_controller.js >> client/bundle.js
cat client/js/rollback_state.js >> client/bundle.js
cat client/js/rover_command.js >> client/bundle.js
cat client/js/rover_view_manager.js >> client/bundle.js
cat client/js/speed_view_controller.js >> client/bundle.js
cat client/js/streaming_socket.js >> client/bundle.js
cat client/js/tab_view_controller.js >> client/bundle.js
cat client/js/turtle_keyboard_controller.js >> client/bundle.js
cat client/js/turtle_view_controller.js >> client/bundle.js
cat client/js/view_state_tools.js >> client/bundle.js
cat client/js/main.js >> client/bundle.js

#
# bundle css
#
cat client/css/styles.css > client/bundle.css
cat client/css/tab.css >> client/bundle.css
