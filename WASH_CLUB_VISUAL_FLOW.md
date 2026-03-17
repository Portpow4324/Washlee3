# 🎯 Wash Club Signup Flow - Visual Guide

## Complete User Journey

### Main Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│  HOMEPAGE (washlee.com)                                     │
│  - Hero section                                             │
│  - How it works                                             │
│  - Pricing                                                  │
│  - CTA: "Sign Up Now"                                      │
└────────────────┬────────────────────────────────────────────┘
                 │ Click "Sign Up"
                 ▼
┌─────────────────────────────────────────────────────────────┐
│  SIGNUP PAGE (/auth/signup)                                 │
│                                                             │
│  [Customer Signup Form]                                     │
│  - First Name: ___________                                 │
│  - Last Name: ___________                                  │
│  - Email: ___________                                      │
│  - Password: ___________                                   │
│  - Delivery Address: ___________  🔍 (Google Places)       │
│  - Phone: ___________                                      │
│  - Plans: ○ Plus  ○ Pro  ○ Max  ○ None                    │
│                                                             │
│  [Create Account]  [Back]                                  │
│                                                             │
│  Already have an account? [Sign In]                        │
└────────────────┬────────────────────────────────────────────┘
                 │ Click "Create Account"
                 ▼
         [Firebase Auth]
         - Validates email
         - Creates account
         - Generates user ID
         - Stores profile
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│  MODAL OVERLAY (no page navigation)                         │
│  ┌───────────────────────────────────────────────────────┐ │
│  │                                                       │ │
│  │         🎁 Join Wash Club Today!                     │ │
│  │                                                       │ │
│  │  ✓ No Account Fees                                  │ │
│  │  ✓ Instant Activation                               │ │
│  │  ✓ 100% Digital                                      │ │
│  │                                                       │ │
│  │  Earn credits on every order and redeem             │ │
│  │  for discounts!                                      │ │
│  │                                                       │ │
│  │         [Join Now]  [No Thanks]                      │ │
│  │                                                       │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
│  Background: Slightly darkened homepage                    │
└────────────────┬──────────────────────────────────────────┬─┘
                 │                                          │
        "Join Now"│                                          │"No Thanks"
                 ▼                                          ▼
    ┌──────────────────────────┐          ┌───────────────────────────┐
    │ WASH CLUB ONBOARDING     │          │ HOME PAGE or PRICING      │
    │ (/wash-club/onboarding)  │          │ - No enrollment           │
    │                          │          │ - Regular customer        │
    │ STEP 1 OF 4 ▓▓           │          │ - Can join later          │
    │                          │          └───────────────────────────┘
    │ 🎁 Wash Club Benefits     │
    │                          │
    │ Overview of tiers and    │
    │ credit earning           │
    │                          │
    │ [Continue]               │
    └──────────────┬───────────┘
                   │
                   ▼
    ┌──────────────────────────┐
    │ STEP 2 OF 4 ▓▓▓          │
    │                          │
    │ 📧 Email Verification    │
    │                          │
    │ Email: test@example.com  │
    │                          │
    │ [Send Verification Code] │
    │                          │
    │ Code: [1][2][3][4][5][6] │
    │                          │
    │ [Verify]                 │
    │                          │
    │ * Code expires in 15 min │
    └──────────────┬───────────┘
                   │
         [Dev Console]
         "Verification code for
          test@example.com: 123456"
                   │
                   ▼
    ┌──────────────────────────┐
    │ STEP 3 OF 4 ▓▓▓▓         │
    │                          │
    │ 📋 Terms & Agreements    │
    │                          │
    │ [Full Terms Text]        │
    │ [Must scroll to see end]  │
    │                          │
    │ ☐ Accept Terms of Service│
    │ ☐ Accept Privacy Policy  │
    │ ☐ Understand Credit      │
    │   Expiration Policy      │
    │                          │
    │ [Confirm]  [disabled]    │
    │ (enables after scroll    │
    │  + all boxes checked)    │
    └──────────────┬───────────┘
                   │
                   ▼
    ┌──────────────────────────┐
    │ STEP 4 OF 4 ▓▓▓▓▓        │
    │                          │
    │ ✅ Enrollment Complete   │
    │                          │
    │ Welcome to Wash Club!    │
    │                          │
    │ 🎉 Sign-up Bonus:        │
    │    +25 Credits           │
    │                          │
    │ Your Status:             │
    │ Bronze Tier              │
    │ 0/100 credits to Silver  │
    │                          │
    │ [Go to Home]             │
    └──────────────┬───────────┘
                   │
         [Firestore Updates]
         - Member created
         - 25 credits awarded
         - Transaction recorded
                   │
                   ▼
    ┌──────────────────────────┐
    │ HOME PAGE                │
    │ - User logged in         │
    │ - 25 Wash Club credits   │
    │ - Membership active      │
    │ - Can view dashboard     │
    └──────────────────────────┘
