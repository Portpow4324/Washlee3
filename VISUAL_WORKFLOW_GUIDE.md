# Pro Dashboard Feature - Complete Visual Workflow

## 🔄 Complete User Journey

### CUSTOMER JOURNEY
```
┌─────────────────────────────────────────────────────────────┐
│ 1. CUSTOMER PLACES ORDER                                     │
│    - Website → Book Order → Select preferences               │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. ORDER CREATED IN SYSTEM                                   │
│    - Status: "pending"                                       │
│    - Waiting for pro to accept                               │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. CUSTOMER WAITS FOR PRO                                    │
│    - Tracking page shows: "Looking for nearby Pro..."        │
│    - No pro details yet                                      │
└─────────────────────────────────────────────────────────────┘
                          ↓
                    [PRO ACCEPTS JOB] ← See below
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 4. CUSTOMER GETS PRO DETAILS! 🎉                            │
│    - Email notification with:                                │
│      ✓ Pro's name                                            │
│      ✓ Pro's phone number                                    │
│      ✓ Pro's email address                                   │
│      ✓ Order confirmation                                    │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 5. CUSTOMER CAN CONTACT PRO                                  │
│    - Call/text pro's phone                                   │
│    - Email pro directly                                      │
│    - View pro on tracking page                               │
└─────────────────────────────────────────────────────────────┘
```

---

### PRO/EMPLOYEE JOURNEY
```
┌─────────────────────────────────────────────────────────────┐
│ 1. PRO OPENS EMPLOYEE DASHBOARD                              │
│    - URL: /employee/jobs                                     │
│    - Sees list of available orders/jobs                      │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. PRO SEES JOB CARDS                                        │
│    - Order ID (first 8 chars)                                │
│    - Estimated pay ($)                                       │
│    - Weight (kg)                                             │
│    - Service type & delivery speed                           │
│    - TWO BUTTONS:                                            │
│      🔍 "View Details" ← [NEW]                              │
│      ✅ "Accept Job"                                        │
└─────────────────────────────────────────────────────────────┘
                          ↓
              ┌───────────┴───────────┐
              ↓                       ↓
        [View Details]          [Accept Job]
              ↓                       ↓
              ↓                   ┌────────────────────┐
              ↓                   │ 6. JOB ACCEPTED ✅  │
              ↓                   │ - Button turns green│
              ↓                   │ - Pro ID set       │
              ↓                   │ - Customer emailed │
              ↓                   └────────────────────┘
              ↓                           ↓
        [3. Full Order              [Continue...]
         Details Page]
              ↓
    ┌─────────────────────────────────────┐
    │ FULL ORDER DETAILS PAGE [NEW]      │
    ├─────────────────────────────────────┤
    │                                     │
    │  📧 CUSTOMER INFO                  │
    │  ├─ Name: John Doe                │
    │  ├─ Phone: +61 2 1234 5678        │
    │  └─ Email: john@example.com       │
    │                                     │
    │  📍 PICKUP LOCATION                │
    │  └─ 123 Main St, Sydney NSW 2000  │
    │     📅 Wed, 19 Apr 2026           │
    │                                     │
    │  🚗 DELIVERY LOCATION              │
    │  └─ 456 Oak Ave, Sydney NSW 2000  │
    │                                     │
    │  📦 LAUNDRY DETAILS               │
    │  ├─ Weight: 5 kg                   │
    │  ├─ Service: Standard              │
    │  ├─ Speed: Express                 │
    │  └─ Items: [list...]               │
    │                                     │
    │  💰 TOTAL: $24.00                  │
    │                                     │
    │  🗺️ GOOGLE MAPS (BELOW)           │
    │  ├─ 🟡 Yellow = Pickup            │
    │  ├─ 🔵 Blue = Delivery            │
    │  ├─ Interactive map               │
    │  ├─ Click markers for info        │
    │  └─ Pan/Zoom/Fullscreen          │
    │                                     │
    │  [Start Pickup] [Back to Jobs]    │
    │                                     │
    └─────────────────────────────────────┘
              ↓
        [4. PRO ACCEPTS JOB]
              ↓
    ┌─────────────────────────────────────┐
    │ WHAT HAPPENS:                       │
    │ ✅ Job status → "Accepted"         │
    │ ✅ Order pro_id → Employee ID      │
    │ ✅ Email sent to customer          │
    │ ✅ Button turns green              │
    └─────────────────────────────────────┘
```

---

## 📱 Screen Layout - Full Order Details Page

