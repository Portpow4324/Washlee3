# Pro Dashboard Feature Navigation Guide

## URLs & Navigation Paths

### 1. Employee Jobs Page (Available Jobs)
**URL**: `http://localhost:3000/employee/jobs`

**Components**:
- Shows all available jobs in card format
- Each job card has TWO buttons:
  - 🔍 **"View Details"** - Opens full order details page
  - ✅ **"Accept Job"** - Accepts the job

**Job Card Information**:
- Order ID (first 8 characters)
- Estimated earnings ($)
- Weight (kg)
- Status badge
- Service type (Standard/Premium)
- Delivery speed
- Full Order ID

---

### 2. Employee Order Details Page (NEW)
**URL**: `http://localhost:3000/employee/orders/[orderId]`
**Example**: `http://localhost:3000/employee/orders/abc12345-def6-7890-ghij-klmnopqrstuv`

**Full-Screen Layout**:
```
┌─────────────────────────────────────────────────────────────┐
│ [← Back]  Order Details     #ABC12345     [Status Badge]    │
└─────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────┐  ┌──────────┐
│                                              │  │ Pricing  │
│ 📧 Customer Information                      │  │ $XX.XX   │
│ Name, Phone, Email                           │  │          │
│                                              │  │ Order ID │
│ 📍 Pickup Location        🚗 Delivery        │  │ Status   │
│ Address + Date            Address            │  │          │
│                                              │  │ [Actions]│
│ 📦 Laundry Details                           │  │ • Start  │
│ Weight, Service, Speed, Items                │  │ • Back   │
│                                              │  │          │
│ 🗺️ Google Maps                              │  │          │
│ (Shows both locations)                       │  │          │
│                                              │  │          │
└──────────────────────────────────────────────┘  └──────────┘
```

---

### 3. Customer Tracking Page (EXISTING - ENHANCED)
**URL**: `http://localhost:3000/tracking?orderId=[orderId]`
**Example**: `http://localhost:3000/tracking?orderId=abc12345-def6-7890-ghij-klmnopqrstuv`

**Now Shows**:
- ✅ Pro's full name
- ✅ Pro's phone number
- ✅ Pro's email address
- (Pro info populated when job is accepted)

**Source**: 
- Fetches from API when pro_id is set on order
- Data comes from `users` table where id = pro_id

---

## Feature Workflow

### When Employee Accepts a Job:
```
1. Employee clicks "Accept Job" on jobs page
   ↓
2. /api/employee/available-jobs [POST]
   - Updates pro_jobs table: status → "accepted", pro_id set
   - Updates orders table: pro_id set to employee ID
   ↓
3. Email sent to customer (sendProAcceptedJobEmail)
   - To: customer.email
   - Includes: Pro name, phone, email, order details
   ↓
4. Customer can now:
   - See pro details on tracking page
   - Contact pro directly
   - Chat/call with pro (if messaging enabled)
```

### When Employee Views Order Details:
```
1. Employee clicks "View Details" on job card
   ↓
2. Navigate to /employee/orders/[orderId]
   ↓
3. Page fetches /api/orders/details?orderId=xxx
   - Returns full order data
   - Includes customer info, addresses, items, pricing
   ↓
4. Google Maps loads
   - Geocodes pickup address → yellow marker
   - Geocodes delivery address → blue marker
   - Centers map to show both locations
   ↓
5. Employee can:
   - Click markers to see addresses
   - Click "Start Pickup" to begin order
   - Click "Back to Jobs" to return
```

---

## Map Interaction Guide

### Google Maps Features:
1. **Zoom**: Scroll wheel or +/- buttons
2. **Pan**: Click and drag to move map
3. **Info Windows**: Click markers to see address details
4. **Fullscreen**: Click fullscreen icon in top-right
5. **Street View**: Click person icon and drag to map
6. **Map Type**: Switch between map, satellite, terrain

