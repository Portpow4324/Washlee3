# CSV Import Guide for Supabase

## Overview
11 CSV files with sample data for each table. Import them one at a time in the order listed below.

## Files & Import Order

All files are in: `CSV_IMPORTS/` folder

**Important**: Import in this order (respects foreign key constraints):

### 1. `01_users.csv` → `users` table
- 5 sample users (customers, pros, admin)
- **No dependencies**
- Do this FIRST

### 2. `02_customers.csv` → `customers` table
- Customer-specific data (subscriptions, addresses)
- Depends on: users
- Do this SECOND

### 3. `03_employees.csv` → `employees` table
- Pro/employee data (ratings, earnings)
- Depends on: users
- Do this THIRD

### 4. `04_wash_clubs.csv` → `wash_clubs` table
- Wash Club memberships with card numbers
- Depends on: users
- Do this FOURTH

### 5. `05_wash_club_verification.csv` → `wash_club_verification` table
- Email verification codes
- Depends on: users
- Do this FIFTH

### 6. `06_wash_club_transactions.csv` → `wash_club_transactions` table
- Credit transactions audit trail
- Depends on: users, wash_clubs, orders
- Do this SIXTH (after orders)

### 7. `07_orders.csv` → `orders` table
- Service orders with tracking
- Depends on: users
- Do this SEVENTH

### 8. `08_reviews.csv` → `reviews` table
- Customer reviews
- Depends on: orders, users
- Do this EIGHTH

### 9. `09_inquiries.csv` → `inquiries` table
- Pro applications and inquiries
- Depends on: users (optional)
- Do this NINTH

### 10. `10_transactions.csv` → `transactions` table
- Payment transactions
- Depends on: users, orders
- Do this TENTH

### 11. `11_verification_codes.csv` → `verification_codes` table
- General verification codes (email, phone, password reset)
- Depends on: users
- Do this LAST

---

## How to Import Each CSV

### In Supabase Dashboard:

1. Go to **Tables** (left sidebar)
2. Click on the table name (e.g., `users`)
3. Click **↓ Import data**
4. Click **Choose CSV file**
5. Select the corresponding CSV file
6. Click **Import**
7. Wait for success message

### Repeat for each table:
- Do NOT skip tables (even if empty)
- Import in order (1 through 11)
- Wait for each import to complete before starting next

---

## Expected Results After Import

| Table | Records | Notes |
|-------|---------|-------|
| users | 5 | Admin, pros, customers |
| customers | 2 | Subscription data |
| employees | 2 | Pro/employee data |
| wash_clubs | 2 | Loyalty memberships |
| wash_club_verification | 2 | Email codes (verified) |
| wash_club_transactions | 3 | Credit transactions |
| orders | 2 | Service orders |
| reviews | 1 | Customer reviews |
| inquiries | 2 | Pro applications |
| transactions | 2 | Payments |
| verification_codes | 3 | Email/phone codes |

**Total: ~24 sample records**

---

## Sample User IDs (For Reference)

These UUIDs are used across all CSVs:

| Name | Role | UUID |
|------|------|------|
| John Doe | Customer | `550e8400-e29b-41d4-a716-446655440000` |
| Jane Smith | Pro | `550e8400-e29b-41d4-a716-446655440001` |
| Admin User | Admin | `550e8400-e29b-41d4-a716-446655440002` |
| Mike Johnson | Customer (Wash Club) | `550e8400-e29b-41d4-a716-446655440003` |
| Sarah Williams | Pro | `550e8400-e29b-41d4-a716-446655440004` |

---

## Important Notes

### ✅ Good to Know
- All timestamps are in ISO 8601 format (UTC)
- JSON fields (like delivery_address) are properly escaped
- Foreign keys are valid UUIDs
- Sample card numbers: WASH-XXXX-XXXX-XXXX format
- Test data is safe to delete later

### ⚠️ If Import Fails
1. Check error message (might be constraint violation)
2. Verify table exists in Supabase
3. Verify CSV column names match table schema
4. Try importing simpler tables first (users, then customers)
5. Check for duplicate IDs if re-importing

### 🗑️ To Clear All Data
```sql
-- Delete in reverse order of foreign keys:
DELETE FROM public.wash_club_transactions;
DELETE FROM public.verification_codes;
DELETE FROM public.transactions;
DELETE FROM public.reviews;
DELETE FROM public.inquiries;
DELETE FROM public.orders;
DELETE FROM public.wash_club_verification;
DELETE FROM public.wash_clubs;
DELETE FROM public.employees;
DELETE FROM public.customers;
DELETE FROM public.users;
```

---

## Quick Checklist

- [ ] Import 01_users.csv → users
- [ ] Import 02_customers.csv → customers
- [ ] Import 03_employees.csv → employees
- [ ] Import 04_wash_clubs.csv → wash_clubs
- [ ] Import 05_wash_club_verification.csv → wash_club_verification
- [ ] Import 06_wash_club_transactions.csv → wash_club_transactions
- [ ] Import 07_orders.csv → orders
- [ ] Import 08_reviews.csv → reviews
- [ ] Import 09_inquiries.csv → inquiries
- [ ] Import 10_transactions.csv → transactions
- [ ] Import 11_verification_codes.csv → verification_codes

**After all imports complete**: Your Supabase database will have realistic test data! ✅

---

## Next Steps After Import

1. ✅ Verify all tables have data
2. ✅ Check Supabase dashboard for record counts
3. ✅ Move to Phase 3: Update AuthContext.tsx
4. ✅ Test login with sample users

**Sample test user:**
- Email: john@example.com
- (Use this in Phase 3 auth testing)

---

**Files location**: `CSV_IMPORTS/` folder (11 CSV files)
**Total import time**: ~5 minutes (1 minute per table)
