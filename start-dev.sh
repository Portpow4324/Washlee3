#!/bin/bash

# Washlee Dev Server Launcher
# This script starts the dev server and opens it in the browser

PROJECT_DIR="/Users/lukaverde/Desktop/Website.BUsiness"
PORT=3000

# Navigate to project directory
cd "$PROJECT_DIR" || exit 1

# Check if node_modules exists, install if not
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
fi

# Start dev server in background
echo "Starting Washlee dev server..."
npm run dev &
DEV_PID=$!

# Wait for server to be ready (max 30 seconds)
echo "Waiting for server to start..."
for i in {1..30}; do
    if curl -s http://localhost:$PORT > /dev/null 2>&1; then
        echo "✅ Server is ready!"
        sleep 1
        # Open in fresh Chrome window (not existing tab)
        open -a "Google Chrome" --args --new-window "http://localhost:$PORT"
        break
    fi
    echo "Attempting to connect... ($i/30)"
    sleep 1
done

# Keep the script running to maintain the dev server
echo "Dev server is running. Press Ctrl+C to stop."
wait $DEV_PID
