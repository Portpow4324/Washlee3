# Export Real Firebase Data to Supabase

## ⚡ Quick Option: Manual Export from Firebase Console

### Step 1: Go to Firebase Console
1. Open: https://console.firebase.google.com
2. Select your **washlee** project
3. Go to **Firestore Database**
4. You'll see all your collections: users, customers, employees, orders, etc.

### Step 2: Export Each Collection

For each collection (customers, employees, orders, etc.):

1. Click the collection name
2. Click **⋮** (three dots) → **Export**
3. Choose format (CSV or JSON)
4. Download the file

### Step 3: Provide the Export Files

Once you have the exports, you can either:

**Option A: Send me the JSON/CSV files**
- I'll transform them into the correct format
- I'll update all CSV import files automatically

**Option B: Copy-Paste Raw Data**
- Show me the customer data, employee data, orders, etc.
- I'll manually extract and create the files

---

## 🤖 Automated Option: Use Node.js Script

If you have Node.js installed locally:

```bash
# Install dependencies
npm install firebase-admin

# Create .env file with:
FIREBASE_PROJECT_ID=washlee-28e3f
FIREBASE_PRIVATE_KEY="your_private_key_here"
FIREBASE_CLIENT_EMAIL="your_service_account_email"

# Run export
node EXPORT_FIREBASE_DATA.ts
```

This will create:
- `users-export.csv`
- `customers-export.csv`
- `employees-export.csv`
- `orders-export.csv`
- `reviews-export.csv`
- `inquiries-export.csv`

---

## 📋 What I Need From You

Send me **one of these options**:

### Option 1: CSV Files (Easiest)
Export from Firebase Console as CSV and attach them

### Option 2: JSON Export (Also Good)
Export from Firebase Console as JSON and share the content

### Option 3: Screenshot of Data
Show me the data in Firebase Console and I'll recreate it

### Option 4: Tell Me What to Query
Tell me which collections have real data:
- "I have X customers with names like..."
- "I have Y orders for..."
- "I have Z employees including..."

---

## What Happens Next

Once I receive the real data:

1. ✅ Transform it to match Supabase schema
2. ✅ Generate new CSV files with real data
3. ✅ Generate new SQL import script with real data
4. ✅ You paste into Supabase → Database populated with real users!

---

## Example of What I'm Looking For

```
Firebase Customers Collection:
- john_doe (uid)
  - email: john@example.com
  - firstName: John
  - lastName: Doe
  - phone: +1234567890
  - totalOrders: 5
  - totalSpent: 250
  - createdAt: 2024-01-20

- jane_smith (uid)
  - email: jane@example.com
  - ...
```

**Then I transform it to:**

```csv
id,email,name,phone,subscription_active,...
550e8400-...,john@example.com,John Doe,+1234567890,true,...
660e8400-...,jane@example.com,Jane Smith,+1234567891,false,...
```

---

## Quick Decision

Which option will you choose?

- [ ] **Export from Firebase Console** (easiest)
- [ ] **Run Node.js script** (automated)
- [ ] **Send me a screenshot** (manual)
- [ ] **Tell me the data verbally** (I'll ask questions)

Once I have your data, I'll regenerate all the CSV files and SQL import script! 🚀
