# 🏗️ Employee Panel Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                      WASHLEE APPLICATION                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────────────┐         ┌──────────────────────┐     │
│  │   CUSTOMER SIDE      │         │   EMPLOYEE SIDE      │     │
│  │   (Regular Users)    │         │   (Pro Workers)      │     │
│  └──────────────────────┘         └──────────────────────┘     │
│           │                                 │                   │
│           ▼                                 ▼                   │
│  ┌──────────────────────┐         ┌──────────────────────┐     │
│  │   CUSTOMER LOGIN     │         │   EMPLOYEE LOGIN     │     │
│  │  /auth/login         │         │  /auth/employee-signin
│  │                      │         │                      │     │
│  │  Email/Password      │         │  Employee ID         │     │
│  │  Google OAuth        │         │  Email/Password      │     │
│  └──────────────────────┘         └──────────────────────┘     │
│           │                                 │                   │
│           ▼                                 ▼                   │
│  ┌──────────────────────┐         ┌──────────────────────┐     │
│  │  FIREBASE AUTH       │         │  FIREBASE AUTH       │     │
│  │  + FIRESTORE         │         │  + FIRESTORE         │     │
│  │                      │         │                      │     │
│  │  userType: customer  │         │  userType: pro       │     │
│  │                      │         │  isEmployee: true    │     │
│  └──────────────────────┘         └──────────────────────┘     │
│           │                                 │                   │
│    Sets localStorage:              Sets localStorage:           │
│    employeeMode: false       employeeMode: true              │
│           │                                 │                   │
│           ▼                                 ▼                   │
│  ┌──────────────────────┐         ┌──────────────────────┐     │
│  │   HEADER SELECTION   │         │   HEADER SELECTION   │     │
│  │                      │         │                      │     │
│  │  employeeMode=false  │         │  employeeMode=true   │     │
│  │  → Use Header.tsx    │         │  → Use EmployeeHeader
│  │    (customer nav)    │         │    (employee nav)    │     │
│  └──────────────────────┘         └──────────────────────┘     │
│           │                                 │                   │
│           ▼                                 ▼                   │
│  ┌──────────────────────┐         ┌──────────────────────┐     │
│  │  CUSTOMER LAYOUT     │         │  EMPLOYEE LAYOUT     │     │
│  │  /layout.tsx         │         │  /employee/layout.tsx
│  │                      │         │                      │     │
│  │  ┌────────────────┐  │         │  ┌────────────────┐  │     │
│  │  │ Header         │  │         │  │ EmployeeHeader │  │     │
│  │  │ (Logo, Nav)    │  │         │  │ (Employee Nav) │  │     │
│  │  └────────────────┘  │         │  └────────────────┘  │     │
│  │  ┌────────────────┐  │         │  ┌────────────────┐  │     │
│  │  │ Page Content   │  │         │  │ Page Content   │  │     │
│  │  └────────────────┘  │         │  └────────────────┘  │     │
│  │  ┌────────────────┐  │         │  ┌────────────────┐  │     │
│  │  │ Footer         │  │         │  │ Footer         │  │     │
│  │  └────────────────┘  │         │  └────────────────┘  │     │
│  └──────────────────────┘         └──────────────────────┘     │
│           │                                 │                   │
│           ▼                                 ▼                   │
│  ┌──────────────────────┐         ┌──────────────────────┐     │
│  │  CUSTOMER PAGES      │         │  EMPLOYEE PAGES      │     │
│  │  (Many pages)        │         │  /employee/          │     │
│  │                      │         │                      │     │
│  │  • /                 │         │  • dashboard         │     │
│  │  • /pricing          │         │  • orders            │     │
│  │  • /how-it-works     │         │  • jobs              │     │
│  │  • /dashboard        │         │  • earnings          │     │
│  │  • etc.              │         │  • settings          │     │
│  └──────────────────────┘         └──────────────────────┘     │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │            ROLE SWITCHER (Top Right)                     │  │
│  │                                                          │  │
│  │  Employee Can Click: "Switch to Customer"               │  │
│  │  • Clears employeeMode flag                             │  │
│  │  • Redirects to /                                       │  │
│  │  • Shows customer interface                             │  │
│  │                                                          │  │
│  │  Later: Can Login Again at /auth/employee-signin        │  │
│  │  • Sets employeeMode flag                               │  │
│  │  • Redirects to /employee/dashboard                     │  │
│  │  • Shows employee interface                             │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Data Flow Diagram

