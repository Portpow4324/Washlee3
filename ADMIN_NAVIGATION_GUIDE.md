# Admin Panel Navigation Guide

## Main Dashboard
**URL:** `http://172.20.10.3:3001/admin`

### Layout:
```
┌─────────────────────────────────────────────────────────────┐
│                     ADMIN DASHBOARD                         │
│                   Welcome back, Admin                        │
├─────────────────────────────────────────────────────────────┤
│  ⚠️  ADMIN ACCESS GRANTED - You have full platform access   │
├─────────────────────────────────────────────────────────────┤
│                      QUICK STATS                            │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐        │
│  │   Revenue    │ │    Orders    │ │ Active Users │        │
│  │   $XX,XXX    │ │     XXX      │ │     XXX      │        │
│  └──────────────┘ └──────────────┘ └──────────────┘        │
├─────────────────────────────────────────────────────────────┤
│                   ADMIN SECTIONS                            │
│                                                             │
│  ┌─────────────────────┐   ┌─────────────────────┐         │
│  │  👥 USER MGMT       │   │  📦 ORDER MGMT      │         │
│  │ ─────────────────   │   │ ─────────────────   │         │
│  │ • View All Users    │   │ • View All Orders   │         │
│  │ • Pro Applications  │   │ • Disputed Orders   │         │
│  └─────────────────────┘   └─────────────────────┘         │
│                                                             │
│  ┌─────────────────────┐   ┌─────────────────────┐         │
│  │  📊 ANALYTICS       │   │  🛡️ SECURITY        │         │
│  │ ─────────────────   │   │ ─────────────────   │         │
│  │ • View Analytics    │   │ • Security Logs     │         │
│  │ • View Reports      │   │ • Employee Inquiries│         │
│  └─────────────────────┘   └─────────────────────┘         │
│                                                             │
│  KEY METRICS:                                               │
│  • New Signups: XXX                                        │
│  • Pending Applications: XX                                │
│  • Refund Rate: X.X%                                       │
└─────────────────────────────────────────────────────────────┘
```

---

## Sub-Pages

### 1. User Management
**URL:** `http://172.20.10.3:3001/admin/users`

Features:
- Search users by email/name
- Filter by type (Customer/Pro)
- Filter by status (Active/Inactive/Suspended)
- Sort by date, name, or orders
- Bulk actions available
- Back button returns to dashboard

---

### 2. Order Management
**URL:** `http://172.20.10.3:3001/admin/orders`

Features:
- View all orders with full details
- Filter by status (Pending/Accepted/Collecting/Washing/Delivering/Completed/Cancelled)
- Filter by payment status (Pending/Completed/Failed)
- Search by order ID or customer name
- Sort by date, total amount, or status
- View disputed orders
- Back button returns to dashboard

---

### 3. Analytics Dashboard
**URL:** `http://172.20.10.3:3001/admin/analytics`

Features:
- Revenue charts (7/30/90 day views)
- Order status breakdown (pie chart)
- Key metrics cards
- Top performing pros
- Growth trends
- Date range selector
- Real Firestore data
- Back button returns to dashboard

---

### 4. Reports & Analytics
**URL:** `http://172.20.10.3:3001/admin/reports`

Features:
- **Revenue Reports**
  - Monthly Revenue Report
  - Quarterly Trends Analysis
  
- **Order Reports**
  - Order Status Report
  - Fulfillment Times Analysis
  
- **User Reports**
  - User Growth Report
  - User Segmentation Analysis
  
- **Performance Reports**
  - System Health Report
  - API Performance Report

Each report can be generated and downloaded.

---

### 5. Security & Monitoring
**URL:** `http://172.20.10.3:3001/admin/security`

Features:
- Error tracking
- System health monitoring
- Security incident logs
- Error patterns analysis

---

### 6. Employee Inquiries
**URL:** `http://172.20.10.3:3001/admin/inquiries`

Features:
- View new employee applications
- Approve or reject inquiries
- Manage pro user onboarding

---

## Navigation Flow

```
USER CLICKS BUTTON ON MAIN DASHBOARD
              ↓
        PAGE LOADS IN SAME TAB
              ↓
    USER VIEWS DATA & USES FILTERS
              ↓
      USER CLICKS "BACK TO DASHBOARD"
              ↓
    RETURNS TO MAIN ADMIN DASHBOARD
```

### Key Points:
- ✅ All pages load in **same tab** (no new tabs)
- ✅ Auth session stays **intact** while navigating
- ✅ **Back button** available on every sub-page
- ✅ Data **persists** across navigation
- ✅ **Responsive design** works on all devices

---

## Quick Access Links

| Section | URL | Status |
|---------|-----|--------|
| Main Dashboard | `/admin` | ✅ Active |
| Users | `/admin/users` | ✅ Active |
| Orders | `/admin/orders` | ✅ Active |
| Analytics | `/admin/analytics` | ✅ Active |
| Reports | `/admin/reports` | ✅ Active |
| Security | `/admin/security` | ✅ Active |
| Inquiries | `/admin/inquiries` | ✅ Active |

---

## Authentication

**Current URL:** `http://172.20.10.3:3001`

To gain admin access:
1. Visit `/admin-setup`
2. Log in
3. Click "Make Me Admin"
4. Log out and log back in
5. Access `/admin` with full permissions

---

## Testing Checklist

- [ ] Visit `/admin` - see main dashboard
- [ ] Click "View All Users" - navigates to `/admin/users` in same tab
- [ ] Click "Back to Dashboard" - returns to `/admin`
- [ ] Click "View All Orders" - navigates to `/admin/orders` in same tab
- [ ] Use search/filter on orders page
- [ ] Click back button - returns to dashboard
- [ ] Try Analytics page - loads charts
- [ ] Try Reports page - shows report generation options
- [ ] All navigation works without logging out

---

## Server Status

**Running on:** `http://172.20.10.3:3001`
**Build Status:** ✅ Successful
**All Pages:** ✅ Compiled and Working

