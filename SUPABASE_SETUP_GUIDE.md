# Washlee Supabase Setup & Troubleshooting

## Problem: Customer profiles not being saved to Supabase

When users sign up, the auth account is created but the customer profile doesn't appear in the database. This happens because the `customers` table doesn't exist yet.

## Solution: Create Supabase Tables

Follow these steps to set up your Supabase database:

### Step 1: Go to Supabase SQL Editor
1. Open your Supabase project dashboard: https://supabase.com/dashboard
2. Select your Washlee project
3. Click **"SQL Editor"** in the left sidebar
4. Click **"New Query"**

### Step 2: Create the Tables
1. Open the file `SUPABASE_SETUP.sql` in this folder
2. Copy ALL the SQL code
3. Paste it into the Supabase SQL Editor
4. Click **"Run"** button

### Step 3: Verify Tables Were Created
1. Click **"Table Editor"** in the left sidebar
2. You should see two new tables:
   - `customers` (for signup customers)
   - `employees` (for employee accounts)
3. Each table should show the columns from the SQL file

## After Setup: Test Signup

1. Go to http://localhost:3000/auth/signup-customer
2. Fill in the form and sign up with a test email
3. Check the Supabase Table Editor → `customers` table
4. You should see a new row with your profile data
5. Check your email (or console logs) for the welcome email

## Troubleshooting

### "Table 'customers' does not exist"
- Make sure you ran the SQL setup script above
- Verify the tables appear in Table Editor

### "Permission denied" error
- This means RLS (Row Level Security) is blocking the insert
- The SQL includes the correct RLS policies, but verify they exist:
  - Go to Authentication → Policies
  - Look for policies on `customers` and `employees` tables

### SendGrid Email Not Sending
- Check that these env vars are set in `.env.local`:
  ```
  SENDGRID_API_KEY=SG.JlFAT7zQQxyroqTC1U0_yQ...
  SENDGRID_FROM_EMAIL=lukaverde045@gmail.com
  ```
- If set, emails should send to the user's inbox
- If not set, you'll see "Would send to:" in console (mock mode)

### Customer Can't Access Dashboard
- Dashboard checks if customer profile exists in database
- Make sure the table setup SQL was run successfully
- Verify the new row appears in Table Editor after signup

## Email Configuration

**Current Status:** ✅ SendGrid is configured and ready
- API Key: `SENDGRID_API_KEY=SG.JlFAT7z...` (in .env.local)
- From Email: `lukaverde045@gmail.com`
- Welcome email template: Sends automatically on signup

## File Overview

- `SUPABASE_SETUP.sql` - SQL to create all tables (copy to Supabase)
- `lib/userManagement.ts` - User profile functions (implemented ✅)
- `lib/emailService.ts` - Email sending functions (implemented ✅)
- `app/auth/signup-customer/page.tsx` - Signup form that calls the above functions

## Next Steps

1. ✅ Run the SUPABASE_SETUP.sql
2. ✅ Test signup flow
3. ✅ Verify customer profile appears in table
4. ✅ Check email for welcome message
5. ✅ Customer can access dashboard

All functions are implemented. Just need the database tables to be created!