```
┌────────────────────────┐
│  Employee Logs In      │
│  /auth/employee-signin │
└────────────┬───────────┘
             │
             ▼
    ┌─────────────────┐
    │ Validate with   │
    │ /api/auth/      │
    │ employee-login  │
    └────────┬────────┘
             │
             ▼
    ┌──────────────────────┐
    │ Firebase SignIn      │
    │ (Email/Password)     │
    └────────┬─────────────┘
             │
             ▼
    ┌──────────────────────┐
    │ AuthContext Updates  │
    │ • user = FirebaseUser
    │ • userData loaded    │
    │ • loading = false    │
    └────────┬─────────────┘
             │
             ▼
    ┌──────────────────────┐
    │ localStorage Update  │
    │ • employeeMode=true  │
    │ • isEmployeeUser=true│
    │ • employeeToken=...  │
    │ • employeeData=...   │
    └────────┬─────────────┘
             │
             ▼
    ┌──────────────────────┐
    │ Redirect to          │
    │ /employee/dashboard  │
    └────────┬─────────────┘
             │
             ▼
    ┌──────────────────────┐
    │ Employee Layout      │
    │ Loads                │
    │ • EmployeeHeader     │
    │ • Dashboard Content  │
    │ • Footer             │
    └────────┬─────────────┘
             │
             ▼
    ┌──────────────────────┐
    │ Employee Dashboard   │
    │ Displays:            │
    │ • Stats              │
    │ • Recent Orders      │
    │ • Quick Actions      │
    │ • Performance        │
    └──────────────────────┘
```

---

## Component Hierarchy

```
EmployeeLayout
├── EmployeeHeader
│   ├── Logo/Branding
│   ├── Desktop Navigation
│   │   ├── Dashboard (Link)
│   │   ├── Orders (Link)
│   │   ├── Jobs (Link)
│   │   ├── Earnings (Link)
│   │   └── Settings (Link)
│   ├── Role Switcher
│   │   └── "Switch to Customer" Button
│   ├── User Profile Menu
│   │   ├── User Name/Email
│   │   ├── Settings Link
│   │   └── Logout Button
│   └── Mobile Navigation
│       ├── Hamburger Menu
│       ├── Mobile Nav Links
│       ├── Mobile Role Switcher
│       └── Mobile User Menu
├── Main Content Area
│   ├── Dashboard Page
│   │   ├── Welcome Section
│   │   ├── Stats Grid
│   │   ├── Recent Orders
│   │   └── Quick Actions
│   ├── Orders Page
│   │   ├── Search & Filter Bar
│   │   ├── Orders List
│   │   └── Order Details Panel
│   ├── Jobs Page
│   │   ├── Search & Filter Bar
│   │   ├── Jobs Grid
│   │   └── Stats Summary
│   ├── Earnings Page
│   │   ├── Timeframe Toggle
│   │   ├── Stats Cards
│   │   ├── Earnings Breakdown
│   │   ├── Payout Info
│   │   └── Transaction History
│   └── Settings Page
│       ├── Tab Navigation
│       ├── Profile Tab
│       │   ├── Picture Upload
│       │   ├── Personal Info Form
│       │   └── Address Form
│       ├── Availability Tab
│       │   ├── Weekly Schedule
│       │   └── Service Radius
│       ├── Documents Tab
│       │   └── Document Status List
│       └── Notifications Tab
│           └── Notification Toggles
└── Footer
```

---

## State Management

```
┌──────────────────────────────────────────┐
│         LOCAL STORAGE (Persistent)       │
├──────────────────────────────────────────┤
│ employeeMode: "true" | "false"           │
│ isEmployeeUser: "true" | (null)          │
│ employeeToken: "firebase-token..."       │
│ employeeData: { firstName, etc. }        │
│ employeeRememberMe: "true" | (null)      │
│ employeeRememberMeExpiry: "2026-03-19"   │
└──────────────────────────────────────────┘

┌──────────────────────────────────────────┐
│      SESSION STORAGE (Session Only)      │
├──────────────────────────────────────────┤
│ employeeMode: "true" | (null)            │
│ employeeSessionOnly: "true" | (null)     │
│ authUserId: "firebase-uid"               │
│ authUserEmail: "user@example.com"        │
└──────────────────────────────────────────┘

┌──────────────────────────────────────────┐
│       REACT CONTEXT (AuthContext)        │
├──────────────────────────────────────────┤
│ user: FirebaseUser | null                │
│ userData: {                              │
│   uid, email, name, userType,            │
│   isEmployee, firstName, lastName, etc.  │
│ }                                        │
│ loading: boolean                         │
│ isAuthenticated: boolean (computed)      │
└──────────────────────────────────────────┘

┌──────────────────────────────────────────┐
│      COMPONENT LOCAL STATE (React)       │
├──────────────────────────────────────────┤
│ Each page manages:                       │
│ • Form data (settings)                   │
│ • Selected items (orders)                │
│ • Filter/search values                   │
│ • Active tabs                            │
│ • Loading states                         │
└──────────────────────────────────────────┘
```

