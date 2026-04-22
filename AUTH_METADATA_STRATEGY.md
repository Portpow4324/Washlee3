# Auth Metadata Strategy - Complete Guide

## How It Works

All user information is now stored in **Supabase Auth user_metadata** during signup. This is the industry-standard approach used by Firebase, Auth0, and Clerk.

### What Gets Stored in Metadata

When a user signs up, the following is stored in `auth.users.raw_user_meta_data`:

```json
{
  "name": "Luke Verde",
  "first_name": "Luke",
  "last_name": "Verde",
  "email": "lukaverde6@gmail.com",
  "phone": "+1-555-1234",
  "state": "NSW",
  "personal_use": false,
  "user_type": "customer",
  "is_admin": false,
  "is_employee": false,
  "created_at": "2026-03-29T10:00:00Z",
  "phone_verified": false
}
```

## Benefits

✅ **Fast** - No database queries needed, instant access  
✅ **Reliable** - Always available, even if database is down  
✅ **Scalable** - No RLS policy issues  
✅ **Offline-friendly** - Works without network  
✅ **Profile page ready** - All data immediately available  
✅ **Industry standard** - Used by Firebase, Auth0, Clerk  

## Data Flow

### On Signup
```
User fills form (name, email, phone, etc.)
  ↓
POST /api/auth/signup
  ↓
Parse first_name and last_name
  ↓
Create auth user with metadata (includes all fields)
  ↓
Create database records (customers/employees tables)
  ↓
User registered with complete metadata
```

### On Login
```
User enters email/password
  ↓
Supabase returns auth session with user_metadata
  ↓
AuthContext.tsx reads metadata
  ↓
All user data instantly available
  ↓
Header displays: "First Last" (from metadata)
  ↓
No database queries needed
```

## Implementation Details

### Signup Route (`app/api/auth/signup/route.ts`)
- Stores all user details in `user_metadata` during `createUser()`
- Fields stored: name, first_name, last_name, email, phone, state, user_type, etc.
- Also creates database records for additional features (optional)

### Auth Context (`lib/AuthContext.tsx`)
- Reads `session.user.user_metadata` 
- Extracts first_name, last_name, phone, user_type, etc.
- Computes display name: `${first_name} ${last_name}`
- Falls back to email prefix if names are missing
- No database queries - pure metadata access

### Header Component (`components/Header.tsx`)
- Displays `userData?.first_name` and `userData?.last_name`
- Shows full name instead of email prefix
- Updates automatically when user logs in

## What Happens for Each New Account

### Customer Signs Up
1. Fills form: "Luke Verde", "lukaverde6@gmail.com", "+1-555-1234", "NSW"
2. Signup endpoint creates auth user with all metadata
3. On login, Header shows: **"Luke Verde"** ✓
4. Phone available for dashboard
5. State available for location services

### Pro Signs Up
1. Fills form: "Jane Smith", "jane@pro.com", "+1-555-5678"
2. Signup creates auth user with `user_type: "pro"`
3. On login, Dashboard recognizes pro account
4. Header shows: **"Jane Smith"** ✓
5. Pro-specific features available

## Existing Users (Like lukaverde6)

For existing accounts created before this was implemented:

```sql
-- Update auth metadata for existing user
UPDATE auth.users
SET raw_user_meta_data = jsonb_set(
  COALESCE(raw_user_meta_data, '{}'::jsonb),
  '{first_name}',
  '"Luke"'
) || jsonb_set(
  raw_user_meta_data,
  '{last_name}',
  '"Verde"'
)
WHERE email = 'lukaverde6@gmail.com';
```

Then:
1. Log out completely
2. Clear browser cache
3. Log back in
4. See "Luke Verde" in header

## Troubleshooting

### User sees "username" instead of "Luke Verde"
- Check: Is metadata being set during signup?
- Check: Did user log out and back in?
- Check: Is browser cache cleared?

### New signup shows "email-prefix" in header
- Check: Signup endpoint is using new metadata code
- Check: `first_name` and `last_name` are in metadata
- Fix: Rebuild project (`npm run build`)

### Missing phone/state in dashboard
- Check: Metadata includes these fields
- Check: Dashboard is reading from `userData.phone` etc
- Check: AuthContext extracts all fields

## Future Enhancements

This metadata-first approach allows for:
- ✅ Offline user profiles
- ✅ Cached user data on client
- ✅ Faster page loads
- ✅ Less database load
- ✅ Easy profile syncing
- ✅ Quick feature flags (e.g., `is_admin`, `is_employee`)

## Metadata Fields Reference

| Field | Type | Source | Purpose |
|-------|------|--------|---------|
| `first_name` | string | signup form | Display name |
| `last_name` | string | signup form | Display name |
| `name` | string | combined | Full name |
| `email` | string | signup form | Contact |
| `phone` | string | signup form | Contact |
| `user_type` | string | signup form | "customer" or "pro" |
| `state` | string | signup form | Location |
| `personal_use` | boolean | signup form | Service type |
| `is_admin` | boolean | admin tool | Admin flag |
| `is_employee` | boolean | admin tool | Employee flag |
| `created_at` | ISO string | system | Account creation time |
| `phone_verified` | boolean | system | Phone verification status |

## Testing New Accounts

1. Create a test account with name "Test User"
2. Check metadata in Supabase Auth section
3. Verify header shows "Test User" on login
4. All profile data available immediately
5. No database queries logged in console
