#!/bin/bash

# Alternative: Quick Launcher using open command
# This is simpler and works on all Macs

PROJECT_DIR="/Users/lukaverde/Desktop/Website.BUsiness"

# Open Terminal and run dev server
open -a Terminal /Users/lukaverde/Desktop/Website.BUsiness/start-dev.sh

# Open fresh Chrome window after a delay
sleep 5
open -a "Google Chrome" --args --new-window "http://localhost:3000"
