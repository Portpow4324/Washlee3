# 📂 WHERE TO PUT YOUR API KEYS

## The One File You Need to Edit

**Location**: `/Users/lukaverde/Desktop/Website.BUsiness/.env.local`

### How to Edit It:

**Option 1: Using VS Code (Easiest)**
1. Open VS Code
2. File → Open File
3. Navigate to `/Users/lukaverde/Desktop/Website.BUsiness/`
4. Find `.env.local` (it starts with a dot, so it might be hidden)
5. Open it
6. Edit the file (see below)
7. Save with Cmd+S

**Option 2: Using Terminal**
```bash
# Open the file in text editor
nano /Users/lukaverde/Desktop/Website.BUsiness/.env.local

# Then edit and save with Ctrl+X, then Y, then Enter
```

---

## What Your .env.local File Looks Like

It's a simple text file with lines like this:

```
KEY_NAME=key_value
KEY_NAME=key_value
KEY_NAME=key_value
```

### BEFORE (What You Have Now):
```bash
FIREBASE_PROJECT_ID=washlee-7d3c6
FIREBASE_CLIENT_EMAIL=fbsvc@washlee-7d3c6.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY=...long_private_key...
FIREBASE_SECONDARY_PROJECT_ID=washlee-7d3c6
FIREBASE_SECONDARY_CLIENT_EMAIL=lukaverde@washlee-7d3c6.iam.gserviceaccount.com
FIREBASE_SECONDARY_PRIVATE_KEY=...long_private_key...
```

### AFTER (What You'll Add):
```bash
# Google Maps - Get from https://console.cloud.google.com
GOOGLE_MAPS_API_KEY=AIzaSyD...copy_your_entire_key_here...

# Stripe - Get from https://dashboard.stripe.com (test keys first!)
STRIPE_PUBLIC_KEY=pk_test_...copy_your_key_here...
STRIPE_SECRET_KEY=sk_test_...copy_your_key_here...
STRIPE_WEBHOOK_SECRET=whsec_...copy_your_key_here...

# SendGrid - Get from https://app.sendgrid.com
SENDGRID_API_KEY=SG....copy_your_key_here...
SENDGRID_FROM_EMAIL=noreply@washlee.com

# Firebase (Already There - Don't Change!)
FIREBASE_PROJECT_ID=washlee-7d3c6
FIREBASE_CLIENT_EMAIL=fbsvc@washlee-7d3c6.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY=...long_private_key...
FIREBASE_SECONDARY_PROJECT_ID=washlee-7d3c6
FIREBASE_SECONDARY_CLIENT_EMAIL=lukaverde@washlee-7d3c6.iam.gserviceaccount.com
FIREBASE_SECONDARY_PRIVATE_KEY=...long_private_key...
```

---

## Step-by-Step: Add Each Key

### STEP 1: Google Maps Key

**Get it from**: https://console.cloud.google.com

**Looks like**: `AIzaSyD...` (long random string)

**Where to paste**:
```bash
# Find this line in .env.local:
GOOGLE_MAPS_API_KEY=

# Add your key like this:
GOOGLE_MAPS_API_KEY=AIzaSyD4pnnQrW27dPzKREjd_ABC123XYZ...
```

### STEP 2: Stripe Public Key

**Get it from**: https://dashboard.stripe.com (Developers → API keys → "Publishable key" under Test mode)

**Looks like**: `pk_test_...` (starts with pk_test_)

**Where to paste**:
```bash
# Find this line in .env.local:
STRIPE_PUBLIC_KEY=

# Add your key like this:
STRIPE_PUBLIC_KEY=pk_test_51ABC123XYZlong...
```

### STEP 3: Stripe Secret Key

**Get it from**: https://dashboard.stripe.com (Developers → API keys → "Secret key" under Test mode)

**Looks like**: `sk_test_...` (starts with sk_test_)

**Where to paste**:
```bash
# Find this line in .env.local:
STRIPE_SECRET_KEY=

# Add your key like this:
STRIPE_SECRET_KEY=sk_test_51ABC123XYZlong...
```

### STEP 4: Stripe Webhook Secret

**Get it from**: https://dashboard.stripe.com (Developers → Webhooks → click your endpoint → "Signing secret")

**Looks like**: `whsec_...` (starts with whsec_)

**Where to paste**:
```bash
# Find this line in .env.local:
STRIPE_WEBHOOK_SECRET=

# Add your key like this:
STRIPE_WEBHOOK_SECRET=whsec_1ABC123XYZlong...
```

### STEP 5: SendGrid API Key

**Get it from**: https://app.sendgrid.com (Settings → API Keys → Create API Key)

**Looks like**: `SG.....` (starts with SG.)

**Where to paste**:
```bash
# Find this line in .env.local:
SENDGRID_API_KEY=

# Add your key like this:
SENDGRID_API_KEY=SG.ABC123XYZlongkey...
```

### STEP 6: SendGrid From Email

