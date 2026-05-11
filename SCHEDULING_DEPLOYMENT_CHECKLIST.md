# ✅ SCHEDULING IMPLEMENTATION - DEPLOYMENT CHECKLIST

**Status:** Ready for Deployment  
**Completion Level:** 95% (Database + Testing Remaining)  
**Total Time Required:** 30 minutes

---

## 🚀 DEPLOYMENT CHECKLIST

### PRE-DEPLOYMENT (Verify You Have Everything)

**Infrastructure:**
- [ ] Supabase account active
- [ ] Supabase project selected
- [ ] Access to project's SQL Editor
- [ ] Node.js installed locally
- [ ] npm installed locally
- [ ] VS Code or terminal ready
- [ ] Internet connection stable

**Files:**
- [ ] All frontend code in `/app/booking-hybrid/page.tsx` ✅
- [ ] `/app/api/scheduling/pickup-slots.ts` exists ✅
- [ ] `/app/api/scheduling/delivery-slots.ts` exists ✅
- [ ] Documentation files present ✅

**Environment:**
- [ ] `.env.local` has `NEXT_PUBLIC_SUPABASE_URL` set
- [ ] `.env.local` has `SUPABASE_SERVICE_ROLE_KEY` set
- [ ] Both are correct for your Supabase project

---

## PHASE 1: DATABASE SETUP (15 minutes)

### Step 1.1: Prepare SQL (2 minutes)
- [ ] Open `SCHEDULING_QUICK_REFERENCE.md` or `SCHEDULING_ACTION_NOW.md`
- [ ] Locate "Step 1: Copy This SQL" section
- [ ] Select entire SQL block
- [ ] Copy to clipboard
- [ ] Verify it's 1000+ lines (you should see 1200+ characters)

### Step 1.2: Open Supabase (1 minute)
- [ ] Go to https://app.supabase.com
- [ ] Ensure you're logged in
- [ ] Select your project
- [ ] Click **SQL Editor** in left sidebar
- [ ] Verify you see "SQL Editor" at top

### Step 1.3: Create New Query (1 minute)
- [ ] Click **New Query** button (blue, top-right)
- [ ] Empty editor appears
- [ ] Editor is ready for input

### Step 1.4: Paste SQL (2 minutes)
- [ ] Click in the editor area
- [ ] Paste the SQL (Cmd+V on Mac, Ctrl+V on Windows)
- [ ] Verify all SQL appears
- [ ] Scroll through to verify complete

### Step 1.5: Execute SQL (5 minutes)
- [ ] Click **Run** button (blue, top-right)
- [ ] OR Press Cmd+Enter (Mac) or Ctrl+Enter (Windows)
- [ ] Wait for execution (should show progress)
- [ ] **Expected Result:** Green checkmark and "Setup Complete! ✅"

**If ERROR appears:**
- [ ] Read error message carefully
- [ ] Check for SQL syntax (but should be correct)
- [ ] Verify you're in correct project
- [ ] Try copying SQL again
- [ ] Try pasting in new query window
- [ ] Contact support if persists

### Step 1.6: Verify in Supabase (4 minutes)
- [ ] Click **Table Editor** in left sidebar
- [ ] Look for these new tables:
  - [ ] `availability_slots` - should show ~150 rows
  - [ ] `pro_slot_assignments` - should be empty initially
  - [ ] `booking_slot_assignments` - should be empty initially
- [ ] Verify `orders` table has new columns:
  - [ ] `pickup_date`
  - [ ] `pickup_time_slot`
  - [ ] `delivery_date`
  - [ ] `delivery_time_slot`
  - [ ] `scheduled_at`

**If tables missing:**
- [ ] Refresh page (Cmd+R)
- [ ] Check for error in SQL execution
- [ ] Verify SQL output said "Setup Complete!"
- [ ] Re-run SQL if needed

### Phase 1 Complete When:
✅ All 3 new tables appear in Table Editor  
✅ Orders table has 4 new columns  
✅ availability_slots has 150+ rows

---

## PHASE 2: LOCAL TESTING (10 minutes)

