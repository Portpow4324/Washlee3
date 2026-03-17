# 🆘 Washlee - Quick Fix Reference Guide

**Quick Help for Common Issues**  
**Last Updated:** March 12, 2026

---

## 🔴 Critical Issues

### Issue: "Port 3000 in use"
**Error:** `Port 3000 is in use by process 43296`

**Quick Fix:**
```bash
# Option 1: Kill the process
kill -9 43296

# Option 2: Use different port
PORT=3001 npm run dev

# Option 3: Find what's using port 3000
lsof -i :3000
```

---

### Issue: Dev server won't start
**Error:** Various startup errors

**Quick Fix:**
```bash
# Clear cache
rm -rf .next node_modules
npm install

# Rebuild
npm run build

# Start fresh
npm run dev
```

---

### Issue: Login redirects to wrong page
**Expected:** `/dashboard/pro` (for employees)  
**Got:** `/auth/login`

**Quick Fix:**
1. Make sure you're on **correct page:** `/auth/signin` → "Washlee Pro Sign In"
2. **NOT** `/auth/login` (that's for customers)
3. Check browser console for errors
4. Verify credentials are correct:
   - Employee ID: `EMP-1773230849589-1ZE64`
   - Email: `lukaverde0476653333@gmail.com`
   - Password: `35Malcolmst!`

---

### Issue: "useSearchParams() should be wrapped in a suspense boundary"
**File:** `/auth/signup/page.tsx`

**Status:** ✅ **ALREADY FIXED**
- The file now uses `<Suspense>` wrapper
- If error reappears, check that Suspense import exists

**Prevent:** When using `useSearchParams()`, always wrap in `<Suspense>`

---

## 🟠 Database Issues

### Issue: "Failed to load user data"
**Cause:** Firestore connection issue

**Quick Fix:**
```typescript
// Check Firebase initialization
console.log('[Firebase] Auth:', auth)
console.log('[Firebase] DB:', db)

// Verify credentials in .env.local
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyDrEoCH0fFEk7S91QzEDU1qiAIfkHnU6fA
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=washlee-7d3c6.firebaseapp.com
```

**Debug Steps:**
1. Open `/lib/firebase.ts`
2. Check that Firebase is properly initialized
3. In browser console, type: `db` (should show Firestore instance)
4. If undefined, Firebase didn't initialize

---

### Issue: "Permission denied" from Firestore
**Cause:** Security rules or authentication issue

**Quick Fix:**
```bash
# Deploy security rules
firebase deploy --only firestore:rules

# Verify current rules
firebase rules:list
```

**Check:**
1. Are you authenticated? (Check browser console)
2. Do you have permission to read/write?
3. Are collection names correct?

---

## 🟡 Frontend Issues

### Issue: Blank page after login
**Cause:** Usually AuthContext loading state

**Quick Fix:**
1. **Check console:** Press F12 → Console tab
2. **Look for errors:** Any red text?
3. **Wait 3 seconds:** AuthContext might still be loading
4. **Hard refresh:** Ctrl+Shift+R (or Cmd+Shift+R on Mac)

---

### Issue: Form won't submit
**Cause:** Validation error or missing field

**Quick Fix:**
1. Check form for error messages
2. Verify all required fields are filled
3. Check browser console for JS errors
4. Try submitting again

**Common Issues:**
- Email format: must be valid (email@example.com)
- Password: must meet requirements (8 chars, upper, lower, number, special)
- Phone: must be Australian format (0xxx xxx xxx)

---

### Issue: Mobile menu won't close
**Cause:** Usually CSS issue

**Quick Fix:**
1. Hard refresh page
2. Try closing and reopening hamburger menu
3. Check DevTools → Elements tab for CSS

---

### Issue: Page loads very slowly
**Cause:** Could be Firebase, network, or many requests

**Quick Fix:**
```bash
# Check network requests in DevTools
# Network tab → Look for slow requests

# Check console for loading messages
# Should see: [Firebase] Initialized, [Auth] State changed, etc.
```

**Optimize:**
1. Use production build: `npm run build && npm run start`
2. Check network throttling: DevTools → Network → Throttling
3. Check if images are loading: DevTools → Network tab

---

## 🔵 Authentication Issues

### Issue: "Employee ID not found"
**Cause:** Invalid employee ID or not in database

**Quick Fix:**
1. Verify Employee ID format:
   - ✅ 6-digit: `123456`
   - ✅ Standard: `EMP-1773230849589-1ZE64`
   - ✅ Payslip: `PS-20240304-X9K2L`
   - ❌ Other formats will fail

2. Verify email matches database
3. Check employee record exists in Firestore

**Sync Employees:**
```bash
# Sync all employee records
curl -X POST http://localhost:3001/api/admin/sync-employee-flags

# Should return: { success: true, updated: X }
```

---

### Issue: "Incorrect email or password"
**Cause:** Wrong credentials or user not found

**Quick Fix:**
1. Check email is correct: `lukaverde0476653333@gmail.com`
2. Check password is correct: `35Malcolmst!`
3. Verify user exists in Firebase Auth
4. Try password reset if forgotten

---

### Issue: "Too many failed attempts"
**Cause:** Too many wrong password tries

**Quick Fix:**
1. Wait 15+ minutes
2. Or use "Forgot Password" link
3. Or try different account

---

### Issue: "Session expired" or "Not authenticated"
**Cause:** Session cleared or cookies blocked

**Quick Fix:**
1. Clear browser cookies: DevTools → Application → Clear Site Data
2. Hard refresh: Ctrl+Shift+R
3. Login again
4. Check "Remember me" is available

---

## 📧 Email Issues

### Issue: "Email not received"
**Cause:** Email service issue or spam folder

**Quick Fix:**
1. Check spam/promotions folder
2. Wait 5 minutes (emails can be slow)
3. Check email address is correct
4. Try resending

**Verify Service:**
```bash
# Check email service is initialized
# Should see in console: [Email] ✅ Gmail transporter initialized

# Or send test email
curl -X POST http://localhost:3001/api/emails/send \
  -H "Content-Type: application/json" \
  -d '{"to": "test@example.com", "subject": "Test", "body": "Hello"}'
```

---

## 🔐 Security Issues

### Issue: "CORS error" or "blocked by browser"
**Cause:** Cross-origin request denied

**Quick Fix:**
1. Check API route exists: `/api/...`
2. Verify headers are correct in API response
3. Check `fetch()` URL is correct

**Example CORS Fix:**
```typescript
// In your API route
export async function POST(req: NextRequest) {
  // Add CORS headers
  const response = new NextResponse(data)
  response.headers.set('Access-Control-Allow-Origin', '*')
  return response
}
```

---

### Issue: "Cannot read localStorage in server"
**Cause:** Using browser APIs on server

**Quick Fix:**
```typescript
// WRONG - Server-side
const token = localStorage.getItem('token') // ❌ Fails on server

// RIGHT - Client-side only
'use client'  // Add this directive

const token = localStorage.getItem('token') // ✅ Works on client
```

---

## 🧪 Testing Issues

### Issue: Tests failing locally but not in CI
**Cause:** Usually environment difference

**Quick Fix:**
1. Verify `.env.local` exists and has all vars
2. Verify `node_modules` is installed: `npm install`
3. Verify Firebase is initialized
4. Check if tests use mock data or real database

---

### Issue: "Firestore Rules failed" in production
**Cause:** Security rules are too restrictive

**Quick Fix:**
```bash
# Deploy correct security rules
firebase deploy --only firestore:rules

# Verify rules
cat firestore.rules
```

---

## 📊 Logging

### Enable Debug Logging
Add to console to see more details:

```javascript
// In browser console:
localStorage.setItem('DEBUG_MODE', 'true')
location.reload()

// Should now see more logs like:
// [Auth] State changed: ...
// [Employee Login] Sending: ...
// [Firebase] Initialized: ...
```

### Disable Debug Logging
```javascript
// In browser console:
localStorage.removeItem('DEBUG_MODE')
location.reload()
```

---

## 🔧 Developer Tools Shortcuts

### Chrome/Edge/Firefox DevTools
| Shortcut | Action |
|----------|--------|
| `F12` | Open/close DevTools |
| `Ctrl+Shift+C` | Element picker |
| `Ctrl+Shift+J` | Open Console |
| `Ctrl+Shift+K` | Open Console (Firefox) |
| `Cmd+Option+I` | Open DevTools (Mac) |

### Network Debugging
1. DevTools → Network tab
2. **Check API calls:**
   - Color Green = Success (200-299)
   - Color Red = Error (400+)
   - Show response body by clicking request

---

## 📝 Common Code Patterns

### Checking if User is Authenticated
```typescript
const { user, loading } = useAuth()

if (loading) return <Spinner />
if (!user) return null // Already redirected by page

// User is authenticated
return <DashboardContent />
```

### Making API Calls
```typescript
// In client component
const response = await fetch('/api/auth/employee-login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ employeeId, email, password }),
})

const data = await response.json()
if (!response.ok) {
  console.error('Error:', data.error)
  return
}

console.log('Success:', data)
```

### Accessing Firestore Data
```typescript
import { doc, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'

const userDoc = await getDoc(doc(db, 'users', uid))
if (userDoc.exists()) {
  console.log('User data:', userDoc.data())
}
```

---

## ✅ Sanity Checks

Before calling it "done":

- [ ] **Build succeeds:** `npm run build` (no errors)
- [ ] **Dev server starts:** `npm run dev` (on port 3001)
- [ ] **Console clean:** F12 → Console (no RED errors)
- [ ] **Homepage loads:** Navigate to `http://localhost:3001`
- [ ] **Can navigate:** Click all menu links
- [ ] **Can signup:** `/auth/signup` → `/auth/signup-customer` → success
- [ ] **Can login:** `/auth/signin` → "Pro Sign In" → success
- [ ] **Dashboard works:** Shows content after login
- [ ] **Can logout:** Logout button works
- [ ] **No infinite loops:** Pages don't reload infinitely

---

## 📞 When Nothing Works

**Nuclear Option - Start Fresh:**
```bash
# Step 1: Kill all node processes
killall node

# Step 2: Clear everything
rm -rf .next node_modules

# Step 3: Reinstall
npm install

# Step 4: Build
npm run build

# Step 5: Start dev server
npm run dev
```

**If still broken:**
1. Check `.env.local` has all required variables
2. Check Firebase project is active
3. Check internet connection
4. Restart computer
5. Check GitHub issues or documentation

---

## 🎓 Learning Resources

- **Next.js Docs:** https://nextjs.org/docs
- **React Docs:** https://react.dev
- **Firebase Docs:** https://firebase.google.com/docs
- **Tailwind CSS:** https://tailwindcss.com/docs
- **TypeScript:** https://www.typescriptlang.org/docs

---

## 📋 Emergency Contact

**For critical issues:**
1. Check this guide first
2. Review error message carefully
3. Search GitHub issues
4. Check console logs
5. Contact development team with:
   - Error message (screenshot)
   - Steps to reproduce
   - Browser/OS info
   - Console logs

---

**Last Updated:** March 12, 2026  
**Status:** ✅ Ready to Use  
**Version:** 1.0
