# Admin Panel Password Access - Quick Start

## 🔑 Login Credentials

| Field | Value |
|-------|-------|
| URL | `http://localhost:3001/admin/login` |
| Password | `washlee2025` |
| Storage | sessionStorage (cleared on tab close) |
| Environment Var | `NEXT_PUBLIC_OWNER_PASSWORD` |

---

## ✨ Features Implemented

✅ **Password-Only Authentication**
- No Firebase login required
- Simple password field with show/hide toggle
- Error messages for wrong password

✅ **Session Management**
- Uses browser sessionStorage (secure, tab-specific)
- Cleared automatically on tab close
- No persistent cookies or local storage

✅ **Admin Pages Protected**
- `/admin/login` - Login page
- `/admin` - Dashboard with analytics
- `/admin/pro-applications` - Review Pro signups
- `/admin/employee-codes` - Generate employee IDs
- All pages redirect to login if not authenticated

✅ **Environment-Based Password**
- Password stored in `NEXT_PUBLIC_OWNER_PASSWORD`
- Easy to update in `.env.local`
- No hardcoded passwords in code

---

## 🧪 Testing Steps

### 1. Start Development Server
```bash
cd /Users/lukaverde/Desktop/Website.BUsiness
npm run dev
```
Server will run on http://localhost:3001

### 2. Access Admin Login
Open: **http://localhost:3001/admin/login**

You should see:
- Washlee logo/lock icon
- Password input field with show/hide button
- "Access Admin Portal" button

### 3. Test Wrong Password
1. Enter: `wrongpassword`
2. Click "Access Admin Portal"
3. Should see: "Invalid admin password" error
4. Password field clears

### 4. Test Correct Password
1. Enter: `washlee2025`
2. Click "Access Admin Portal"
3. Should be redirected to `/admin`
4. Page loads showing admin dashboard

### 5. Verify Admin Dashboard
At `/admin` you should see:
- Header: "Admin Dashboard"
- Subheading: "Welcome back, Owner"
- Red "Logout" button in top-right
- Analytics cards (Revenue, Orders, Users, Avg Order Value)
- Links to Pro Applications and Employee Codes

### 6. Test Other Admin Pages
- Click "Pro Applications" → loads `/admin/pro-applications`
- Click "Employee Codes" → loads `/admin/employee-codes`
- Both pages should load without auth errors

### 7. Test Logout
1. Click red "Logout" button
2. Should redirect to `/admin/login`
3. Open browser Dev Tools → Application → Session Storage
4. Verify `ownerAccess` key is removed

### 8. Test Session Persistence
1. Login with password
2. Open multiple tabs to same admin page
3. SessionStorage persists within same tab
4. Close tab and open new tab
5. New tab shows login page (session lost)

---

## 🔍 Browser DevTools Verification

### Check SessionStorage After Login

1. Open: **http://localhost:3001/admin/login**
2. Enter password: `washlee2025`
3. Submit
4. Open DevTools (F12)
5. Go to: **Application** → **Session Storage** → **http://localhost:3001**
6. You should see:
   ```
   ownerAccess: "true"
   adminLoginTime: "2025-01-18T..."
   ```

### Check SessionStorage After Logout

1. On admin page, click "Logout"
2. Open DevTools again
3. Go to: **Application** → **Session Storage** → **http://localhost:3001**
4. Both keys should be gone (session cleared)

---

## 🐛 Troubleshooting

### Issue: "Invalid admin password"
**Solution**: Ensure you entered exactly `washlee2025` (case-sensitive)

### Issue: Still seeing Firebase auth errors
**Solution**: 
- Clear browser cache and cookies
- Close dev server and restart: `npm run dev`
- Check that `.env.local` has `NEXT_PUBLIC_OWNER_PASSWORD=washlee2025`

### Issue: Logout button not working
**Solution**:
- This button is red in top-right of admin dashboard
- Click it to clear session and redirect to login

### Issue: Admin pages not loading
**Solution**:
- Ensure you've logged in first at `/admin/login`
- Check browser DevTools for `ownerAccess` in sessionStorage
- Try clearing sessionStorage and logging in again

### Issue: Can't access admin pages even with sessionStorage set
**Solution**:
1. Check the `ownerAccess` value is exactly `"true"`
2. Verify page is using sessionStorage check: `sessionStorage.getItem('ownerAccess') === 'true'`
3. Reload page if needed

---

## 📝 How It Works

### Login Flow
```
User enters password → Validates against NEXT_PUBLIC_OWNER_PASSWORD 
→ Sets sessionStorage.setItem('ownerAccess', 'true') 
→ Redirects to /admin
```

### Access Control Flow
```
Admin page loads → useEffect runs → Checks sessionStorage.getItem('ownerAccess')
→ If 'true': Show dashboard content
→ If not 'true': Redirect to /admin/login
```

### Logout Flow
```
User clicks logout → sessionStorage.removeItem('ownerAccess')
→ sessionStorage.removeItem('adminLoginTime')
→ Redirects to /admin/login
```

---

## 🔐 Security Notes

✅ **SessionStorage is secure because:**
- Cleared automatically on tab close
- Not persistent between browser sessions
- Separate for each tab/window
- Not sent to server automatically

⚠️ **Remember:**
- Password is visible on login page (but that's expected)
- For production, use stronger password
- Consider adding rate limiting for brute force protection
- Monitor admin access logs

---

## 📚 Related Files

- Login page: `app/admin/login/page.tsx`
- Admin dashboard: `app/admin/page.tsx`
- Pro applications: `app/admin/pro-applications/page.tsx`
- Employee codes: `app/admin/employee-codes/page.tsx`
- Environment config: `.env.local`

---

**Status**: ✅ Ready to test
**Last Updated**: 2025-01-18
**Password**: washlee2025
