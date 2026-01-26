# Dashboard Architecture & Visual Guide

## System Architecture

```
┌─────────────────────────────────────────────────────┐
│                    WASHLEE PLATFORM                 │
└─────────────────────────────────────────────────────┘
                          │
        ┌─────────────────┼─────────────────┐
        │                 │                 │
    HOMEPAGE          AUTH PAGES       DASHBOARD
   (/page.tsx)    (/auth/...)      (/dashboard/...)
        │                 │                 │
        │         ┌───────┴──────┐         │
        │         │              │         │
        │      SIGNUP        LOGIN         │
        │      /auth/        /auth/        │
        │     signup         login         │
        │         │              │         │
        │         └──────┬──────┘         │
        │                │                │
        │          COMPLETE               │
        │          PROFILE                │
        │        /auth/                   │
        │     complete-                   │
        │      profile                    │
        │         │                       │
        └─────────┼───────────────────────┘
                  │
        ┌─────────┴──────────┐
        │                    │
    NEW USERS            RETURNING USERS
  (No orders)          (Have existing data)
        │                    │
    HOMEPAGE            DASHBOARD
        │                    │
        ↓                    ↓
   [Explore]          [Dashboard Layout]
                             │
           ┌─────────────────┼─────────────────┐
           │                 │                 │
        HOME             ORDERS          ADDRESSES
        STATS             TRACK           MANAGE
           │                 │                 │
           ├─────────────────┼─────────────────┤
           │                 │                 │
        PAYMENTS        SUBSCRIPTIONS       SECURITY
        HISTORY        PLAN UPGRADE      CHANGE PWD
           │                 │                 │
           ├─────────────────┼─────────────────┤
           │                 │
        SUPPORT           MOBILE
        HELP CTR          APP INFO
```

## Dashboard Layout Structure

```
┌─────────────────────────────────────────────────────┐
│   DESKTOP SIDEBAR (hidden on mobile)                │
├─────────────────────────────────────────────────────┤
│ W Washlee                                           │
├─────────────────────────────────────────────────────┤
│ [Welcome back]                                      │
│ [User Name]                                         │
│ user@email.com                                      │
├─────────────────────────────────────────────────────┤
│ 🏠 Dashboard                                        │
│ 📦 My Orders                                        │
│ 📍 Addresses                                        │
│ 💳 Payments                                         │
│ ⚙️  Subscriptions                                    │
│ 🔒 Security                                         │
│ 🤝 Support                                          │
│ 📱 Mobile App                                       │
├─────────────────────────────────────────────────────┤
│ [Logout Button]                                     │
└─────────────────────────────────────────────────────┘
```

## Dashboard Home Page Layout

```
┌─────────────────────────────────────────────┐
│ Welcome back, [User Name]!                  │
├─────────────────────────────────────────────┤
│                                             │
│  ┌──────────────┐ ┌──────────────┐        │
│  │ Total Orders │ │ This Month   │        │
│  │      24      │ │       8      │        │
│  └──────────────┘ └──────────────┘        │
│                                             │
│  ┌──────────────┐                          │
│  │ Total Spent  │                          │
│  │    $456      │                          │
│  └──────────────┘                          │
│                                             │
├─────────────────────────────────────────────┤
│ Active Orders (1)                           │
│                                             │
│ ┌─────────────────────────────────────────┐│
│ │ #WL-2402-001                            ││
│ │ Status: In Washing    [Track] [View]   ││
│ │ Pickup: Today 2:30 PM                   ││
│ │ Delivery: Today 5:00 PM                 ││
│ │ 5 kg • Jeans, T-shirts • $36.00         ││
│ └─────────────────────────────────────────┘│
│                                             │
├─────────────────────────────────────────────┤
│ Quick Actions                               │
│                                             │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐    │
│ │ Addresses│ │ Payments │ │Subscript │    │
│ │Manage    │ │  Methods │ │ tions    │    │
│ └──────────┘ └──────────┘ └──────────┘    │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐    │
│ │  Orders  │ │ Security │ │ Support  │    │
│ │ History  │ │ Settings │ │   Help   │    │
│ └──────────┘ └──────────┘ └──────────┘    │
│                                             │
│              [+ New Order]                  │
└─────────────────────────────────────────────┘
```

## Orders Page Layout