```
┌────────────────────────────────────────────────────────────┐
│ [← Back]  Order Details      #ABC12345  [Status Badge]     │
├────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────┐  ┌──────────────────────┐ │
│  │ MAIN CONTENT (2/3 width)   │  │  SIDEBAR (1/3 width) │ │
│  │                              │  │                      │ │
│  │ 📧 CUSTOMER INFO            │  │ 💰 PRICING SUMMARY  │ │
│  │ ├─ Name: John Doe          │  │ ├─ $24.00 (large)   │ │
│  │ ├─ Phone: +61...           │  │ └─ Total amount     │ │
│  │ └─ Email: john@...         │  │                      │ │
│  │                              │  │ 📋 QUICK INFO      │ │
│  │ ┌─────────────────────────┐ │  │ ├─ Order ID        │ │
│  │ │ 📍 PICKUP | 🚗 DELIVERY │ │  │ └─ Status badge    │ │
│  │ ├─ 123 Main St    / 456... │ │  │                      │ │
│  │ └─ Scheduled date         │ │  │ [Start Pickup]     │ │
│  │                              │  │ [Back to Jobs]     │ │
│  │ 📦 LAUNDRY DETAILS         │  │                      │ │
│  │ ├─ Weight: 5 kg            │  │                      │ │
│  │ ├─ Service: Standard       │  │                      │ │
│  │ ├─ Speed: Express          │  │                      │ │
│  │ └─ Items: [...list...]     │  │                      │ │
│  │                              │  │                      │ │
│  │ 🗺️ GOOGLE MAP              │  │                      │ │
│  │ │  🟡      ·  ·  🔵       │  │                      │ │
│  │ │    ·  ·  ·  ·  ·  ·   │  │                      │ │
│  │ │  ·  ·  ·  ·  ·  ·  ·  │  │                      │ │
│  │ │    ·  ·  ·  ·  ·       │  │                      │ │
│  │ └─ Click markers, pan, zoom  │  │                      │ │
│  │                              │  │                      │ │
│  └─────────────────────────────┘  └──────────────────────┘ │
│                                                             │
└────────────────────────────────────────────────────────────┘
```

---

## 🗺️ Google Map Integration

### Map Display
```
┌─────────────────────────────────────┐
│         Google Maps                 │
│                                     │
│   🟡 = Pickup (Yellow Marker)      │
│   ·   = Road                        │
│   🔵 = Delivery (Blue Marker)       │
│                                     │
│      🟡                             │
│        ·  ·  ·                      │
│          ·  ·  ·                    │
│            ·  ·  ·                  │
│              · 🔵                   │
│                                     │
│   [< Zoom >] [↗ Fullscreen]        │
│   [⊡ Satellite] [👁 Street View]  │
└─────────────────────────────────────┘
```

### Marker Info Window
```
When you click on a marker:

  ┌────────────────────┐
  │ 📍 Pickup          │
  │ 123 Main St        │
  │ Sydney NSW 2000    │
  └────────────────────┘
```

---

## 📊 Data Flow Diagram

```
┌──────────────────────┐
│  Customer Places     │
│  Order (Website)     │
└──────────┬───────────┘
           ↓
    ┌──────────────────┐
    │ Order Created in │
    │ Supabase         │
    │ Status: pending  │
    └──────┬───────────┘
           ↓
┌──────────────────────────┐
│ Pro Sees Available Jobs  │
│ /employee/jobs           │
│ GET /api/employee/       │
│   available-jobs         │
└──────┬───────────────────┘
       ↓
┌──────────────────────────┐
│ Pro Clicks "View         │
│ Details"                 │
│ Navigate to:             │
│ /employee/orders/        │
│ [orderId]                │
└──────┬───────────────────┘
       ↓
┌──────────────────────────┐
│ API Fetches Order Data   │
│ GET /api/orders/details? │
│ orderId=xxx              │
│                          │
│ Returns:                 │
│ - Order info             │
│ - Customer details       │
│ - Addresses              │
│ - Items                  │
└──────┬───────────────────┘
       ↓
┌──────────────────────────┐
│ Full Order Details Page  │
│ Renders with Map         │
│ Geocodes addresses       │
│ Shows markers            │
└──────┬───────────────────┘
       ↓
┌──────────────────────────┐
│ Pro Reviews & Accepts    │
│ POST /api/employee/      │
│   available-jobs         │
│ action: "accept"         │
└──────┬───────────────────┘
       ↓
    ┌──────────────────┐
    │ Update DB:       │
    │ - pro_jobs table │
    │ - orders table   │
    │   pro_id set     │
    └──────┬───────────┘
           ↓
    ┌──────────────────┐
    │ Send Email to    │
    │ Customer         │
    │ sendProAccepted  │
    │ JobEmail()       │
    └──────┬───────────┘
           ↓
┌──────────────────────────┐
│ Customer Receives Pro    │
│ Details Via Email        │
│ - Name, Phone, Email     │
│ - Can contact pro now    │
└──────────────────────────┘
```

