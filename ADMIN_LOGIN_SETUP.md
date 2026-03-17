# Admin Panel Login Setup

## Overview
The admin panel now has a **password-only authentication system** with no Firebase auth required. This provides quick access to the admin dashboard for management purposes.

## Access Credentials

### Admin Login Page
**URL:** `http://localhost:3000/admin-login`

### Admin Password
```
0Anev5Cyh54ZhfNwWM1f
```

**Security Note:** This is a 20-character alphanumeric password. Keep it confidential.

## How It Works

### Login Flow
1. Navigate to `/admin-login`
2. Enter the admin password: `0Anev5Cyh54ZhfNwWM1f`
3. Click "Access Admin Panel"
4. You'll be redirected to `/admin` dashboard

### Session Management
- Admin access is stored in `sessionStorage` (browser memory)
- The session persists while the browser tab is open
- Closing the tab or logging out will clear the session
- No database authentication required

### Logout
- Click the "Logout" button in the top-right of the admin dashboard
- This clears the session and redirects to `/admin-login`

## Features Available After Login

Once logged in, you have full access to:
- ✅ Pro Applications Management
- ✅ Employee Code Generation
- ✅ Platform Analytics
- ✅ Administrative Tools

## Implementation Details

### File Changes

**New File:** `/app/admin-login/page.tsx`
- Simple password entry form
- No email or account creation needed
- Shows access denied if password is incorrect
- Clean, professional UI with Washlee branding

**Updated:** `/app/admin/page.tsx`
- Added `handleLogout()` function
- Updated redirect from `/admin/login` to `/admin-login`
- Added logout button to admin dashboard header
- Checks for `ownerAccess` in sessionStorage

### Session Flow

```
User → /admin-login
  ↓
[Enter password: 0Anev5Cyh54ZhfNwWM1f]
  ↓
sessionStorage.setItem('ownerAccess', 'true')
sessionStorage.setItem('adminLoginTime', timestamp)
  ↓
Redirect to /admin
  ↓
Admin Dashboard loads with full access
  ↓
[Click Logout]
  ↓
sessionStorage.removeItem('ownerAccess')
sessionStorage.removeItem('adminLoginTime')
  ↓
Redirect to /admin-login
```

## Security Considerations

### Current Implementation
- Password is stored in the code (`app/admin-login/page.tsx`)
- Works great for development and small teams
- Session stored in browser memory (not persistent across page reloads for security)

### Production Recommendations
1. **Move password to environment variable:**
   ```env
   NEXT_PUBLIC_ADMIN_PASSWORD=your-secret-password
   ```

2. **Add rate limiting** on failed attempts
3. **Use HTTPS only** to prevent password interception
4. **Add IP whitelisting** (if using on private network)
5. **Add audit logging** for admin actions
6. **Consider IP-based access** for extra security

## Testing

### Test the Login
```bash
# 1. Start dev server
npm run dev

# 2. Open in browser
http://localhost:3000/admin-login

# 3. Enter password
0Anev5Cyh54ZhfNwWM1f

# 4. You should be redirected to /admin dashboard
```

### Test the Logout
```
1. Click "Logout" button in top-right
2. Should be redirected to /admin-login
3. Try accessing /admin directly (should redirect to /admin-login)
```

## Troubleshooting

### "Invalid password" message
- Check that password is entered exactly: `0Anev5Cyh54ZhfNwWM1f`
- No extra spaces or characters
- Password is case-sensitive

### Getting redirected to /admin-login when visiting /admin
- Your session may have expired
- Log out completely and log back in
- Clear browser cookies if needed

### Lost password
- The password is hardcoded in: `/app/admin-login/page.tsx` line 6
- Password: `0Anev5Cyh54ZhfNwWM1f`

## API Endpoints Accessible

After login, the following admin features are available:

| Feature | Path | Purpose |
|---------|------|---------|
| Dashboard | `/admin` | View analytics and stats |
| Pro Applications | `/admin/pro-applications` | Review service provider apps |
| Employee Codes | `/admin/employee-codes` | Generate employee codes |
| Analytics | `/api/admin/analytics` | Fetch platform stats |

## Next Steps

To make this more secure for production:
1. Move password to `.env.local`
2. Add rate limiting on failed attempts
3. Add audit logging for all admin actions
4. Consider two-factor authentication
5. Add IP whitelisting
6. Use HTTPS only

---

**Last Updated:** March 15, 2026
