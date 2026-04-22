#!/bin/bash

# Create a simple, reliable Washlee Dev App
# This uses a more direct approach to macOS app creation

APP_NAME="Washlee Dev"
APP_DIR="/Users/lukaverde/Desktop/Washlee Dev.app"
CONTENTS_DIR="$APP_DIR/Contents"
MACOS_DIR="$CONTENTS_DIR/MacOS"
PROJECT_DIR="/Users/lukaverde/Desktop/Website.BUsiness"

# Create directory structure
mkdir -p "$MACOS_DIR"

# Create the main executable - simplified version
cat > "$MACOS_DIR/launcher" << 'LAUNCHER_EOF'
#!/bin/bash
PROJECT_DIR="/Users/lukaverde/Desktop/Website.BUsiness"
cd "$PROJECT_DIR"

# Kill any existing dev server on port 3000
lsof -ti:3000 | xargs kill -9 2>/dev/null || true
sleep 1

# Start dev server
npm run dev &
DEV_PID=$!

# Give server time to start
sleep 5

# Open Chrome in new window
open -a "Google Chrome" --args --new-window "http://localhost:3000"

# Keep running
wait $DEV_PID
LAUNCHER_EOF

chmod +x "$MACOS_DIR/launcher"

# Create Info.plist
cat > "$CONTENTS_DIR/Info.plist" << 'PLIST_EOF'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>CFBundleDevelopmentRegion</key>
    <string>en</string>
    <key>CFBundleExecutable</key>
    <string>launcher</string>
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
</dict>
</plist>
PLIST_EOF

# Make the app executable and properly formatted
chmod +x "$APP_DIR"
chmod +x "$MACOS_DIR/launcher"
xattr -d com.apple.quarantine "$APP_DIR" 2>/dev/null || true

echo "✅ App created at: $APP_DIR"
echo ""
echo "To test it, double-click 'Washlee Dev' on your Desktop"
echo "Or test from command line:"
echo "  open '$APP_DIR'"
