#!/bin/bash

# Ultra-simple launcher
# Just open Terminal and run the commands

PROJECT_DIR="/Users/lukaverde/Desktop/Website.BUsiness"

# Open Terminal
open -a Terminal

# Give Terminal a moment to open
sleep 1

# Send commands to Terminal
osascript << EOF
tell application "Terminal"
  activate
  tell application "System Events" to keystroke "cd $PROJECT_DIR && npm run dev" & return
end tell
EOF

# Wait for server to start and open browser
sleep 8
open "http://localhost:3000"
