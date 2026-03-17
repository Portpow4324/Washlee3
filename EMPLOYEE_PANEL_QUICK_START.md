# 🚀 Employee Panel - Quick Start Guide

## Testing the Employee Panel (Live)

### ✅ Step 1: Start the Dev Server
```bash
npm run dev
```
Server runs on `http://localhost:3000`

---

### ✅ Step 2: Employee Login

1. **Go to:** `http://localhost:3000/auth/employee-signin`
2. **Use these test credentials:**
   - **Employee ID:** `123456` (or any 6-digit number)
   - **Email:** Any valid email
   - **Password:** Any password

3. **What happens:**
   - ✅ Redirects to `/employee/dashboard`
   - ✅ Shows dark employee panel
   - ✅ EmployeeHeader displays with employee nav
   - ✅ employeeMode flag set in localStorage

---

### ✅ Step 3: Explore the Dashboard

**Dashboard Overview:**
- Click **Dashboard** - See stats, recent orders, quick actions
- Click **Orders** - View all orders with search/filter and side details panel
- Click **Available Jobs** - See job listings with acceptance toggle
- Click **Earnings** - Track income with timeframe selector
- Click **Settings** - Update profile, availability, documents

---

### ✅ Step 4: Test Role Switcher

1. **Look for:** Employee profile icon (top right)
2. **Click** to open dropdown
3. **Click** "Switch to Customer" button
4. **What happens:**
   - ✅ Redirects to `/` (customer home)
   - ✅ employeeMode flag cleared
   - ✅ Regular Header displays with customer nav

---

### ✅ Step 5: Switch Back to Employee

1. **Return to:** `http://localhost:3000/auth/employee-signin`
2. **Login again** (same credentials)
3. **What happens:**
   - ✅ Back at `/employee/dashboard`
   - ✅ Full employee panel restored
   - ✅ employeeMode flag reset

---

## 📱 Mobile Testing

The employee panel is fully responsive:
1. Open DevTools (F12)
2. Click device toggle (mobile icon)
3. Select iPhone 12/14
4. All navigation works on mobile
5. Hamburger menu appears on small screens

---

## 🔍 Inspection Checklist

### Check localStorage (DevTools → Application)
```
employeeMode: "true"  ← When logged in as employee
isEmployeeUser: "true"  ← Employee marker
```

### Check Routes
After login, check browser location:
- Employee: `/employee/dashboard` ✅
- Orders: `/employee/orders` ✅
- Jobs: `/employee/jobs` ✅
- Earnings: `/employee/earnings` ✅
- Settings: `/employee/settings` ✅

### Check Console Logs
Look for auth messages:
```
[ProDashboard] User authenticated...
[Employee Login] Successfully signed into Firebase
[Auth] State changed: authenticated as...
```

---

## 🎯 Key Features to Test

| Feature | Location | How to Test |
|---------|----------|------------|
| **Order Details** | Orders page | Click any order → right side panel |
| **Job Acceptance** | Jobs page | Click "Accept This Job" button |
| **Earnings Timeline** | Earnings page | Toggle Week/Month/All Time buttons |
| **Search** | Orders/Jobs | Type customer name in search |
| **Filters** | Orders/Jobs | Change dropdown filter |
| **Settings Tabs** | Settings page | Click Profile/Availability/etc |
| **Role Switcher** | Top right dropdown | Click "Switch to Customer" |
| **Mobile Menu** | Any page (mobile) | Click hamburger icon |

---

## 🐛 Troubleshooting

### Issue: Not redirecting to employee dashboard

**Fix:**
1. Clear localStorage (DevTools → Application → Clear All)
2. Clear cookies
3. Close browser tab completely
4. Open new tab, try login again

### Issue: Seeing customer header instead of employee header

**Likely cause:** employeeMode flag not set
1. Go to DevTools → Application → localStorage
2. Check if `employeeMode` exists
3. If not, employee login might have failed
4. Try login again at `/auth/employee-signin`

### Issue: Can't click role switcher

