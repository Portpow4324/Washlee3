# Admin Panel Integration - Quick Start Testing Guide

## How to Test the New Admin Panel

### Step 1: Start Your Dev Server
```bash
npm run dev
# Server runs on http://localhost:3000
```

### Step 2: Access Admin Dashboard
1. Go to `http://localhost:3000/admin`
2. Log in with admin password (configured in your `.env.local`)
3. You should see the admin dashboard with real metrics

### Step 3: Test Each Collection Page

#### A. Test Users Page
```
URL: http://localhost:3000/admin/users
Expected:
- List of all users from Supabase
- Filter by type (Customers, Pros, Admins)
- Search by name or email
- Shows: Name, Email, Phone, Role, Join Date
```

#### B. Test Orders Page
```
URL: http://localhost:3000/admin/orders
Expected:
- List of all orders from Supabase
- Filter by status (pending, confirmed, in-transit, delivered, cancelled)
- Search by customer name, email, or order ID
- Shows: Order ID, Customer, Status, Amount, Date
- Stats card showing: Total Orders, Delivered, Revenue, Pending
```

#### C. Test Subscriptions Page
```
URL: http://localhost:3000/admin/subscriptions
Expected:
- List of active subscription holders
- Filter by status
- Search by plan name or email
- Shows: Email, Plan, Status, Amount, Period End
- Stats card showing: Total Active, Revenue, Active Rate %
```

#### D. Test Wash Club Page
```
URL: http://localhost:3000/admin/wash-club
Expected:
- List of loyalty program members
- Filter by tier (Bronze, Silver, Gold, Platinum)
- Sort by join date, spend, or credits
- Search by card number or email
- Shows: Email, Card #, Tier, Credits, Total Spend, Status, Joined Date
- Stats card showing: Total Members, Total Credits, Total Spend, Active Members
```

#### E. Test Support Tickets Page
```
URL: http://localhost:3000/admin/support-tickets
Expected:
- List of customer inquiries
- Filter by status (pending, contacted, resolved, closed)
- Filter by type (billing, technical, service_issue, feedback, general)
- Search by name, email, or message
- Shows: Name, Email, Phone, Type, Message, Status
- Ability to add admin notes (click "Add Note")
- Status update buttons: Mark as Contacted, Resolve, Close Ticket
- Stats card showing: Total Tickets, Pending, Resolved, Resolution Rate %
```

### Step 4: Test Dashboard Metrics

Go to `http://localhost:3000/admin/dashboard`

1. **Check Metrics Load:**
   - Total Users (should match users table count)
   - Total Orders (should match orders table count)
   - Total Revenue (sum of order amounts)
   - Active Orders (pending + confirmed)
   - Active Users (users with orders in last 30 days)
   - Avg Order Value (total revenue / count)

2. **Test Manual Sync:**
   - Click the refresh button (circular arrow icon)
   - Wait for sync to complete
   - Check that "Last sync: HH:MM:SS" updates
   - Verify metrics refresh

### Step 5: Test Data Integrity

#### Verify Counts Match Supabase
Run these queries in Supabase directly:

```sql
-- Check users count
SELECT COUNT(*) as user_count FROM users;

-- Check orders count
SELECT COUNT(*) as order_count FROM orders;

-- Check subscriptions (active customers)
SELECT COUNT(*) as subscription_count FROM customers 
WHERE subscription_active = true;

-- Check wash club members
SELECT COUNT(*) as wash_club_count FROM wash_clubs 
WHERE status = 'active';

-- Check support tickets
SELECT COUNT(*) as ticket_count FROM inquiries 
WHERE type = 'customer_inquiry';
```

Compare these numbers to your admin dashboard. They should match!

### Step 6: Test Filtering & Search

#### Orders Page Filter Test
1. Go to `/admin/orders`
2. Select Status filter = "Delivered"
3. Should show only delivered orders
4. Type a customer name in search box
5. Results should filter in real-time
6. Change sort from "Date" to "Price"
7. Orders should re-sort by price

