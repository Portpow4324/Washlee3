# Work Address Verification Implementation for Pro Signup

## Summary
Implemented a conditional work address verification step for existing customers upgrading to Pro with Google Maps integration. This ensures service area verification before onboarding.

## Changes Made

### 1. State Management (Lines 42-50)
**File**: `app/auth/pro-signup-form/page.tsx`

Added two new state variables:
```typescript
const [workAddressCoordinates, setWorkAddressCoordinates] = useState<{ lat: number, lng: number } | null>(null)
const [workAddressVerified, setWorkAddressVerified] = useState(false)
```

These track:
- `workAddressCoordinates`: Google Maps lat/lng coordinates of the confirmed address
- `workAddressVerified`: Whether user explicitly confirmed the work location

### 2. Updated `selectWorkAddress` Function (Lines 168-210)
**File**: `app/auth/pro-signup-form/page.tsx`

Enhanced the address selection function to:
- Extract and store latitude/longitude coordinates from Google Places API response
- Set `workAddressCoordinates` when a valid Australian address is selected
- Continue validating that addresses are within Australia

**Key change**:
```typescript
if (addressDetails.latitude && addressDetails.longitude) {
  setWorkAddressCoordinates({
    lat: addressDetails.latitude,
    lng: addressDetails.longitude
  })
}
```

### 3. Refactored Step Validation Logic (Lines 308-355)
**File**: `app/auth/pro-signup-form/page.tsx`

**New helper function**:
```typescript
const getCurrentStepTitle = () => {
  if (currentStep >= 0 && currentStep < steps.length) {
    return steps[currentStep]?.title || ''
  }
  return ''
}
```

**Reason**: Step indices change based on user type (new user vs. existing customer). Using step titles makes the logic robust to conditional steps.

**Updated `isStepValid()` to match on step titles**:
- 'Tell us about yourself' - For new users, requires workAddress; skipped for existing customers
- 'Verify Your Email'
- 'Verify Your Phone'
- 'Verify Your Work Location' - NEW: Only shown for existing customers
- 'ID Verification'
- 'Washlee Pro Introduction'
- 'Your Availability & Contact Info'
- 'Australian Workplace Verification'
- 'Skills & Experience Assessment'

### 4. Refactored handleNext Function (Lines 496-596)
**File**: `app/auth/pro-signup-form/page.tsx`

Changed from hardcoded step indices to step title matching:
- Each `if (stepTitle === '...')` block handles its specific step
- New work address verification step validation:
  - Requires non-empty address
  - Requires valid Google Places coordinates
  - Requires explicit user confirmation checkbox

**New work address verification handling**:
```typescript
} else if (stepTitle === 'Verify Your Work Location') {
  if (!formData.workAddress.trim()) {
    setError('Please enter your work address')
    return
  }
  
  if (!workAddressCoordinates) {
    setError('Please select a valid address from the dropdown')
    return
  }
  
  if (!workAddressVerified) {
    setError('Please confirm this is your service location')
    return
  }
  
  setCurrentStep(currentStep + 1)
}
```

### 5. Conditional Work Address Verification Step (Lines 1335-1387)
**File**: `app/auth/pro-signup-form/page.tsx`

**New step - Only displayed for existing customers**:
```typescript
...(isLoggedInUser ? [{
  title: 'Verify Your Work Location',
  description: 'Confirm where you\'ll be providing services',
  content: (
    <div className="space-y-4">
      {/* Service Area Verification info box */}
      {/* Work address input with Google Places autocomplete */}
      {/* Address confirmation checkbox */}
      {/* Location confirmed indicator */}
    </div>
  ),
}] : []),
```

**Features**:
- Info box explaining service area verification requirement
- Work address input with Google Places autocomplete
- Shows predictions as user types
- Displays confirmation when address is selected and coordinates are captured
- Checkbox to confirm the location
- Helpful tip about selecting from suggestions

### 6. Hidden Work Address in Step 0 for Existing Customers (Lines 1000-1050)
**File**: `app/auth/pro-signup-form/page.tsx`

Wrapped existing work address field with conditional:
```typescript
{/* Work address field - hidden for existing customers */}
{!isLoggedInUser && (
  <div>
    {/* Work Address input field */}
  </div>
)}
```

**Reason**: Existing customers collect work address in dedicated verification step, not in Step 0

## User Flow

### New Users (Not logged in):
1. Step 0: Collect firstName, lastName, email, phone, state, **workAddress**, password, terms
2. Step 1: Verify email
3. Step 2: Verify phone
4. Step 3+: ID Verification, Washlee Pro Intro, Availability, Workplace Verification, Skills

### Existing Customers (isLoggedInUser === true):
1. Step 0: Collect phone, state, **password** (workAddress NOT collected here)
2. Step 1: Verify email
3. Step 2: Verify phone
4. **Step 3: NEW - Verify Your Work Location** (Google Maps verification)
5. Step 4+: ID Verification, Washlee Pro Intro, Availability, Workplace Verification, Skills

## Google Maps Integration

### Coordinates Capture
- Captured via `getAddressDetails()` from Google Places API
- Stored in `workAddressCoordinates` state
- Can be used for:
  - Service area validation
  - Mapping/visualization
  - Distance calculations
  - Geofencing

### Validation
- Australia-only verification (existing validation maintained)
- Coordinates must be present
- User must explicitly confirm the location

### Future Enhancements
The coordinates and address are now available for:
1. Service area boundary checking (geofencing)
2. Distance to service center calculation
3. Heat maps of pro locations
4. Service availability calculations
5. Map visualization in admin dashboard

## Testing

### Build Status
✅ Build successful with no TypeScript errors

### Test Scenarios

**Scenario 1: New User Signup**
- Should see workAddress field in Step 0
- Should NOT see "Verify Your Work Location" step
- Should advance normally through steps

**Scenario 2: Existing Customer Upgrade**
- Should NOT see workAddress field in Step 0
- Should see "Verify Your Work Location" step after phone verification
- Should require:
  - Valid address from autocomplete (not free text)
  - Confirmation checkbox
  - Both conditions to proceed

**Scenario 3: Work Address Verification**
- Google Places autocomplete should work
- Address must be in Australia
- Address coordinates must be captured
- Cannot proceed without confirmation

## Files Modified

1. `app/auth/pro-signup-form/page.tsx` - Main implementation file
   - Added state variables
   - Updated selectWorkAddress function
   - Created getCurrentStepTitle helper
   - Refactored isStepValid function
   - Refactored handleNext function
   - Added conditional work address verification step
   - Hid work address field in Step 0 for existing customers

## Related Code

### Existing Google Places Integration
- `lib/googlePlaces.ts` - getAddressDetails function
- `/api/places/autocomplete` - Backend autocomplete endpoint
- Already handles Australian address validation

### Existing State Variables (Reused)
- `formData.workAddress` - Address string
- `workAddressPredictions` - Autocomplete suggestions
- `showWorkAddressPredictions` - UI visibility toggle
- `isValidatingWorkAddress` - Loading state
- `workAddressError` - Error message display

## Environment Requirements

- Google Places API key (already configured)
- Australia-focused autocomplete (already set up)
- Supabase auth for customer profile lookup (existing)

## Backward Compatibility

✅ Fully backward compatible:
- New users see original flow with workAddress in Step 0
- Existing customers get new dedicated verification step
- No breaking changes to signup/login
- Step-based logic now handles any number of conditional steps

## Code Quality

- ✅ TypeScript type safety maintained
- ✅ No compilation errors
- ✅ Follows existing code patterns
- ✅ Conditional rendering with clear logic
- ✅ Proper error handling and validation
