
#
# bundle javascript
#
cat assets/js/dom_utilities.js > assets/bundle.js
cat assets/js/utilities.js >> assets/bundle.js
cat assets/js/fetch_utilities.js >> assets/bundle.js
cat assets/js/gamepad.js >> assets/bundle.js
# cat assets/js/gamepad_listener.js >> assets/bundle.js
cat assets/js/gamepad_view_controller.js >> assets/bundle.js
cat assets/js/message_bus.js >> assets/bundle.js
cat assets/js/rollback_state.js >> assets/bundle.js
cat assets/js/rover_view_manager.js >> assets/bundle.js
cat assets/js/streaming_socket.js >> assets/bundle.js
cat assets/js/tab_view_controller.js >> assets/bundle.js
cat assets/js/turtle_command.js >> assets/bundle.js
cat assets/js/turtle_keyboard_controller.js >> assets/bundle.js
cat assets/js/turtle_view_controller.js >> assets/bundle.js
cat assets/js/main.js >> assets/bundle.js

#
# bundle css
#
cat assets/css/styles.css > assets/bundle.css
cat assets/css/tab.css >> assets/bundle.css