```
┌─────────────────────────────────────────┐
│ My Orders                               │
├─────────────────────────────────────────┤
│                                         │
│ ┌─────────────────────────────────────┐│
│ │ #WL-2402-001                        ││
│ │ Jan 20, 2024  In Washing  $36.00   ││
│ │ 5 kg • Jeans, T-shirts, Socks      ││
│ │ [Track Order] [Reorder]            ││
│ └─────────────────────────────────────┘│
│                                         │
│ ┌─────────────────────────────────────┐│
│ │ #WL-2401-028                        ││
│ │ Jan 15, 2024  Delivered  $24.00    ││
│ │ 3 kg • Shirts, Pants, Underwear     ││
│ │ [Track Order] [Reorder]            ││
│ └─────────────────────────────────────┘│
│                                         │
│ [Previous] Page 1 of 3 [Next]          │
└─────────────────────────────────────────┘
```

## Addresses Page Layout

```
┌─────────────────────────────────────────┐
│ Addresses                               │
│                      [+ Add Address]    │
├─────────────────────────────────────────┤
│                                         │
│ ┌───────────────────┐ ┌───────────────┐│
│ │ 🏠 HOME           │ │ 💼 WORK       ││
│ │ [Default]         │ │               ││
│ │ 123 Main St       │ │ 456 Park Ave  ││
│ │ San Francisco, CA │ │ San Francisco ││
│ │ 94102             │ │ CA 94105      ││
│ │                   │ │               ││
│ │ [Edit] [Delete]   │ │ [Set Default] ││
│ │ (Already Default) │ │ [Edit] [Delete││
│ └───────────────────┘ └───────────────┘│
│                                         │
│ ┌─ Add Address Form ─────────────────┐ │
│ │ Label: [Gym            ]           │ │
│ │ Address: [_____________]           │ │
│ │ City: [________________]           │ │
│ │ State: [___] Postcode: [_____]     │ │
│ │ [Add Address] [Cancel]             │ │
│ └────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

## Payments Page Layout

```
┌─────────────────────────────────────────┐
│ Saved Cards                             │
│                      [+ Add Card]       │
├─────────────────────────────────────────┤
│                                         │
│ ┌──────────────────┐ ┌────────────────┐│
│ │ 💳 VISA          │ │ 💳 MASTERCARD ││
│ │ •••• 4242        │ │ •••• 5555      ││
│ │ Expires 12/25    │ │ Expires 08/26  ││
│ │                  │ │                ││
│ │ [Default Payment]│ │ [Set Default]  ││
│ │                  │ │ [Delete]       ││
│ └──────────────────┘ └────────────────┘│
│                                         │
├─────────────────────────────────────────┤
│ Transaction History                     │
│                                         │
│ Date         │ Order      │ Amount │ Sts│
│──────────────┼────────────┼────────┤───│
│ Jan 20, 2024 │ #WL-24-001 │ $36.00 │✓  │
│ Jan 15, 2024 │ #WL-24-028 │ $24.00 │✓  │
│ Jan 10, 2024 │ #WL-24-015 │ $45.00 │✓  │
│ Jan 5, 2024  │ #WL-24-002 │ $30.00 │✓  │
└─────────────────────────────────────────┘
```

## Subscriptions Page Layout

```
┌─────────────────────────────────────────┐
│ Your Subscription                       │
├─────────────────────────────────────────┤
│ PRO PLAN                    $19.99/month │
│ Best for regular customers              │
│ Next billing: February 20, 2024         │
│                                         │
│ [Pause for 30 days] [Cancel Plan]      │
├─────────────────────────────────────────┤
│ Upgrade or Downgrade                    │
│                                         │
│ ┌──────────────┐ ┌──────────────┐     │
│ │ STARTER      │ │ PRO ⭐       │     │
│ │ $9.99/month  │ │ $19.99/month │     │
│ │              │ │ (Most Popular)      │
│ │ ✓ 2 orders   │ │ ✓ Unlimited  │     │
│ │ ✓ Free ship  │ │ ✓ Free ship  │     │
│ │ ✗ All types  │ │ ✓ All types  │     │
│ │              │ │ ✓ Priority   │     │
│ │              │ │ ✓ Rewards    │     │
│ │ [Switch]     │ │ [✓ Current]  │     │
│ └──────────────┘ └──────────────┘     │
│ ┌──────────────┐                       │
│ │ PREMIUM      │                       │
│ │ $29.99/month │                       │
│ │              │                       │
│ │ ✓ Unlimited  │                       │
│ │ ✓ Free ship  │                       │
│ │ ✓ All types  │                       │
│ │ ✓ Priority   │                       │
│ │ ✓ Rewards    │                       │
│ │ ✓ Custom care│                       │
│ │ [Switch]     │                       │
│ └──────────────┘                       │
│                                         │
├─────────────────────────────────────────┤
│ Billing History                         │
│                                         │
│ Jan 20, 2024 │ Pro Plan     │ $19.99 │✓│
│ Dec 20, 2023 │ Pro Plan     │ $19.99 │✓│
│ Nov 20, 2023 │ Pro Plan     │ $19.99 │✓│
│ Oct 20, 2023 │ Pro Plan     │ $19.99 │✓│
└─────────────────────────────────────────┘
```

## Security Page Layout

```
┌─────────────────────────────────────────┐
│ 🔒 Change Password                      │
├─────────────────────────────────────────┤
│ Current Password: [••••••••]            │
│ New Password: [••••••••]                │
│ Confirm Password: [••••••••]            │
│ Min. 8 chars, uppercase, lowercase, #  │
│ [Update Password]                       │
│                                         │
├─────────────────────────────────────────┤
│ 🛡️  Two-Factor Authentication          │
│ Add extra security to your account     │
│ Status: [Not Enabled]                  │
│                                [Enable] │
│                                         │
├─────────────────────────────────────────┤
│ Active Sessions                         │
│                                         │
│ 💻 MacBook Pro              [Current]   │
│    Chrome • 2 hours ago                 │
│                                         │
│ 📱 iPhone 14                           │
│    Safari • 1 day ago                  │
│    [Logout from device]                 │
│                                         │
├─────────────────────────────────────────┤
│ Login History                           │
│                                         │
│ Today, 2:30 PM │ MacBook Pro │ Success │
│ Yesterday      │ iPhone 14   │ Success │
│ Jan 15         │ iPad Pro    │ Success │
│ Jan 14         │ Chrome      │ Failed  │
└─────────────────────────────────────────┘
```

## Support Page Layout

```
┌─────────────────────────────────────────┐
│ Support                                 │
│ [🔍 Search articles...] [💬 Contact]   │
├─────────────────────────────────────────┤
│ Browse by Category                      │
│                                         │
│ [All 24] [Orders 5] [Account 4]        │
│ [Pricing 3] [Delivery 4] [Care 5]      │
│ [Technical 3]                           │
│                                         │
├─────────────────────────────────────────┤
│ 24 Articles                             │
│                                         │
│ ▶ How do I place an order?             │
│   Can I modify my order after placing? │
│   How can I track my order?            │
│   What if my driver is late?           │
│   Can I request a specific time?       │
│   How do I reset my password?          │
│   ...                                   │
│   [Show more]                           │
│                                         │
├─────────────────────────────────────────┤
│ Can't find what you're looking for?    │
│ Our team responds within 2 hours      │
│ [Email Support] [Live Chat Coming]    │
└─────────────────────────────────────────┘
```

## Mobile App Page Layout

```
┌─────────────────────────────────────────┐
│ Washlee Mobile App                      │
│                                    📱   │
├─────────────────────────────────────────┤
│ Laundry on the Go                       │
│ Full Washlee experience in your pocket  │
│ [🍎 App Store] [🚀 Google Play]        │
│                                         │
├─────────────────────────────────────────┤
│ App Features                            │
│                                         │
│ ✓ Quick Ordering       ✓ Real-time    │
│ ✓ Push Notifications   ✓ One-Tap      │
│ ✓ Digital Receipts     ✓ Chat Support │
│                                         │
├─────────────────────────────────────────┤
│ System Requirements                     │
│                                         │
│ 🍎 iOS 13+  │ 🤖 Android 8+           │
│ iPhone 8+   │ All modern devices       │
│ 50 MB space │ 45 MB space             │
│                                         │
├─────────────────────────────────────────┤
│ App Screenshots                         │
│ [📱] [📱] [📱] [📱]                     │
│ Dashboard  Booking  Tracking  Receipts │
└─────────────────────────────────────────┘
```

## Color Scheme Used

```
Primary Teal:      #1B7A7A (Button backgrounds, links)
Accent Teal:       #7FE3D3 (Hover states)
Light Mint:        #E8FFFB (Light backgrounds)
Page Background:   #f7fefe (Very light gray-blue)
Dark Text:         #1f2d2b (Main text)
Gray Text:         #6b7b78 (Secondary text)
Border Color:      #d0d5d4 (Subtle borders)
Success Green:     #10b981 (Checkmarks, passed)
Error Red:         #ef4444 (Errors, cancelled)
Warning Yellow:    #f59e0b (Warnings, pending)
```

## Responsive Breakpoints

```
Mobile:        < 768px  (md: breakpoint)
Tablet:        768px - 1024px
Desktop:       > 1024px

Features:
- Mobile: Full-width, single column, hamburger menu
- Tablet: 2-column grid, reduced sidebar
- Desktop: Full layout, visible sidebar, 3-column grid
```

---

This visual guide helps understand the complete dashboard structure and how all pages fit together in the Washlee platform.