```

---

## Step-by-Step Walkthrough

### STEP 1: Signup Form

```
What User Sees:
┌─────────────────────────────────────┐
│  Customer Signup                    │
├─────────────────────────────────────┤
│                                     │
│  First Name *        [____________] │
│  Last Name *         [____________] │
│  Email *             [____________] │
│  Password *          [____________] │
│  Retype Password *   [____________] │
│                                     │
│  Delivery Address *  [____________] │
│                      (Google Places │
│                       Autocomplete) │
│                                     │
│  Phone *             [____________] │
│                                     │
│  Select a Plan:                     │
│  ○ Plus  ○ Pro  ○ Max  ○ None      │
│                                     │
│  [Create Account] [Back]            │
│                                     │
└─────────────────────────────────────┘

Actions:
1. Fill all required fields
2. Address field shows suggestions
3. Select a plan (or none)
4. Click "Create Account"
```

### STEP 2: Wash Club Modal

```
What User Sees:
┌─────────────────────────────────────┐
│                                     │
│         🎁 Join Wash Club           │
│         Start Earning Today!        │
│                                     │
│  ✓ No Account Fees                 │
│    Our membership is completely    │
│    free to join                    │
│                                     │
│  ✓ Instant Activation              │
│    Join now and start earning      │
│    credits immediately             │
│                                     │
│  ✓ 100% Digital                    │
│    Manage everything from your     │
│    account                         │
│                                     │
│  Earn 5% credits on every order    │
│  and unlock exclusive benefits!    │
│                                     │
│        [Join Now] [No Thanks]       │
│                                     │
└─────────────────────────────────────┘

Actions:
1. Read benefits
2. Click "Join Now" → Step 1 of onboarding
3. OR Click "No Thanks" → Home page
```

### STEP 3: Onboarding Step 1 - Info

```
What User Sees:
┌─────────────────────────────────────┐
│  Wash Club Onboarding               │
│  ▓▓░░░░░░░░░░░░░░░░░               │
│  Step 1 of 4: Welcome               │
├─────────────────────────────────────┤
│                                     │
│  🎁 Welcome to Wash Club!           │
│                                     │
│  Earn credits on every order:       │
│                                     │
│  Bronze:    5% credits              │
│  Silver:    8% credits + 3% off     │
│  Gold:      12% credits + 5% off    │
│  Platinum:  15% credits + 10% off   │
│                                     │
│  Unlock higher tiers by earning     │
│  more credits!                      │
│                                     │
│                                     │
│                                     │
│            [Continue]               │
│                                     │
└─────────────────────────────────────┘

Actions:
1. Read overview
2. Click "Continue"
```

### STEP 4: Onboarding Step 2 - Verification

```
What User Sees:
┌─────────────────────────────────────┐
│  Wash Club Onboarding               │
│  ▓▓▓▓░░░░░░░░░░░░░░░░               │
│  Step 2 of 4: Verify Email          │
├─────────────────────────────────────┤
│                                     │
│  📧 Email Verification              │
│                                     │
│  We'll send a 6-digit code to:      │
│  test@example.com                  │
│                                     │
│  [Send Verification Code]           │
│                                     │
│  Or enter code if you have it:      │
│                                     │
│  Code: [_] [_] [_] [_] [_] [_]     │
│                                     │
│  [Verify]                           │
│                                     │
│  ⏱ Code expires in 15 minutes       │
│  ↻ Didn't receive? Resend           │
│                                     │
└─────────────────────────────────────┘

Actions:
1. Click "Send Verification Code"
2. Check console for code (dev mode)
3. Enter 6-digit code
4. Click "Verify"
```

### STEP 5: Onboarding Step 3 - Terms

```
What User Sees:
┌─────────────────────────────────────┐
│  Wash Club Onboarding               │
│  ▓▓▓▓▓▓░░░░░░░░░░░░░░               │
│  Step 3 of 4: Terms & Agreements    │
├─────────────────────────────────────┤
│                                     │
│  Terms of Service                   │
│  ───────────────────────────────    │
│                                     │
│  [SCROLLABLE TEXT AREA]             │
│  (Full terms and conditions text)   │
│  (Must scroll to bottom to enable   │
│   checkbox and confirm button)      │
│                                     │
│  ☐ I accept Terms of Service       │
│  ☐ I accept Privacy Policy         │
│  ☐ I understand credits expire     │
│                                     │
│  [Confirm] (disabled)               │
│                                     │
└─────────────────────────────────────┘

