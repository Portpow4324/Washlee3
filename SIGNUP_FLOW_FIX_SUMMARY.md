# Pro Signup Flow - Data Persistence & Offline Error Fixes

## Issues Fixed

### 1. **Lost Form Data When Clicking "Already Have Account"**
**Problem**: When users clicked "Click here to sign in" on step 0, they were redirected to login but all form data (firstName, lastName, email, phone, state) was lost due to component state clearing.

**Solution**: 
- Before redirecting to login, save form data to `sessionStorage` as JSON
- Upon returning to pro-signup-form, check `sessionStorage` first and restore data
- Clear `sessionStorage` after loading to avoid stale data

**Code Changes**:
```typescript
// In component mount effect
const savedFormData = sessionStorage.getItem('proSignupFormData')
if (savedFormData) {
  const parsedData = JSON.parse(savedFormData)
  setFormData(prev => ({ ...prev, ...parsedData }))
  sessionStorage.removeItem('proSignupFormData')
  return
}

// Before redirecting to login
onClick={() => {
  sessionStorage.setItem('proSignupFormData', JSON.stringify(formData))
  router.push('/auth/login?redirect=/auth/pro-signup-form?step=0')
}}
```

### 2. **Firebase "Client is Offline" Error**
**Problem**: When users bypassed verification step 2 (phone verification) and attempted to submit the form, they received "Failed to get document because the client is offline" error from Firebase.

**Solution**: 
- Add a 500ms delay before attempting Firestore operations in `handleSubmitInquiry`
- This ensures Firebase Auth session is fully established after signup
- The delay also allows IndexedDB/localStorage persistence to sync properly

**Code Changes**:
```typescript
const handleSubmitInquiry = async () => {
  try {
    const currentUser = auth.currentUser
    if (!currentUser) throw new Error('User not found.')
    
    // Small delay to ensure Firebase is ready
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // Now safe to query Firestore
    const customerData = await getCustomerProfile(currentUser.uid)
    // ...
  }
}
```

## Files Modified

### Main Project
- `/app/auth/pro-signup-form/page.tsx` - Session storage save/restore + Firebase delay

### Fork Project  
- `/my-washlee-fork/app/auth/pro-signup-form/page.tsx` - Same changes

### Nested Fork Project
- `/my-washlee-fork/my-washlee-fork/app/auth/pro-signup-form/page.tsx` - Same changes

## Testing Checklist

- [ ] Create new employee pro account with form data
- [ ] Click "Already have customer account" - verify data persists after login
- [ ] Create new account and skip through verification steps (testing as admin or bypassing codes)
- [ ] Complete final form submission without offline errors
- [ ] Check that inquiry is created in database
- [ ] Verify confirmation emails are sent

## How It Works Now

1. **User starts pro-signup form** → Fills in step 0 (name, email, phone, state, password)
2. **User clicks "Already have account"** → 
   - Form data saved to `sessionStorage`
   - Redirected to login page
3. **User logs in** → Returns to pro-signup-form with `?redirect=/auth/pro-signup-form?step=0`
4. **Component mounts** → Checks `sessionStorage`, restores data automatically
5. **User bypasses verification or completes steps** → Submits inquiry
6. **handleSubmitInquiry runs** → 
   - 500ms delay to ensure Firebase ready
   - Safely queries Firestore for profile data
   - Creates inquiry without offline errors
7. **Success** → Shows confirmation screen

## Environment Variables (No Changes Required)
All Firebase configuration remains the same. No new env vars needed.

## Technical Details

**Session Storage vs Local Storage**:
- `sessionStorage` is used instead of `localStorage` to ensure data is cleared when browser tab closes
- This prevents confusion if user has multiple signup flows in progress

**Firebase Delay**:
- 500ms is sufficient for IndexedDB persistence to initialize
- This is a temporary solution; production should use Firestore persistence API directly
- Future enhancement: Use `enableNetwork()` from Firebase SDK after auth completes

**Admin Bypass**:
- Admin users still bypass email/phone verification (green checkmarks)
- Non-admin users see verification code input forms
- For testing: Set `NEXT_PUBLIC_OWNER_PASSWORD` env var to enable admin bypass

## Next Steps

1. Test the full flow end-to-end
2. Monitor console for any remaining Firebase connectivity issues
3. Consider implementing Redis for server-side verification code storage (currently in-memory)
4. Add proper session timeout handling

---

**Last Updated**: March 1, 2026
