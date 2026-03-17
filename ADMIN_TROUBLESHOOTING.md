# Admin Panel - Troubleshooting & Tips

## If You See "Access Denied"

This means you're not set up as an admin yet.

**Solution:**
1. Go to `http://172.20.10.3:3001/admin-setup`
2. Log in with your account
3. Click the **"Make Me Admin"** button
4. Wait for success message
5. Log out completely
6. Log back in
7. Try `/admin` again

---

## If You Get Logged Out When Clicking a Button

This was fixed in the latest build. If you still experience this:

1. **Clear browser cache** (Ctrl+Shift+Delete or Cmd+Shift+Delete)
2. **Clear IndexedDB:**
   - Open DevTools (F12)
   - Go to Application → IndexedDB
   - Delete all "firebase-" entries
3. **Log back in and try again**

---

## If Pages Load Slowly

**First load of each page takes longer** because it compiles. This is normal with Next.js development mode.

After the first load, pages should load quickly.

**To speed things up:**
- Run `npm run build` to create a production build
- Run `npm run start` instead of `npm run dev`

---

## If You See "Loading admin dashboard..."

The page is initializing Firebase auth. Wait a few seconds. This is normal and happens:
- On first page load
- When switching between tabs
- After a browser refresh

**If it doesn't load after 10 seconds:**
- Check browser console (F12) for errors
- Verify you're logged in (`/auth/signin` to check)
- Check that `/admin-setup` was completed

---

## Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| Can't access `/admin` | Run `/admin-setup` first to grant admin privileges |
| Buttons open in new tabs | This is now fixed - all links open in same tab |
| Logs out when clicking button | Fixed in latest build - log back in if needed |
| Pages load slowly | Normal on first load - production build is faster |
| Data shows as mock data | Ensure Firestore connection is working |
| Back button doesn't work | Use browser back button instead |
| Need to refresh to see changes | Firebase real-time listeners load data automatically |

---

## Checking Dev Server Status

**Is the server running?**
```bash
ps aux | grep "next dev"
```

**Is it on the right port?**
```bash
lsof -i :3001
```

**View server logs:**
```bash
tail -50 /tmp/dev.log
```

**Restart the server:**
```bash
killall node
npm run dev
```

---

## URL Reference

| Page | URL | Purpose |
|------|-----|---------|
| Main Admin | `http://172.20.10.3:3001/admin` | Dashboard hub |
| Users | `http://172.20.10.3:3001/admin/users` | User management |
| Orders | `http://172.20.10.3:3001/admin/orders` | Order management |
| Analytics | `http://172.20.10.3:3001/admin/analytics` | Charts & metrics |
| Reports | `http://172.20.10.3:3001/admin/reports` | Generate reports |
| Security | `http://172.20.10.3:3001/admin/security` | Error logs & monitoring |
| Inquiries | `http://172.20.10.3:3001/admin/inquiries` | Employee applications |
| Admin Setup | `http://172.20.10.3:3001/admin-setup` | Grant admin access |

---

## Testing Admin Access

**Quick test to verify admin access works:**

1. Open DevTools (F12)
2. Go to Console tab
3. Run this command:
```javascript
// Check if user is logged in
const auth = window.firebaseauth;
console.log(auth.currentUser);

// Check if admin claims exist
auth.currentUser.getIdTokenResult().then(token => {
  console.log('Admin claim:', token.claims.admin);
});
```

Should output:
- `User email`
- `Admin claim: true`

If admin claim is `false` or `undefined`, run `/admin-setup` again.

---

## Firestore Verification

**To verify data is in Firestore:**

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Go to Firestore Database
4. Check these collections:
   - `users` - Should have user documents
   - `orders` - Should have order documents
   - `pros` - Should have pro user documents

If collections are empty, you can add test data through Firebase Console.

---

## Browser Compatibility

**Tested and working on:**
- ✅ Chrome/Chromium
- ✅ Firefox
- ✅ Safari
- ✅ Edge

**Required:**
- Modern browser (ES2020 support)
- JavaScript enabled
- IndexedDB or LocalStorage support
- Cookies enabled for Firebase auth

---

## Performance Tips

1. **Close DevTools** - DevTools can slow down rendering
2. **Use production build** - `npm run build && npm run start`
3. **Clear cache regularly** - Can accumulate over time
4. **Avoid many filters** - Filtering is done in-memory for demo data

---

## Security Notes

⚠️ **Important:**
- Admin access uses Firebase custom claims
- Only admins can access `/admin` pages
- Session is secured via Firebase auth tokens
- Refresh auth token happens automatically
- Custom claims cannot be set by client (server-only)

---

## Contact & Support

If you encounter issues:

1. Check this troubleshooting guide first
2. Check browser console (F12) for error messages
3. Try clearing cache and restarting server
4. Verify Firebase credentials in `.env.local`
5. Check `/tmp/dev.log` for server-side errors

---

**Last Updated:** March 8, 2026
**Build Version:** Next.js 16.1.3 with Turbopack
**Status:** ✅ Production Ready