**You choose this**: Use any email you want (e.g., noreply@washlee.com)

**Where to paste**:
```bash
# Find this line in .env.local:
SENDGRID_FROM_EMAIL=

# Add your email like this:
SENDGRID_FROM_EMAIL=noreply@washlee.com

# Or use your personal email:
SENDGRID_FROM_EMAIL=your.email@gmail.com
```

---

## The Complete Updated .env.local File

Here's exactly what it should look like after you add everything:

```bash
# ============================================
# GOOGLE MAPS
# ============================================
GOOGLE_MAPS_API_KEY=AIzaSyD4pnnQrW27dPzKREjd_ABC123XYZ...

# ============================================
# STRIPE PAYMENTS (Test Mode)
# ============================================
STRIPE_PUBLIC_KEY=pk_test_51ABC123XYZlong...
STRIPE_SECRET_KEY=sk_test_51ABC123XYZlong...
STRIPE_WEBHOOK_SECRET=whsec_1ABC123XYZlong...

# ============================================
# SENDGRID EMAIL
# ============================================
SENDGRID_API_KEY=SG.ABC123XYZlongkey...
SENDGRID_FROM_EMAIL=noreply@washlee.com

# ============================================
# FIREBASE (Already Set - Don't Change!)
# ============================================
FIREBASE_PROJECT_ID=washlee-7d3c6
FIREBASE_CLIENT_EMAIL=fbsvc@washlee-7d3c6.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\nABC123XYZ...\n-----END PRIVATE KEY-----\n

FIREBASE_SECONDARY_PROJECT_ID=washlee-7d3c6
FIREBASE_SECONDARY_CLIENT_EMAIL=lukaverde@washlee-7d3c6.iam.gserviceaccount.com
FIREBASE_SECONDARY_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\nABC123XYZ...\n-----END PRIVATE KEY-----\n
```

---

## ✅ After You Add All Keys

**Step 1: Save the file**
- Cmd+S in VS Code
- Or Ctrl+X then Y then Enter in terminal

**Step 2: Restart dev server**
```bash
# In terminal, stop current server (Ctrl+C)

# Then restart:
cd /Users/lukaverde/Desktop/Website.BUsiness
npm run dev
```

**Step 3: Test each feature**
```
Maps:     http://localhost:3000/tracking
Payments: http://localhost:3000/booking
Emails:   Create an order and check email
```

---

## 🚨 Common Mistakes

### ❌ DON'T DO THIS:

```bash
# Wrong - quotes around key
GOOGLE_MAPS_API_KEY="AIzaSyD..."

# Wrong - space before key
STRIPE_PUBLIC_KEY= pk_test_...

# Wrong - spaces around =
SENDGRID_API_KEY = SG....

# Wrong - extra characters
STRIPE_SECRET_KEY=sk_test_... (but with text after)
```

### ✅ DO THIS:

```bash
# Correct - no quotes, no spaces
GOOGLE_MAPS_API_KEY=AIzaSyD...

# Correct - no space before key
STRIPE_PUBLIC_KEY=pk_test_...

# Correct - no spaces around =
SENDGRID_API_KEY=SG....

# Correct - just the key, nothing else
STRIPE_SECRET_KEY=sk_test_...
```

---

## 💡 Tips

### Copy Keys Correctly
- Go to the website
- Click "Copy" button if available
- If no button, triple-click to select all
- Cmd+C to copy
- Paste into .env.local

### Verify Keys are Correct
- Keys should have NO spaces before/after
- Keys should be the ENTIRE key (all the way to the end)
- Check by looking at the source website to see where key ends

### If Something Doesn't Work
1. Double-check the key is copied completely
2. Make sure there are no spaces around `=`
3. Save the file
4. Restart dev server (Ctrl+C, then npm run dev)
5. Try again

---

## 📊 Summary Table

| Service | Key Name | Format | Example |
|---------|----------|--------|---------|
| Google Maps | GOOGLE_MAPS_API_KEY | AIzaSy... | AIzaSyD4pnnQrW27dPz... |
| Stripe Public | STRIPE_PUBLIC_KEY | pk_test_... | pk_test_51Abc1234Xyz... |
| Stripe Secret | STRIPE_SECRET_KEY | sk_test_... | sk_test_51Abc1234Xyz... |
| Stripe Webhook | STRIPE_WEBHOOK_SECRET | whsec_... | whsec_1Abc1234Xyz... |
| SendGrid | SENDGRID_API_KEY | SG. | SG.Abc1234Xyz... |
| SendGrid Email | SENDGRID_FROM_EMAIL | email | noreply@washlee.com |

---

## 🎯 Bottom Line

1. **Read**: API_KEYS_GUIDE.md to understand where to GET each key
2. **Open**: .env.local file in VS Code
3. **Add**: Each key following the examples above
4. **Save**: Cmd+S
5. **Restart**: Dev server
6. **Test**: Each feature
7. **Done**: All APIs working!

Easy! 🚀

