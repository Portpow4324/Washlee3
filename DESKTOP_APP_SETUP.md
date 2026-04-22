# Washlee Desktop App Launcher

## What Was Created

You now have **THREE** ways to launch the dev server with one click:

### Option 1: Desktop App (Recommended)
**File**: `Washlee Dev.app` (on your Desktop)

- Click the app icon
- Terminal opens automatically
- Dev server starts (`npm run dev`)
- Browser opens to `http://localhost:3000`

**How it works**: macOS app bundle that executes the startup script

### Option 2: Desktop Shortcut
**File**: `Start Washlee Dev.command` (on your Desktop)

- Double-click the shortcut
- Terminal opens with dev server
- Automatically opens browser

**How it works**: Direct shell script symlink

### Option 3: Quick Start (From Project Folder)
**File**: `quick-start.sh` (in project directory)

```bash
./quick-start.sh
```

---

## Quick Setup

All files are already created! Just:

1. **Look at your Desktop** - you'll see:
   - `Washlee Dev.app` (the main app)
   - `Start Washlee Dev.command` (the shortcut)

2. **Double-click either one**

3. **Done!** 🎉
   - Terminal window opens
   - Dev server starts
   - Browser automatically opens to localhost:3000

---

## What Each Script Does

### `start-dev.sh` (Main launcher)
```bash
#!/bin/bash
1. Navigates to project directory
2. Checks if node_modules exists (installs if not)
3. Starts npm run dev
4. Waits for server to be ready (polls localhost:3000)
5. Opens http://localhost:3000 in default browser
6. Keeps running until you stop it (Ctrl+C)
```

### `create-app.sh` (Built the .app)
- Creates the macOS app bundle structure
- Creates `Info.plist` with proper app metadata
- Makes it appear as a native Mac app

### Files Created
```
/Users/lukaverde/Desktop/Washlee Dev.app/
├── Contents/
│   ├── MacOS/
│   │   └── Washlee Dev (executable)
│   ├── Resources/
│   └── Info.plist

/Users/lukaverde/Desktop/Start Washlee Dev.command (symlink)

/Users/lukaverde/Desktop/Website.BUsiness/
├── start-dev.sh (main script)
├── quick-start.sh (alternative)
└── create-app.sh (for rebuilding)
```

---

## To Stop the Dev Server

In the Terminal window that opened, press: **Ctrl + C**

Then close the Terminal window.

---

## Troubleshooting

### "App won't open"
Try right-clicking → "Open" (on first launch, macOS may require this)

### "Port 3000 already in use"
The app will automatically try the next available port (3001, 3002, etc.)

### "Browser doesn't open"
The app still started the server. Just manually go to:
- `http://localhost:3000` 
- Or check the terminal for the actual port used

### "Want to modify the app"
Edit `/Users/lukaverde/Desktop/Website.BUsiness/start-dev.sh` then run:
```bash
/Users/lukaverde/Desktop/Website.BUsiness/create-app.sh
```

---

## Future Improvements

Could add:
- Custom app icon
- Dock notification when ready
- Automatic port detection
- Stop button in app
- Environment selection (dev/staging/prod)

---

## Summary

✅ **Fully automated dev server launcher**
✅ **One-click to start development**
✅ **Automatic browser opening**
✅ **Ready to use immediately**

Just click `Washlee Dev.app` on your Desktop!