### Step 2.1: Prepare Environment (1 minute)
- [ ] Open terminal
- [ ] Navigate to project: `cd /Users/lukaverde/Desktop/Website.BUsiness`
- [ ] Verify you're in correct directory (see `package.json`)

### Step 2.2: Install Dependencies (Skip if already done)
- [ ] Run: `npm install` (if not already done)
- [ ] Wait for completion (2-3 minutes)
- [ ] See no errors

### Step 2.3: Start Dev Server (2 minutes)
- [ ] Run: `npm run dev`
- [ ] Wait for message: "ready - started server on 0.0.0.0:3000"
- [ ] Leave terminal running

### Step 2.4: Open Booking Page (1 minute)
- [ ] Open browser
- [ ] Go to: `http://localhost:3000/booking-hybrid`
- [ ] Page should load
- [ ] See booking form

### Step 2.5: Test Step 8 (6 minutes)

**Navigate to Step 8:**
- [ ] Fill out Steps 1-7:
  - [ ] Step 1: Select any service
  - [ ] Step 2: Enter any pickup address
  - [ ] Step 3: Select care options
  - [ ] Step 4: Select weight
  - [ ] Step 5: Select delivery speed
  - [ ] Step 6: Select protection plan
  - [ ] Step 7: Enter delivery address
- [ ] Click "Next" to go to Step 8

**On Step 8 (Schedule Times):**
- [ ] See title: "Step 8: Schedule Pickup & Delivery Times"
- [ ] See date picker labeled "Pickup Date & Time"
- [ ] Date picker is enabled (not grayed out)
- [ ] Click date picker
- [ ] Calendar appears
- [ ] Select a future date (tomorrow or next week)
- [ ] See "Pickup Date & Time" section updates
- [ ] **Below date picker: time slots appear in grid**
  - [ ] Should show times like "08:00-10:00", "10:00-12:00"
  - [ ] Each should show number of pros: "3 pros", "2 pros"
  - [ ] If you see "No data" or empty - API not connected

**Test Time Slot Selection:**
- [ ] Click a pickup time slot
- [ ] Slot should highlight (change background color)
- [ ] Delivery date should auto-calculate below
- [ ] See "Delivery Date & Time" section
- [ ] See delivery slots appear
- [ ] Click a delivery time slot
- [ ] Delivery slot should highlight

**Verify Form Filled:**
- [ ] Pickup date shows value
- [ ] Pickup time shows value
- [ ] Delivery date shows value
- [ ] Delivery time shows value

### Step 2.6: Test Step 9 (1 minute)
- [ ] Click "Next" to go to Step 9
- [ ] Should see "Step 9: Review & Confirm"
- [ ] Should show all order details
- [ ] **Should show scheduled times:**
  - [ ] "Pickup: [date] [time]"
  - [ ] "Delivery: [date] [time]"

### Step 2.7: Check Browser Console (1 minute)
- [ ] Press F12 to open DevTools
- [ ] Click **Console** tab
- [ ] Look for any red error messages
- [ ] **Expected:** No errors or red messages
- [ ] **Warnings are OK** - just check for errors

**If errors appear:**
- [ ] Note the exact error message
- [ ] Check that API endpoint is running
- [ ] Verify Supabase credentials correct
- [ ] Check Network tab for API responses

### Phase 2 Complete When:
✅ Booking page loads  
✅ Step 8 shows date picker  
✅ Selecting date shows time slots  
✅ Can select pickup and delivery times  
✅ Step 9 shows scheduled times  
✅ No errors in console

---

## PHASE 3: PRODUCTION DEPLOYMENT (5 minutes)

### Step 3.1: Stop Dev Server (1 minute)
- [ ] In terminal where dev server running
- [ ] Press Ctrl+C to stop
- [ ] Wait for prompt to return

### Step 3.2: Deploy Code (3 minutes)
- [ ] Push code to your repository:
  ```bash
  git add .
  git commit -m "Add scheduling system"
  git push origin main
  ```
- [ ] Wait for deployment to complete
- [ ] Verify on Vercel/your hosting that it deployed