#### Support Tickets Filter Test
1. Go to `/admin/support-tickets`
2. Filter by Status = "Pending"
3. Should show only pending tickets
4. Filter by Type = "Billing"
5. Should show only billing inquiries
6. Type partial name in search
7. Results should match

### Step 7: Test Admin Notes (Support Tickets)

1. Go to `/admin/support-tickets`
2. Click "Add Note" on any ticket
3. Type a test note
4. Click "Save Note"
5. Verify note appears with timestamp
6. Refresh page
7. Note should still be there (saved to Supabase)

### Step 8: Test Status Updates

#### Support Ticket Status
1. Go to `/admin/support-tickets`
2. Find a pending ticket
3. Click "Mark as Contacted"
4. Verify status changes in list
5. Refresh page
6. Status should persist (saved to Supabase)

#### Pro Application Status (if applicable)
1. Go to `/admin/pro-applications`
2. Find a pending application
3. Click "Approve" or "Reject"
4. Verify status updates
5. Refresh page
6. Status should persist

### Step 9: Test Manual Data Sync API

```bash
# Trigger manual sync from command line
curl -X POST http://localhost:3000/api/admin/sync-all-data \
  -H "Authorization: Bearer admin" \
  -H "Content-Type: application/json" \
  -d '{"force": true}'

# Expected response:
# {
#   "success": true,
#   "synced": 1250,
#   "collections": {
#     "Users": { "count": 150, "synced": true },
#     "Orders": { "count": 1000, "synced": true },
#     ...
#   },
#   "metrics": { ... }
# }
```

### Step 10: Verify Real-Time Updates (Optional)

For the most complete test, open browser dev tools and:

1. Keep `/admin/dashboard` open in one tab
2. In another tab, go to Supabase
3. Create a new order in the database
4. Go back to admin dashboard
5. Click refresh button
6. Verify new order appears in metrics
7. Go to `/admin/orders`
8. Verify new order appears in the list

## Troubleshooting

### Issue: Data not loading
**Solution:**
- Check browser console for errors (F12)
- Verify Supabase credentials in `.env.local`
- Check that Supabase tables exist (Users, Orders, etc.)
- Check RLS policies aren't blocking read access

### Issue: Search/Filter not working
**Solution:**
- Verify data is actually loaded first
- Check browser console for SQL errors
- Ensure filter values match database values
- Try manual sync first (click refresh)

### Issue: Admin notes not saving
**Solution:**
- Check browser console for errors
- Verify `inquiries` table has `admin_notes` column
- Check Supabase RLS allows UPDATE on inquiries

### Issue: Metrics showing zero
**Solution:**
- Verify you have data in Supabase tables
- Run count queries above to check table contents
- Try manual sync (click refresh button)
- Check that field names match in supabaseAdminSync.ts

### Issue: Status updates not reflecting
**Solution:**
- Manually refresh page (F5)
- Check Supabase directly to confirm update happened
- Verify status values match database enum values

## Expected Results

After completing all tests, you should see:

✅ Users count matches database
✅ Orders count matches database  
✅ Revenue sum is accurate
✅ All filters work correctly
✅ Search returns correct results
✅ Admin notes save and persist
✅ Status updates work
✅ Sync button refreshes data
✅ Last sync timestamp updates
✅ All pages load without errors

If everything passes, your admin panel is fully integrated with Supabase!

## Performance Notes

- First load may take 2-3 seconds (loading all records)
- Subsequent filters are instant (client-side)
- Search is real-time as you type
- Sync can take up to 5 seconds depending on data size

## Next Steps

After verifying everything works:

1. **Test Pro Signup:** Create a pro account and verify it creates:
   - User record
   - Customer record
   - Employee record
   - Optional: Wash Club record

2. **Test Real-Time (Optional):** With webhook setup, data updates without manual refresh

3. **Performance Tuning (Optional):** Add pagination for large datasets

4. **Deployment:** Deploy to Vercel/production environment

Let me know if you find any issues during testing!
