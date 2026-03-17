#!/bin/bash

# Pro Dashboard Navigation Debugging Script
# This script helps test the pro dashboard access issue

echo "🔍 Pro Dashboard Navigation Debug Script"
echo "========================================"
echo ""

# Check if dev server is running
echo "1️⃣ Checking if dev server is running..."
if curl -s http://localhost:3001 > /dev/null 2>&1; then
    echo "✅ Dev server IS running on localhost:3001"
else
    echo "❌ Dev server NOT running. Starting it..."
    npm run dev > /tmp/dev.log 2>&1 &
    sleep 5
    echo "✅ Dev server started (PID: $!)"
fi

echo ""
echo "2️⃣ Testing endpoint accessibility..."

# Test homepage
echo "   Testing homepage..."
STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/)
if [ $STATUS -eq 200 ] || [ $STATUS -eq 405 ]; then
    echo "   ✅ Homepage accessible (status: $STATUS)"
else
    echo "   ❌ Homepage not accessible (status: $STATUS)"
fi

# Test pro dashboard page
echo "   Testing /dashboard/pro..."
STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/dashboard/pro)
if [ $STATUS -eq 200 ] || [ $STATUS -eq 405 ]; then
    echo "   ✅ Pro dashboard page accessible (status: $STATUS)"
else
    echo "   ❌ Pro dashboard page not accessible (status: $STATUS)"
fi

echo ""
echo "3️⃣ Browser test instructions:"
echo "   1. Open http://localhost:3001 in your browser"
echo "   2. Click 'Book Now' button (goes to booking page)"
echo "   3. Log in with employee credentials:"
echo "      Email: lukaverde0476653333@gmail.com"
echo "      Password: 35Malcolmst!"
echo "   4. You should be redirected to /dashboard/customer"
echo "   5. Click user menu (top right)"
echo "   6. Click 'Pro Dashboard'"
echo "   7. You should see the pro dashboard (NOT redirected to login)"
echo ""

echo "4️⃣ What the fix does:"
echo "   - Fixed race condition in auth state checking"
echo "   - Now properly waits for auth state to load"
echo "   - Returns loading state instead of null during transition"
echo "   - Prevents premature redirects to login"
echo ""

echo "5️⃣ Checking browser console for errors:"
echo "   You should see these logs when accessing pro dashboard:"
echo "   - '[ProDashboard] useEffect triggered'"
echo "   - '[ProDashboard] Auth loading complete'"
echo "   - '[ProDashboard] User authenticated, showing dashboard'"
echo ""

echo "✅ Debug script complete!"
echo ""
echo "💡 If still redirected to login:"
echo "   1. Open browser DevTools (F12)"
echo "   2. Check Console tab for error messages"
echo "   3. Check Network tab - look for /dashboard/pro redirect"
echo "   4. Check localStorage - look for 'authUserId' key"
echo "   5. Share error messages for debugging"