### Step 3.3: Verify Production (1 minute)
- [ ] Go to your production URL
- [ ] Navigate to booking page
- [ ] Walk through to Step 8
- [ ] Verify time slots load from API
- [ ] No errors in browser console

### Phase 3 Complete When:
✅ Code deployed to production  
✅ Booking page accessible  
✅ Step 8 works with real data  
✅ No errors in production

---

## POST-DEPLOYMENT (Optional but Recommended)

### Post-Deploy Verification:
- [ ] Monitor Supabase logs for errors
- [ ] Check production error logs
- [ ] Create test bookings
- [ ] Verify data saves in database
- [ ] Share with team for testing

### Document Completion:
- [ ] Update team on feature launch
- [ ] Share booking flow with users
- [ ] Provide feedback form for issues

### Plan Mobile Implementation:
- [ ] Review `MOBILE_APP_SCHEDULING_STEP.md`
- [ ] Choose target platforms
- [ ] Plan implementation timeline
- [ ] Assign developer

---

## TROUBLESHOOTING DURING DEPLOYMENT

### Issue: "Setup Complete!" doesn't appear
**Solution:**
- Check for red error messages in SQL editor
- Try running SQL again
- Check that all SQL is pasted (should be 1000+ lines)
- Verify project is correct Supabase project

### Issue: New tables don't appear
**Solution:**
- Refresh browser page
- Click Table Editor again
- Scroll down to find new tables
- If still missing, re-run SQL

### Issue: Step 8 shows no time slots
**Solution:**
- Check browser console (F12) for API errors
- Verify API endpoints exist in code
- Try manual API test:
  ```bash
  curl -X POST http://localhost:3000/api/scheduling/pickup-slots \
    -H "Content-Type: application/json" \
    -d '{"date":"2026-05-15","address":"123 Main St, Sydney NSW 2000"}'
  ```
- If no response, API not working
- If returns data, check Step 8 code

### Issue: Booking submission fails
**Solution:**
- Check browser console for error
- Verify all 4 scheduling fields in order object:
  - pickup_date
  - pickup_time_slot
  - delivery_date
  - delivery_time_slot
- Check API logs in Supabase

### Issue: API returns 500 error
**Solution:**
- Check that Supabase credentials in .env.local are correct
- Verify SQL functions exist in Supabase
- Check Supabase error logs
- Try running functions directly in SQL Editor

---

## FINAL CHECKLIST - ALL ITEMS

### Database Deployed
- [ ] SQL executed without errors
- [ ] 3 new tables created
- [ ] 4 new columns in orders
- [ ] 150+ sample slots inserted
- [ ] 4 functions created
- [ ] RLS policies enabled

### API Ready
- [ ] `pickup-slots.ts` exists
- [ ] `delivery-slots.ts` exists
- [ ] Both files have correct code
- [ ] Environment variables set
- [ ] API endpoints respond to requests

### Frontend Tested
- [ ] Booking flow loads
- [ ] Step 8 displays correctly
- [ ] Date picker works
- [ ] Time slots appear
- [ ] Can select times
- [ ] Step 9 shows times
- [ ] No console errors
- [ ] Can complete booking

### Deployed
- [ ] Code in production
- [ ] Database in production
- [ ] All tests pass
- [ ] Live and accessible

### Documentation Complete
- [ ] Sent to team
- [ ] Mobile app planned
- [ ] Users notified

---

## ✅ DEPLOYMENT COMPLETE!

When all checkmarks above are complete:

✅ Scheduling system is **LIVE**  
✅ Users can now **select pickup & delivery times**  
✅ Orders include **scheduled times**  
✅ Ready for **mobile app implementation**

---

## 🎉 YOU DID IT!

From start to finish:
- Phase 1 (Database): 15 minutes
- Phase 2 (Testing): 10 minutes  
- Phase 3 (Deploy): 5 minutes
- **Total: 30 minutes**

---

**Checklist Version:** 1.0  
**Created:** May 1, 2026  
**Purpose:** Ensure complete, error-free deployment