---

## Authentication Flow Sequence

```
User at /auth/employee-signin
        │
        ▼
┌─────────────────────────┐
│ User Enters:            │
│ • Employee ID: 123456   │
│ • Email: emp@domain.com │
│ • Password: ****        │
└─────────┬───────────────┘
          │
          ▼
     [Form Submit]
          │
          ▼
┌─────────────────────────┐
│ POST /api/auth/         │
│ employee-login          │
└─────────┬───────────────┘
          │
          ▼
    [Validate]
          │
    ┌─────┴─────┐
    │           │
 Valid      Invalid
    │           │
    ▼           ▼
Success      Error
    │         Message
    │           │
    │           └─→ Show Error
    │
    ▼
┌─────────────────────────┐
│ Firebase              │
│ signInWithEmailAndPassword
└─────────┬───────────────┘
          │
          ▼
    [Auth State Update]
          │
          ▼
┌─────────────────────────┐
│ Set localStorage:       │
│ • employeeMode=true     │
│ • isEmployeeUser=true   │
│ • employeeToken=...     │
│ • employeeData=...      │
└─────────┬───────────────┘
          │
          ▼
┌─────────────────────────┐
│ Redirect to             │
│ /employee/dashboard     │
└─────────┬───────────────┘
          │
          ▼
┌─────────────────────────┐
│ Layout Loads:           │
│ • AuthContext Provides  │
│ • EmployeeHeader Mounts │
│ • Dashboard Page Loads  │
└─────────┬───────────────┘
          │
          ▼
    [Show Dashboard]
```

---

## File Organization

```
app/
├── employee/
│   ├── layout.tsx (← Employee layout wrapper)
│   ├── dashboard/
│   │   └── page.tsx (← Overview & stats)
│   ├── orders/
│   │   └── page.tsx (← All orders with details)
│   ├── jobs/
│   │   └── page.tsx (← Available jobs)
│   ├── earnings/
│   │   └── page.tsx (← Income tracking)
│   └── settings/
│       └── page.tsx (← Profile & preferences)
└── auth/
    └── employee-signin/
        └── page.tsx (← Employee login)

components/
└── EmployeeHeader.tsx (← Employee navigation)

lib/
└── AuthContext.tsx (← No changes, works as-is)
```

---

## Technology Stack

```
┌─────────────────────────────────────────┐
│       FRONTEND FRAMEWORK                │
├─────────────────────────────────────────┤
│ Next.js 16.1.3 (with Turbopack)         │
│ React 19.2.3 (Concurrent Features)      │
│ TypeScript 5 (Strict Mode)              │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│       STYLING                           │
├─────────────────────────────────────────┤
│ Tailwind CSS 3.4                        │
│ Custom color variables                  │
│ Dark theme with gradients               │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│       AUTHENTICATION                    │
├─────────────────────────────────────────┤
│ Firebase Auth (Client SDK)              │
│ Firebase Admin (Server)                 │
│ Custom employee validation API          │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│       DATABASE                          │
├─────────────────────────────────────────┤
│ Firebase Firestore                      │
│ Collections: users, orders, jobs, etc.  │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│       UI COMPONENTS                     │
├─────────────────────────────────────────┤
│ Custom Card component                   │
│ Custom Button component                 │
│ Lucide React Icons                      │
│ React Hooks (useState, useEffect, etc.) │
└─────────────────────────────────────────┘
```

---

## Security Considerations

```
┌─────────────────────────────────────────┐
│       CLIENT-SIDE PROTECTION            │
├─────────────────────────────────────────┤
│ • employeeMode flag is just UI toggle   │
│ • Real validation happens on backend    │
│ • Firebase auth required for all APIs   │
│ • localStorage can be cleared by user   │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│       SERVER-SIDE PROTECTION            │
├─────────────────────────────────────────┤
│ • Verify Firebase ID token              │
│ • Check isEmployee flag in Firestore    │
│ • Validate employee ID matches user     │
│ • Rate limit login attempts             │
│ • Log authentication events             │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│       API ENDPOINTS (Future)            │
├─────────────────────────────────────────┤
│ GET /api/employee/orders                │
│  ↳ Verify user isEmployee before return │
│                                         │
│ GET /api/employee/jobs                  │
│  ↳ Only return jobs in employee's area  │
│                                         │
│ PUT /api/employee/profile               │
│  ↳ Validate user owns profile           │
│                                         │
│ POST /api/employee/jobs/[id]/accept     │
│  ↳ Check employee availability          │
│  ↳ Prevent duplicate acceptance         │
└─────────────────────────────────────────┘
```

---

Generated: March 12, 2026  
Type: Employee Panel Architecture  
Status: ✅ COMPLETE  
