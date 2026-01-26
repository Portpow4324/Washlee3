# Dashboard Testing Guide

## Quick Start Testing

### 1. Start Development Server
```bash
npm run dev
```
Open http://localhost:3000

### 2. Navigation Flow Test

#### Test Signup → Homepage Flow
1. Go to `/auth/signup`
2. Create test account:
   - Name: Test User
   - Email: test@example.com
   - Phone: (555) 123-4567
   - Password: TestPass123!
3. Verify redirects to `/auth/complete-profile`
4. Fill profile:
   - First Name: Test
   - Last Name: User
   - Personal Use: Personal
5. ✅ Should redirect to **HOMEPAGE** `/`
   - Verify: Not dashboard, but actual homepage

#### Test Login → Dashboard Flow
1. Go to `/auth/login`
2. Enter test account credentials:
   - Email: test@example.com
   - Password: TestPass123!
3. ✅ Should redirect to **DASHBOARD** `/dashboard`
   - Verify: Welcome message shows "Test User"
   - Verify: Dashboard layout visible

### 3. Dashboard Navigation Test

Click each menu item and verify page loads:

- [ ] 🏠 Dashboard → Shows home page with stats
- [ ] 📦 My Orders → Shows order list
- [ ] 📍 Addresses → Shows saved addresses
- [ ] 💳 Payments → Shows saved cards
- [ ] ⚙️ Subscriptions → Shows plan tiers
- [ ] 🔒 Security → Shows password form
- [ ] 🤝 Support → Shows help articles
- [ ] 📱 Mobile App → Shows app info

### 4. Mobile Responsiveness Test

#### Desktop (> 768px)
- [ ] Sidebar visible on left
- [ ] Menu items not in hamburger
- [ ] Logo shows "W Washlee"
- [ ] 2-3 column layouts

#### Tablet (768px - 1024px)
- [ ] Sidebar takes less space
- [ ] Hamburger menu hidden
- [ ] Content readable
- [ ] 2 column layouts

#### Mobile (< 768px)
- [ ] Sidebar hidden
- [ ] Hamburger menu visible in header
- [ ] Click hamburger opens mobile menu
- [ ] Click hamburger again closes menu
- [ ] Single column layouts
- [ ] Buttons easy to tap

### 5. Component Testing

#### Button Component
```
Test: <Button>Click me</Button>
Expected: Teal button with hover effect

Test: <Button variant="outline">Outline</Button>
Expected: Teal border button

Test: <Button variant="ghost">Ghost</Button>
Expected: No background, teal text

Test: <Button size="sm">Small</Button>
Expected: Smaller padding/text

Test: <Button size="lg">Large</Button>
Expected: Larger padding/text
```

#### Card Component
```
Test: <Card>Content</Card>
Expected: White card with shadow

Test: <Card hoverable>Hover Card</Card>
Expected: Card shadow increases on hover
```

### 6. Form Testing

#### Add Address Form
1. Click "Add Address" button
2. Fill form fields:
   - Label: "Gym"
   - Address: "789 Fitness St"
   - City: "San Francisco"
   - State: "CA"
   - Postcode: "94105"
3. Click "Add Address"
4. ✅ New address appears in list
5. ✅ Can set as default
6. ✅ Can delete address

#### Change Password Form
1. Go to Security page
2. Fill form:
   - Current: (any value)
   - New: NewPass123!
   - Confirm: NewPass123!
3. Click "Update Password"
4. ✅ Success message appears
5. ✅ Message disappears after 3 seconds

#### Contact Support Form
1. Go to Support page
2. Click "Contact Support"
3. ✅ Form modal appears
4. Fill:
   - Email: test@example.com
   - Topic: Orders & Tracking
   - Message: Test message
5. Click "Send Message"
6. ✅ Form can submit (no real endpoint needed for mock)

### 7. Interactive Elements Testing

#### Expandable Content
- [ ] FAQ article on Support page expands on click
- [ ] Chevron icon rotates 180°
- [ ] Content appears with article text
- [ ] Click again collapses
- [ ] Multiple articles can expand/collapse

#### Toggles & Switches
- [ ] 2FA toggle switches on/off
- [ ] Status updates from "Not Enabled" → "Enabled"
- [ ] Button text changes "Enable" → "Disable"

#### Dropdowns & Selects
- [ ] Topic dropdown on Support form
- [ ] All options visible
- [ ] Can select different options

#### Pagination
- [ ] Previous/Next buttons on Orders page
- [ ] Buttons appear/disappear as appropriate
- [ ] Clicking Previous/Next changes displayed items

### 8. Data Display Testing

#### Mock Data Verification
- [ ] Dashboard shows 3 stat cards with numbers
- [ ] Orders page shows 4 sample orders
- [ ] Addresses page shows 2 addresses
- [ ] Payments shows 2 cards and 4 transactions
- [ ] Subscriptions shows 3 plan tiers
- [ ] Security shows 3 sessions and 4 login attempts
- [ ] Support shows 24 articles across 7 categories

### 9. Color & Styling Testing

