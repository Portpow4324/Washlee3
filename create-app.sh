#!/bin/bash

# Create Washlee Dev Server Desktop App (macOS)
# This creates a clickable .app that starts the dev server

APP_NAME="Washlee Dev"
APP_DIR="/Users/lukaverde/Desktop/Washlee Dev.app"
CONTENTS_DIR="$APP_DIR/Contents"
MACOS_DIR="$CONTENTS_DIR/MacOS"
RESOURCES_DIR="$CONTENTS_DIR/Resources"
PROJECT_DIR="/Users/lukaverde/Desktop/Website.BUsiness"

# Remove existing app if it exists
rm -rf "$APP_DIR"

# Create directory structure
mkdir -p "$MACOS_DIR"
mkdir -p "$RESOURCES_DIR"

# Create the executable script
cat > "$MACOS_DIR/Washlee Dev" << 'EOF'
#!/bin/bash

# Washlee Dev Server Launcher
PROJECT_DIR="/Users/lukaverde/Desktop/Website.BUsiness"
PORT=3000

# Navigate to project
cd "$PROJECT_DIR" || exit 1

# Open Terminal with dev server
osascript << APPLESCRIPT
  tell application "Terminal"
    activate
    do script "cd '$PROJECT_DIR' && npm run dev"
  end tell
APPLESCRIPT

# Wait a moment for terminal to open
sleep 2

# Open fresh Chrome window
sleep 3
open -a "Google Chrome" --args --new-window "http://localhost:$PORT"
EOF

chmod +x "$MACOS_DIR/Washlee Dev"

# Create Info.plist
cat > "$CONTENTS_DIR/Info.plist" << 'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>CFBundleDevelopmentRegion</key>
    <string>en</string>
    <key>CFBundleExecutable</key>
    <string>Washlee Dev</string>
    <key>CFBundleIdentifier</key>
    <string>com.washlee.dev</string>
    <key>CFBundleInfoDictionaryVersion</key>
    <string>6.0</string>
    <key>CFBundleName</key>
    <string>Washlee Dev</string>
    <key>CFBundlePackageType</key>
    <string>APPL</string>
    <key>CFBundleShortVersionString</key>
    <string>1.0</string>
    <key>CFBundleVersion</key>
    <string>1</string>
    <key>LSMinimumSystemVersion</key>
    <string>10.13</string>
    <key>NSHighResolutionCapable</key>
    <true/>
    <key>NSHumanReadableCopyright</key>
    <string>Washlee © 2026</string>
    <key>LSUIElement</key>
    <true/>
</dict>
</plist>
EOF

echo "✅ Created: $APP_DIR"
echo "You can now click the 'Washlee Dev' app on your Desktop to start the dev server"
echo ""
echo "The app will:"
echo "1. Open Terminal and run 'npm run dev'"
echo "2. Wait for the server to start"
echo "3. Automatically open http://localhost:3000 in your browser"