Actions:
1. Scroll terms to bottom (required)
2. Check all 3 checkboxes
3. "Confirm" button enables
4. Click "Confirm"
```

### STEP 6: Onboarding Step 4 - Confirmation

```
What User Sees:
┌─────────────────────────────────────┐
│  Wash Club Onboarding               │
│  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓               │
│  Step 4 of 4: Confirmation          │
├─────────────────────────────────────┤
│                                     │
│           ✅                        │
│                                     │
│  Welcome to Wash Club!              │
│                                     │
│  Your membership is active!         │
│                                     │
│  🎉 Sign-up Bonus                   │
│     +25 Credits                     │
│                                     │
│  Your Current Tier:                 │
│  Bronze (5% earning rate)           │
│                                     │
│  Path to Silver:                    │
│  0 / 100 credits to next tier       │
│                                     │
│  ✓ Terms accepted                   │
│  ✓ Email verified                   │
│  ✓ Membership active                │
│                                     │
│      [Go to Home]                   │
│                                     │
└─────────────────────────────────────┘

Actions:
1. View confirmation details
2. Click "Go to Home"
3. Redirected to home page as member
```

---

## Decision Trees

### After Signup Success

```
┌──────────────────┐
│  Account Created │
└────────┬─────────┘
         │
         ▼
┌──────────────────────────────────┐
│  Show Modal?                     │
│  • showWashClubModal = true      │
│  • newUserId set                 │
└────────┬─────────────────────────┘
         │
    ┌────┴─────┐
    │           │
    ▼           ▼
 JOIN NOW    NO THANKS
    │           │
    ▼           ▼
 /wash-club/  Home or
 onboarding   Pricing
```

### During Email Verification

```
┌──────────────────┐
│  Send Code?      │
└────────┬─────────┘
         │
    ┌────┴─────────────┐
    │                  │
    ▼                  ▼
Success         Error
    │                  │
    ▼                  ▼
   Code         Show Error
 Generated      Message
    │                  │
    ▼                  ▼
 Wait for    Retry
   Input       Send
    │
    ▼
 Verify Code
    │
 ┌──┴──┬────────┐
 │     │        │
 ▼     ▼        ▼
Valid Expired Invalid
 │      │        │
 ▼      ▼        ▼
Next  Retry   Error
Step  Send    Message
```

### During Terms

```
┌──────────────────┐
│  Terms Page      │
└────────┬─────────┘
         │
    ┌────┴─────────────┐
    │                  │
    ▼                  ▼
 Scrolled         Not Scrolled
    │                  │
    ▼                  ▼
 Boxes can      Confirm Disabled
 be checked      (greyed out)
    │                  │
    ▼                  ▼
All checked?    Check boxes?
    │                  │
 ┌──┴─────┐          NO → Back to not scrolled
 │        │
YES      NO
 │        │
 ▼        ▼
Enable  Disable
Confirm Confirm
```

---

## Timeline & Performance

### Ideal User Flow Timing

```
Step          Action              Expected Time
─────────────────────────────────────────────────
1. Signup     Fill form           2-3 minutes
2. Submit     Firebase Auth       2-3 seconds
3. Modal      Show instantly      <100ms
4. Join       Click button        Instant
5. Step 1     View info           1-2 seconds load
6. Step 2     Send code           1-2 seconds
7. Step 2     Verify code         1 second
8. Step 3     Read terms          1-5 minutes
9. Step 4     View confirmation   <500ms
──────────────────────────────────────────────────
TOTAL                             ~7-10 minutes
```

---

## Mobile View Adaptation

```
Desktop (1920px)              Mobile (375px)
┌─────────────────────┐      ┌──────────────┐
│ [Modal centered]    │      │┌────────────┐│
│ ┌───────────────┐   │      ││ Join Club? ││
│ │               │   │      ││            ││
│ │ Wider layout  │   │      ││ [Join Now] ││
│ │               │   │      ││ [No Thanks]││
│ └───────────────┘   │      ││            ││
└─────────────────────┘      │└────────────┘│
                             └──────────────┘

Desktop has:              Mobile optimized for:
- Centered modal          - Full width
- Extra padding           - Touch targets (44px)
- Larger text             - Readable font sizes
- Side margins            - Bottom action buttons
```

---

## Success Indicators

### Visual Confirmation Points

```
✅ Signup → Form accepted (green checkmark on fields)
✅ Modal → Appears without page reload
✅ Step 1 → Progress bar shows 1/4
✅ Step 2 → Code sends successfully (API response)
✅ Step 2 → Code verifies (input accepts)
✅ Step 3 → Scroll bar reaches bottom
✅ Step 3 → Checkboxes enable confirm button
✅ Step 4 → Shows "+25 Credits" bonus
✅ Firestore → Document created in console
✅ Home → User sees membership info
```

---

## Error Flow

```
┌────────────────┐
│  Error State   │
└────────┬───────┘
         │
    ┌────┴──────────────────────┐
    │                           │
    ▼                           ▼
 Show Error             Disable Related
 Message in             Actions
 Red Text
    │                           │
    ▼                           ▼
Auto-dismiss     Enable Retry
after 5 sec      Button
    │                           │
    └────────────┬──────────────┘
                 │
                 ▼
          User Can Retry
```

---

**Last Updated:** March 16, 2026
**Version:** 1.0 - Ready for Production