#### Primary Colors
- [ ] Primary teal (#1B7A7A) on:
  - Main buttons
  - Sidebar hover states
  - Link colors
  - Icons on hover

#### Accent Colors
- [ ] Light mint (#E8FFFB) on:
  - Form field backgrounds
  - Hover card backgrounds
  - Light accent sections

#### Status Colors
- [ ] Green for "Delivered" / "Paid" / "Success"
- [ ] Blue for "In Washing" / "Processing"
- [ ] Red for "Cancelled" / "Failed"
- [ ] Yellow for "Pending"

#### Text Colors
- [ ] Dark text (#1f2d2b) on light backgrounds
- [ ] Gray text (#6b7b78) for secondary info
- [ ] White text on dark backgrounds (buttons)

### 10. Icon Testing

#### Lucide React Icons
- [ ] Dashboard: Home icon
- [ ] Orders: Package icon
- [ ] Addresses: MapPin icon
- [ ] Payments: CreditCard icon
- [ ] Subscriptions: Settings icon
- [ ] Security: Lock icon
- [ ] Support: LifeBuoy icon
- [ ] Mobile: Smartphone icon
- [ ] All icons displaying correctly
- [ ] Icons have proper size
- [ ] Icons have proper color

### 11. User Experience Flow

#### Typical User Journey
1. New user visits site
2. Click "Get Started" or "Sign Up"
3. Create account with details
4. Complete profile
5. ✅ Land on homepage
6. Explore features
7. Click "Dashboard" in footer or header
8. ✅ Redirected to `/dashboard`
9. See "Welcome back [Name]"
10. Click menu items to explore
11. Add address, view orders, etc.

#### Returning User Journey
1. Visit site
2. Click "Log In"
3. Enter email/password
4. ✅ Directly to `/dashboard`
5. See existing orders
6. Can manage account

### 12. Error Handling & Edge Cases

#### Test Empty States
- [ ] Orders page with no orders shows message
- [ ] Addresses page shows "Add Address" CTA
- [ ] All forms have required fields marked

#### Test Form Validation
- [ ] Password form shows requirements
- [ ] Address form validates fields
- [ ] Contact form requires email

#### Test Accessibility
- [ ] Tab through page - hits all focusable items
- [ ] Can use keyboard to navigate
- [ ] Screen reader reads headings
- [ ] Form labels associated with inputs

### 13. Performance Testing

#### Load Times
- Dashboard page: < 2 seconds
- Navigation between pages: < 1 second
- Mobile menu toggle: < 300ms

#### Browser DevTools
- [ ] Check Console for errors (should be clean)
- [ ] Check Network tab (no failed requests)
- [ ] Check Performance (no long tasks)
- [ ] Check Lighthouse score

### 14. Cross-Browser Testing

Test on:
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Chrome Mobile
- [ ] Safari Mobile

## Test Cases Checklist

### Core Functionality
- [ ] User can signup
- [ ] User redirected to homepage after signup
- [ ] User can login
- [ ] User redirected to dashboard after login
- [ ] All navigation links work
- [ ] Logout works and clears session

### Dashboard Pages
- [ ] Dashboard home loads with stats
- [ ] Orders page displays order list
- [ ] Addresses page allows add/edit/delete
- [ ] Payments shows cards and transactions
- [ ] Subscriptions shows plans
- [ ] Security has password form
- [ ] Support shows FAQ articles
- [ ] Mobile page has download links

### Mobile Responsiveness
- [ ] Mobile menu works
- [ ] Layouts reflow correctly
- [ ] Touch targets are adequate
- [ ] No horizontal scrolling

### Visual Design
- [ ] Colors match design system
- [ ] Spacing is consistent
- [ ] Typography is readable
- [ ] Icons are clear
- [ ] Buttons have hover states

### Data & Forms
- [ ] Mock data displays
- [ ] Forms accept input
- [ ] Forms have validation
- [ ] State updates correctly
- [ ] No console errors

## Reporting Issues

When testing, if you find issues:

1. **Screenshot**: Take screenshot of issue
2. **Steps to Reproduce**: Document exact steps
3. **Expected**: What should happen
4. **Actual**: What actually happens
5. **Device/Browser**: What you're using

Example:
```
Title: Mobile menu not closing after link click
Steps:
1. View on mobile < 768px
2. Click hamburger menu (opens)
3. Click "My Orders" link
4. Menu should close but doesn't

Expected: Menu closes
Actual: Menu stays open
Browser: Chrome Mobile, iPhone 14
```

## Testing Checklist

```
SIGNUP → HOMEPAGE FLOW:
□ Signup page loads
□ All form fields work
□ Password validation shows requirements
□ Submit creates account
□ Redirect to profile completion
□ Complete profile form works
□ Submit completes profile
□ ✅ REDIRECTS TO HOMEPAGE (Key Test)

LOGIN → DASHBOARD FLOW:
□ Login page loads
□ Form fields work
□ Submit authenticates
□ ✅ REDIRECTS TO DASHBOARD (Key Test)
□ "Welcome back [Name]" shows

DASHBOARD NAVIGATION:
□ 8 menu items all clickable
□ Each page loads correctly
□ Sidebar visible on desktop
□ Mobile menu works
□ Logout button works

MOBILE RESPONSIVENESS:
□ Hamburger menu appears < 768px
□ Menu toggles open/close
□ Layouts reflow correctly
□ All pages readable on mobile

VISUAL & STYLING:
□ Colors correct (#1B7A7A primary)
□ Spacing consistent
□ Icons displaying
□ No broken layouts
□ Text readable

FUNCTIONALITY:
□ Forms work
□ Buttons clickable
□ Links navigate
□ State updates
□ No console errors

STATUS BADGES:
□ All status colors correct
□ Icons showing properly
□ Text readable
```

---

## Success Criteria

✅ All navigation links work
✅ Signup → Homepage flow working
✅ Login → Dashboard flow working
✅ Dashboard fully responsive
✅ All 8 pages accessible and functional
✅ No console errors
✅ Mobile menu working
✅ Forms functional
✅ Mock data displaying
✅ Colors matching design system

**When all criteria met: READY FOR PRODUCTION** ✅