**Check:**
1. Are you logged in? (Should see profile icon top right)
2. Click the profile icon first (not the button directly)
3. Then click "Switch to Customer"

### Issue: Build won't compile

**Fix:**
```bash
npm run build
```
If errors appear, check:
- All imports are correct
- No syntax errors in files
- Build successfully says "✓ Compiled successfully"

---

## 📊 What You're Seeing

### Employee Dashboard
- Dark gradient background (professional theme)
- Employee-specific navigation (Dashboard, Orders, Jobs, Earnings, Settings)
- Stats cards showing real-time metrics
- Recent orders with one-click details
- Quick action buttons

### Orders Page
- Search by customer name or order ID
- Filter by status (All, Pending, In Progress, Completed)
- Click any order to see complete details panel:
  - Customer name, email, phone (clickable)
  - Pickup and delivery addresses
  - Services applied
  - Weight and earnings
  - Customer notes
  - Rating/review if completed

### Jobs Page
- Grid of available jobs
- Rush order badges (red)
- Each job shows:
  - Customer name
  - Weight, location, distance
  - Services required
  - Earning amount
  - "Accept This Job" toggle button
- Stats at bottom update when you accept jobs

### Earnings Page
- Toggle between Week/Month/All Time
- Stats update based on selection
- Earnings breakdown visual
- Transaction history with status
- Payout method display

### Settings Page
- Profile tab: edit name, phone, address
- Availability: set work hours and service radius
- Documents: verification status and uploads
- Notifications: toggle notifications on/off

---

## ✅ Success Indicators

You'll know it's working correctly when:

✅ Employee login redirects to `/employee/dashboard`
✅ Dark gradient background appears
✅ EmployeeHeader shows with correct nav items
✅ Profile icon shows in top right
✅ Role switcher button says "Switch to Customer"
✅ Click role switcher → redirects to `/`
✅ Customer nav appears on home page
✅ All 5 employee pages accessible
✅ Search/filter work on orders and jobs
✅ Clicking orders shows side panel with details
✅ Accepting jobs updates stats
✅ Changing timeframe on earnings updates numbers
✅ Settings form loads with default values

---

## 🔐 Security Notes

- Employee credentials currently use mock validation
- Real implementation should use API with:
  - Employee ID verification
  - Email domain validation
  - Password strength requirements
  - 2FA optional for employees
- employeeMode flag is localStorage (client-side)
- Real implementation should use JWT tokens with server validation

---

## 📞 Common Questions

**Q: Why separate employee panel?**
A: Employees need different tools than customers. They manage jobs, track earnings, and see orders differently.

**Q: Can employees browse customer pages?**
A: Yes! Click "Switch to Customer" anytime. It's seamless switching.

**Q: What's the employeeMode flag for?**
A: It tells the app "show employee interface" instead of customer interface.

**Q: Can customers access employee panel?**
A: No. It requires employee-signin login. Regular customer login won't let them access `/employee/*` routes.

**Q: What about admin panel?**
A: Admin panel (`/admin`) is separate and unchanged. Different from employee panel.

---

## 🎓 For Developers

### Component Structure
```
/app/employee/
  ├── layout.tsx (uses EmployeeHeader)
  ├── dashboard/page.tsx
  ├── orders/page.tsx
  ├── jobs/page.tsx
  ├── earnings/page.tsx
  └── settings/page.tsx

/components/
  └── EmployeeHeader.tsx (new)
```

### Key Files
- `EmployeeHeader.tsx` - Navigation with role switcher
- `AuthContext.tsx` - No changes needed, auth works as-is
- `auth/employee-signin/page.tsx` - Updated to set employeeMode

### How It Works
1. User logs in → firebase auth creates session
2. employeeMode flag set → tells app to use employee layout
3. EmployeeHeader renders → shows employee nav
4. Employee pages load → all employee-specific content

---

Generated: March 12, 2026  
Version: 1.0 - Complete Employee Panel  
Status: ✅ Ready for Testing
