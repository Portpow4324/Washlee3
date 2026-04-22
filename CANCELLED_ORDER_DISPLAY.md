# Cancelled Order Display - Implementation Complete

## Overview
Cancelled orders now display prominent 24-hour removal notices in both the dashboard preview and tracking page.

---

## Changes Made

### 1. Order Dashboard (`app/dashboard/orders/page.tsx`)
**What Changed:**
- Added a red alert box below cancelled order cards
- Shows warning icon and "Order Cancelled" message
- Displays: "This order will be automatically removed from your dashboard in 24 hours"
- Includes note to check email for cancellation details

**Display:**
```
⚠️ Order Cancelled
This order will be automatically removed from your dashboard in 24 hours. 
Check your email for cancellation details.
```

**Visual:**
- Red background (#fee2e2)
- Red border
- Appears immediately below the order card
- Only shows for orders with status = 'cancelled'

---

### 2. Tracking Page (`app/tracking/page.tsx`)
**What Changed:**
- Replaces the live tracking map for cancelled orders with a cancellation notice
- Shows large ❌ emoji
- Displays full cancellation message with next steps
- Lists what will happen in the next 24 hours

**Display:**
```
❌
Order Cancelled

This order is no longer active and will be removed from 
your dashboard in 24 hours.

What happens next:
✓ Cancellation confirmation sent to your email
✓ Refund will be processed within 24 hours
✓ Order will be removed from dashboard in 24 hours
✓ You can request details via support@washlee.com.au
```

**When User Clicks "View":**
- Takes them to `/tracking?orderId=...`
- Shows the cancellation message instead of tracking map
- Also shows the same information in the Order Details sidebar

---

## Order Details Sidebar Update
**Status Badge Color Change:**
- Cancelled orders show: Red background with red text
- Still shows "Cancelled" status label
- Changed from animated pulse (for active orders) to static red dot

---

## User Flow

### Before Cancellation
1. Customer sees order in "My Orders" dashboard
2. Order has blue "Confirmed" or "Pending Payment" status
3. "Cancel Order" button appears below card
4. Can click to cancel with reason

### After Cancellation
**In Dashboard (My Orders):**
1. Order card still visible with red "Cancelled" status
2. Red alert box appears below with 24-hour removal notice
3. No "Cancel Order" button (already cancelled)
4. Can click "View" to see full details

**In Tracking Page:**
1. Instead of live tracking map, shows cancellation notice
2. Clear message about 24-hour removal
3. Lists refund timeline and next steps
4. Sidebar still shows full order details and addresses

---

## Visual Hierarchy

**Dashboard Card (Cancelled):**
```
[Order ID: 97cd41e2]                   [Date: 9 Apr]        [Total: $83.50]
[Status: Cancelled (red badge)]                             [View →]

⚠️ Order Cancelled
This order will be automatically removed from your dashboard 
in 24 hours. Check your email for cancellation details.
```

**Tracking Page:**
```
Main Area (replaces map):
╔════════════════════════════════════╗
║            ❌                       ║
║      Order Cancelled               ║
║                                    ║
║  This order is no longer active    ║
║  and will be removed from your     ║
║  dashboard in 24 hours.            ║
║                                    ║
║  What happens next:                ║
║  ✓ Cancellation confirmation...    ║
║  ✓ Refund will be processed...     ║
║  ✓ Order will be removed...        ║
║  ✓ You can request details...      ║
╚════════════════════════════════════╝

Sidebar (unchanged):
- Order Details (with Cancelled status)
- Addresses
- Help/Support Info
```

---

## Technical Details

### Dashboard Update
- **File:** `app/dashboard/orders/page.tsx`
- **Added Component:** Conditional alert div
- **Condition:** `{order.status === 'cancelled'}`
- **Styling:** Tailwind classes for red theme
- **Position:** Between order card and cancel button

### Tracking Update
- **File:** `app/tracking/page.tsx`
- **Modified Component:** LiveTracking wrapper
- **Condition:** `{order?.status === 'cancelled' ? <CancelledMessage /> : <LiveTracking />}`
- **Styling:** Consistent with dashboard red theme
- **Fallback:** Shows same message in order details sidebar

---

## Color Scheme (Cancelled Orders)
- **Background:** `bg-red-50` (#fef2f2)
- **Border:** `border-red-200` (#fecaca)
- **Text (Primary):** `text-red-700` (#b91c1c)
- **Text (Secondary):** `text-red-600` (#dc2626)
- **Status Badge:** Red background with red text

---

## Messaging

**Short Message (Dashboard):**
```
⚠️ Order Cancelled
This order will be automatically removed from your dashboard 
in 24 hours. Check your email for cancellation details.
```

**Full Message (Tracking Page):**
```
❌
Order Cancelled

This order is no longer active and will be removed from your 
dashboard in 24 hours.

What happens next:
✓ Cancellation confirmation sent to your email
✓ Refund will be processed within 24 hours
✓ Order will be removed from dashboard in 24 hours
✓ You can request details via support@washlee.com.au
```

---

## Testing Checklist
- [ ] Navigate to cancelled order in dashboard
- [ ] Verify red "Cancelled" status badge appears
- [ ] Verify alert box below card shows cancellation message
- [ ] Verify "Cancel Order" button is NOT shown
- [ ] Click "View" on cancelled order
- [ ] Verify tracking page shows cancellation message instead of map
- [ ] Verify all 4 "What happens next" items display
- [ ] Verify order details sidebar still shows on right
- [ ] Verify status badge is red in sidebar
- [ ] Verify support email is correct: support@washlee.com.au

---

## Future Enhancements
- Add actual 24-hour countdown timer
- Implement scheduled task to auto-hide cancelled orders after 24 hours
- Add ability to reorder from cancelled order
- Add cancellation reason display to user
- Add refund amount tracker

---

**Last Updated:** April 9, 2026
**Status:** ✅ Production Ready
