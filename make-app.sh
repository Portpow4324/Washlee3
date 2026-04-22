#!/bin/bash

# Create Washlee Dev App (Ultra-Simple Version)

APP_DIR="/Users/lukaverde/Desktop/Washlee Dev.app"
CONTENTS_DIR="$APP_DIR/Contents"
MACOS_DIR="$CONTENTS_DIR/MacOS"

# Create structure
mkdir -p "$MACOS_DIR"

# Copy the simple launcher
cp /Users/lukaverde/Desktop/Website.BUsiness/simple-launcher.sh "$MACOS_DIR/launcher"
chmod +x "$MACOS_DIR/launcher"

# Create Info.plist
cat > "$CONTENTS_DIR/Info.plist" << 'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>CFBundleExecutable</key>
    <string>launcher</string>
    <key>CFBundleIdentifier</key>
    <string>com.washlee.dev</string>
    <key>CFBundleName</key>
    <string>Washlee Dev</string>
    <key>CFBundlePackageType</key>
    <string>APPL</string>
    <key>CFBundleShortVersionString</key>
    <string>1.0</string>
</dict>
</plist>
EOF

echo "✅ App created!"
echo ""
echo "You can now:"
echo "1. Double-click 'Washlee Dev' on your Desktop, OR"
echo "2. Run: open '/Users/lukaverde/Desktop/Washlee Dev.app'"
echo ""
echo "The app will:"
echo "  • Open a Terminal window"
echo "  • Run 'npm run dev' automatically"
echo "  • Open http://localhost:3000 in Chrome"