### Marker Colors:
- 🟡 **Yellow Marker**: Pickup location (customer's address)
- 🔵 **Blue Marker**: Delivery location (destination)

### Geocoding Behavior:
- If address is valid: Maps to location, marker appears
- If address is invalid: Marker doesn't appear
- If no address: Map shows fallback message

---

## API Endpoints Reference

### 1. Get Available Jobs
**Endpoint**: `/api/employee/available-jobs`
**Method**: GET
**Params**: `employeeId`, `status` (optional), `limit` (optional)
**Returns**: Array of available jobs

**Example**:
```
GET /api/employee/available-jobs?employeeId=user-id-123&limit=20
```

### 2. Accept/Decline Job
**Endpoint**: `/api/employee/available-jobs`
**Method**: POST
**Body**:
```json
{
  "jobId": "job-id-123",
  "employeeId": "user-id-123",
  "action": "accept"
}
```
**Response**: Updated job data + sends email to customer

### 3. Get Order Details
**Endpoint**: `/api/orders/details`
**Method**: GET
**Params**: `orderId` (required)
**Returns**:
```json
{
  "id": "order-id",
  "status": "confirmed",
  "totalPrice": 24.00,
  "weight": 5,
  "items": { "service_type": "standard", ... },
  "pickupAddress": "123 Main St, Sydney",
  "deliveryAddress": "456 Oak Ave, Sydney",
  "customer": { "name": "John", "phone": "+61...", "email": "..." },
  "pro": { "name": "Pro Name", ... }
}
```

---

## Component Files Reference

### EmployeeOrderMap Component
**Location**: `/components/EmployeeOrderMap.tsx`
**Props**:
- `pickupAddress` (string) - Address to geocode for pickup
- `deliveryAddress` (string, optional) - Address for delivery
- `mapId` (string, optional) - HTML element ID (default: "employee-order-map")
- `height` (string, optional) - Map height (default: "400px")

**Usage**:
```tsx
<EmployeeOrderMap
  pickupAddress="123 Main St, Sydney NSW 2000"
  deliveryAddress="456 Oak Ave, Sydney NSW 2000"
  height="500px"
/>
```

### EmployeeOrderDetails Page
**Location**: `/app/employee/orders/[orderId]/page.tsx`
- Client-side component
- Authentication protected (redirects if not logged in)
- Loads order data from API
- Renders full-screen order details with map

---

## Environment Setup

### Required Env Variables:
```bash
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your-key-here
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-key
```

### Google Maps Enabled APIs:
- Google Maps JavaScript API
- Google Geocoding API
- Google Maps Street View API

---

## Testing Scenarios

### Scenario 1: View Available Jobs
1. Navigate to `http://localhost:3000/employee/jobs`
2. See list of available jobs
3. Each job has "View Details" and "Accept Job" buttons

### Scenario 2: View Full Order Details
1. Click "View Details" on any job
2. Should navigate to `/employee/orders/[orderId]`
3. See full order information
4. Google Maps should load and show pickup/delivery locations

### Scenario 3: Accept Job
1. Click "Accept Job" button
2. Job status should change to "✓ Accepted" (green)
3. Order assigned to pro
4. Customer should receive email with pro details

### Scenario 4: Map Interactions
1. View order details page
2. Click on yellow/blue markers on map
3. Info windows should show addresses
4. Try panning and zooming
5. Test fullscreen mode

---

## Troubleshooting

### Map Not Loading
- Check Google Maps API key in `.env.local`
- Verify JavaScript is enabled in browser
- Check browser console for errors
- Ensure addresses are in valid format

### Addresses Not Geocoding
- Verify address format (include city, state)
- Try full Australian address: "123 Main St, Sydney NSW 2000"
- Check console for geocoding errors

### No Pro Details on Tracking
- Ensure job was accepted (pro_id should be set on order)
- Refresh tracking page
- Check that customer received acceptance email

---

**Last Updated**: April 19, 2026
**Status**: ✅ All Features Implemented & Ready
