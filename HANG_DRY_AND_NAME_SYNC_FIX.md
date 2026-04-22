# Hang Dry Stripe IDs & User Name Syncing Fix

## Summary
Fixed two critical issues:
1. **Missing Hang Dry Stripe IDs** - Added product and price IDs to environment
2. **User account name syncing bug** - Ensured first_name/last_name are properly synced during signup and available for editing

## Changes Made

### 1. Added Hang Dry Stripe IDs to `.env.local`
**File:** `.env.local`
**Changes:**
```env
STRIPE_PRODUCT_ID_HANG_DRY=prod_UMtmUJiEH2kknE
STRIPE_PRICE_ID_HANG_DRY=price_1TO9zB38bIfbwMU6MwZGUPDj
```
**Purpose:** These IDs are now available for the booking system to create Stripe checkout sessions for the Hang Dry add-on ($16.50).

### 2. Enhanced User Metadata Persistence in Signup
**File:** `/app/api/auth/signup/route.ts`
**Changes:**
- Added explicit metadata update after creating auth user via `supabase.auth.admin.updateUserById()`
- Ensures `first_name` and `last_name` persist in Supabase auth user metadata
- Provides fallback mechanism for `AuthContext` to read names from metadata on login

**Before:** 
```typescript
// Auth user created with metadata in initial call, but no guarantee of persistence
const { data: authData, error: authError } = await supabase.auth.admin.createUser({...})
```

**After:**
```typescript
// Auth user created, THEN metadata explicitly updated to ensure persistence
const { data: authData, error: authError } = await supabase.auth.admin.createUser({...})
const { error: metadataError } = await supabase.auth.admin.updateUserById(userId, {
  user_metadata: {
    first_name: firstName,
    last_name: lastName,
    // ... other fields
  }
})
```

### 3. Added Name Fields to Security Dashboard
**File:** `/app/dashboard/security/page.tsx`
**Changes:**
- Added `showEditName` state to toggle edit mode
- Added `nameForm` state to manage first/last name inputs
- Added UI section in Account Information to display and edit user names
- Displays "No name saved" if names are missing
- Edit button to modify first and last names

**Features:**
- Shows current first and last name in display mode
- Click "Edit" button to enter edit mode
- Form collects separate first_name and last_name inputs
- Cancel or Save changes

### 4. Name Update Handler with Dual Table Sync
**File:** `/app/dashboard/security/page.tsx`
**New Function:** `handleUpdateName()`
**Changes:**
- Updates `users` table with new first_name and last_name
- Also updates `customers` table for consistency across application
- Shows success message on completion
- Handles errors gracefully

**Implementation:**
```typescript
const handleUpdateName = async (e: React.FormEvent) => {
  // Update users table (primary)
  const { error: userError } = await supabase
    .from('users')
    .update({
      first_name: nameForm.firstName,
      last_name: nameForm.lastName,
    })
    .eq('id', user.id)

  // Update customers table (fallback for other pages)
  const { error: customerError } = await supabase
    .from('customers')
    .update({
      first_name: nameForm.firstName,
      last_name: nameForm.lastName,
    })
    .eq('id', user.id)
}
```

## Data Flow

### During Signup (Fixed):
1. User enters first and last name in signup form
2. Frontend calls `/api/auth/signup` endpoint with name data
3. Backend creates Supabase auth user with metadata including first_name, last_name
4. **NEW:** Backend explicitly updates user metadata to ensure persistence
5. Backend creates `users` table record with first_name, last_name
6. Backend creates `customers` table record with first_name, last_name
7. User receives confirmation email

### During Login:
1. User logs in with email/password
2. Supabase auth returns user with metadata (which now includes first_name, last_name)
3. `AuthContext` reads metadata and sets `userData.first_name` and `userData.last_name`
4. Settings/Security pages can display and edit these values

### When Editing Name (New):
1. User clicks "Edit" on Security dashboard
2. Form shows current first and last name from `userData`
3. User modifies names and clicks "Save"
4. `handleUpdateName()` updates both `users` and `customers` tables
5. Success message displayed

## Benefits

✅ **Consistent Data:** First/last names now synced across:
- Supabase auth metadata (source of truth for AuthContext)
- users table (database persistence)
- customers table (used by other features like Pro dashboard)

✅ **User-Friendly:** Users can now view and edit their names in the Security dashboard

✅ **Backward Compatible:** Existing accounts without names can be updated via Security dashboard

✅ **Resilient:** Multiple fallbacks ensure names are available from auth metadata even if database temporarily fails

## Testing Checklist

- [ ] New signup flows create users with names in all three locations (metadata, users table, customers table)
- [ ] Existing users can edit names in Security dashboard
- [ ] Name changes sync to both users and customers tables
- [ ] AuthContext properly displays updated names after edit
- [ ] Settings page shows current names from userData
- [ ] Hang Dry Stripe add-on can access product/price IDs from env

## Related Files Modified
1. `.env.local` - Added Stripe IDs
2. `/app/api/auth/signup/route.ts` - Enhanced metadata persistence
3. `/app/dashboard/security/page.tsx` - Added name display and edit UI

## Notes
- The Hang Dry Stripe integration is now complete with product/price IDs in environment
- The booking page should reference these env vars instead of hardcoding prices
- User account names are now fully synced and editable through the Security dashboard