---

## 🎯 Button Interactions

### Job Card Buttons
```
┌─────────────────────────────────┐
│ JOB CARD                        │
│ Order: ORD-ABC12345             │
│ Earnings: $24.00                │
│ Weight: 5 kg                    │
│                                 │
│ [🔍 View Details] [✅ Accept]   │
│                                 │
│ Click "View Details":           │
│ → Navigate to full order page   │
│ → All details visible           │
│ → Google Map shows locations    │
│                                 │
│ Click "Accept Job":             │
│ → Button turns green            │
│ → Status shows "✓ Accepted"     │
│ → Pro ID assigned               │
│ → Email sent to customer        │
│ → Job removed from available    │
│   (or marked as accepted)       │
└─────────────────────────────────┘
```

---

## 📧 Email to Customer

```
Subject: Your Washlee Pro is On The Way! 🧺

Dear John,

Great news! We've found your Washlee Pro:

┌──────────────────────────────────────────┐
│ 👤 Meet Your Pro:                        │
│                                          │
│ Name: Sarah Johnson                      │
│ Phone: +61 2 9876 5432                   │
│ Email: sarah@washlee.com                 │
│ Rating: 4.9★ (142 reviews)              │
│                                          │
│ Pro Details:                             │
│ - Vehicle: Blue Toyota Camry             │
│ - ETA: ~45 minutes                       │
│ - Distance: 3.2 km away                  │
└──────────────────────────────────────────┘

Order Details:
- Order ID: ORD-ABC12345
- Pickup: 123 Main St, Sydney
- Delivery: 456 Oak Ave, Sydney
- Total: $24.00

You can now:
✓ Call Sarah directly
✓ Text her with special requests
✓ Email for any questions
✓ Track in real-time (link below)

[Track Your Order]

Thanks for choosing Washlee!
```

---

## 🎨 Color Scheme

```
Status Badges:
- ✅ Confirmed/Accepted = Green (bg-green-100 text-green-700)
- 🔄 In Progress = Blue (bg-blue-100 text-blue-700)
- ⏳ Pending = Yellow (bg-yellow-100 text-yellow-700)
- ❌ Cancelled = Red (bg-red-100 text-red-700)

Map Markers:
- 🟡 Pickup = Yellow (Yellow-dot.png)
- 🔵 Delivery = Blue (Blue-dot.png)

Buttons:
- Primary CTA = Teal/Gradient (from-primary to-accent)
- Secondary = Outline (border with text)
- Danger = Red (if needed)

Cards:
- Light background = White (#FFFFFF)
- Dark theme = Slate-800/900 (for dark mode)
```

---

## 📱 Responsive Design

```
Mobile (< 768px):
- Single column layout
- Full-width cards
- Stacked buttons
- Map height: 300px

Tablet (768px - 1024px):
- Two column grid
- Reduced padding
- Side-by-side cards
- Map height: 350px

Desktop (> 1024px):
- Full 3-column layout (2/3 + 1/3)
- Full padding
- All details visible
- Map height: 400px
```

---

## ✨ Feature Highlights

### What's New for Pros
✅ See complete order details before accepting
✅ View customer information and addresses
✅ Google Maps shows exact pickup location
✅ See laundry items and preferences
✅ Know total earnings upfront
✅ One-click job acceptance

### What's New for Customers
✅ Pro details immediately when accepted
✅ Can contact pro directly
✅ Email with pro's contact info
✅ See pro details on tracking page
✅ Professional communication channel

### Technical Improvements
✅ Enhanced API with full order data
✅ Reusable Google Maps component
✅ Type-safe TypeScript implementation
✅ Responsive design
✅ Error handling & fallbacks
✅ Performance optimized

---

## 🚀 Production Ready

✅ Fully implemented
✅ Error handled
✅ Type-safe
✅ Responsive
✅ Accessible
✅ Documented
✅ Tested
✅ Ready to Deploy

---

**Version**: 1.0
**Status**: Complete
**Last Updated**: April 19, 2026
