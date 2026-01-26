# 🔑 COMPLETE API KEY GUIDE - Step by Step

## Overview: What Keys You Need

You need **4 main API keys** to unlock all the features:

1. **Google Maps API** - For live order tracking with maps
2. **Stripe API** - For payment processing (customer checkout)
3. **SendGrid API** - For email delivery (order confirmations)
4. **Firebase** - Already set up, but you may need additional config

---

## 1️⃣ GOOGLE MAPS API KEY

### What It Does:
- Shows customer location on the tracking map
- Shows pro's current location in real-time
- Calculates routes and ETAs

### How to Get It (10 minutes):

**Step 1: Go to Google Cloud Console**
```
Visit: https://console.cloud.google.com
```

**Step 2: Create a New Project**
- Click "Select a Project" at the top
- Click "NEW PROJECT"
- Name it: "Washlee"
- Click CREATE

**Step 3: Wait for Project to Create**
- Takes about 30 seconds
- You'll see a notification when done

**Step 4: Enable Maps API**
- Search box at top: type "Maps JavaScript API"
- Click on it
- Click ENABLE button (blue button)
- Wait for it to enable (30 seconds)

**Step 5: Create API Key**
- Click "CREATE CREDENTIALS" button (blue)
- Choose "API Key"
- Copy the key shown (starts with `AIza...`)
- Click CLOSE

**Step 6: Restrict Your Key (Security)**
- Go back to credentials page
- Find your API key
- Click on it
- Under "Application restrictions":
  - Choose "HTTP referrers (websites)"
  - Add: `https://yourdomain.com/*`
  - Add: `http://localhost:3000/*` (for local testing)
- Click SAVE

**Step 7: Add to Your .env.local**
```bash
# Edit: /Users/lukaverde/Desktop/Website.BUsiness/.env.local

# Add this line:
GOOGLE_MAPS_API_KEY=AIzaSyD...your_actual_key...
```

### Testing It Works:
```bash
# Start dev server
npm run dev

# Visit tracking page
http://localhost:3000/tracking/1

# You should see a map appear
```

---

## 2️⃣ STRIPE API KEYS

### What It Does:
- Customers can pay for orders
- Refunds are processed
- Payment history is tracked

### How to Get It (15 minutes):

**Step 1: Go to Stripe**
```
Visit: https://stripe.com/start
```

**Step 2: Sign Up**
- Enter your email
- Create a password
- Click "Create account"
- Verify your email (check inbox)

**Step 3: Complete Profile**
- Business name: "Washlee"
- Business location: Select your country
- Website: (leave blank for now)
- Click "Continue"

**Step 4: Verify Phone Number**
- Enter your phone number
- You'll get a code via SMS
- Enter the code
- Click "Verify"

**Step 5: Go to API Keys**
- Click "Developers" in left menu
- Click "API keys"
- You'll see two sections:
  - **Standard keys** (for live transactions)
  - **Test keys** (for testing - free!)

**Step 6: Get Test Keys (Start with These!)**
- Find the "Test key" section
- You'll see two keys:
  - **Publishable key** (starts with `pk_test_`)
  - **Secret key** (starts with `sk_test_`)
- Copy both

**Step 7: Add to Your .env.local**
```bash
# Edit: /Users/lukaverde/Desktop/Website.BUsiness/.env.local

# Add these lines:
STRIPE_PUBLIC_KEY=pk_test_...your_publishable_key...
STRIPE_SECRET_KEY=sk_test_...your_secret_key...
STRIPE_WEBHOOK_SECRET=whsec_...we'll get this below...
```

**Step 8: Get Webhook Secret**
- In Stripe dashboard, go to "Developers" → "Webhooks"
- Click "Add endpoint"
- Endpoint URL: `https://yourdomain.com/api/webhooks/stripe`
  - For local testing: use ngrok or skip for now
- Select events to listen for:
  - `charge.succeeded`
  - `charge.failed`
  - `charge.refunded`
- Click "Add endpoint"
- Click the endpoint you just created
- Copy the "Signing secret" (starts with `whsec_`)
- Add to .env.local as `STRIPE_WEBHOOK_SECRET=whsec_...`

**Step 9: Get Test Card Numbers**
For testing payments without real money:
```
Card Number: 4242 4242 4242 4242
Expiration: Any future date (e.g., 12/25)
CVC: Any 3 digits (e.g., 123)
```

### Testing It Works:
```bash
# Make sure keys are in .env.local
# Restart dev server: npm run dev

# Visit checkout page
http://localhost:3000/booking

# Fill in order
# Go to checkout
# Use test card: 4242 4242 4242 4242
# Should succeed! ✅
```

### When You're Ready for Real Money:
1. Go back to Stripe
2. Click "Live" switch (instead of "Test")
3. Get the LIVE keys (starts with `pk_live_` and `sk_live_`)
4. Replace test keys in .env.local with LIVE keys
5. Deploy to production
6. Re-create webhook with your production URL

---

## 3️⃣ SENDGRID API KEY

### What It Does:
- Sends order confirmation emails
- Sends status update emails
- Sends receipt/invoice emails
- Can send marketing emails

### How to Get It (10 minutes):

**Step 1: Go to SendGrid**
```
Visit: https://sendgrid.com/free
```

**Step 2: Sign Up for Free**
- Click "Sign Up" or "Start for Free"
- Enter your email
- Create a password
- Click "Create Account"
- Verify your email (check inbox)

**Step 3: Answer Setup Questions**
- What will you use SendGrid for? → "Transactional"
- How many emails do you send? → "Less than 100 per day"
- (These are fine for starting out)

**Step 4: Go to API Keys**
- Click "Settings" in left menu
- Click "API Keys"
- Click "Create API Key" (blue button)
- Name it: "Washlee App"
- Access level: "Full Access" (or "Mail Send" minimum)
- Click "Create & View"
- **IMPORTANT: Copy this key immediately!** You can only see it once
- The key starts with `SG.`

**Step 5: Add to Your .env.local**
```bash
# Edit: /Users/lukaverde/Desktop/Website.BUsiness/.env.local

# Add these lines:
SENDGRID_API_KEY=SG.your_actual_key_here...
SENDGRID_FROM_EMAIL=noreply@washlee.com
```

**Step 6: Verify Sender Email**
- Go back to SendGrid
- Click "Settings" → "Sender Authentication"
- Click "Single Sender Verification"
- Click "Create New Sender"
- Fill in form:
  - From Name: "Washlee"
  - Email: your email (e.g., noreply@washlee.com)
- Click "Create"
- Check your email for verification link
- Click the link to verify
- Now that email is approved for sending!

### Testing It Works:
```bash
# Make sure key is in .env.local
# Restart dev server: npm run dev

# Create a test order
http://localhost:3000/booking

# Complete the order
# Check your email inbox
# Should receive confirmation email! ✅
```

### Important for Production:
- Verify your company domain for higher deliverability
- Set up SPF and DKIM records (SendGrid shows you how)
- Monitor bounce rate (keep it under 5%)
- Use branded sender address, not `noreply@`

---

## 4️⃣ FIREBASE CONFIG (Already Set Up)

### What You Need to Know:
Firebase is already configured! Your keys are in `.env.local`:

```bash
FIREBASE_PROJECT_ID=washlee-7d3c6
FIREBASE_CLIENT_EMAIL=...fbsvc...@...iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY=...private key...
```

### If You Need to Reconfigure:
```
Visit: https://console.firebase.google.com
Select your "washlee-7d3c6" project
Go to: Project Settings → Service Accounts
Regenerate keys if needed
Copy them to .env.local
```

---

## 📝 YOUR .env.local FILE

After getting all keys, your `.env.local` should look like:

```bash
# Google Maps
GOOGLE_MAPS_API_KEY=AIzaSyD...your_key...

# Stripe (Test Mode - Start Here!)
STRIPE_PUBLIC_KEY=pk_test_...your_key...
STRIPE_SECRET_KEY=sk_test_...your_key...
STRIPE_WEBHOOK_SECRET=whsec_...your_key...

# SendGrid
SENDGRID_API_KEY=SG....your_key...
SENDGRID_FROM_EMAIL=noreply@washlee.com

# Firebase (Already Set Up)
FIREBASE_PROJECT_ID=washlee-7d3c6
FIREBASE_CLIENT_EMAIL=...@...iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n
```

---

## ⚡ QUICK CHECKLIST

### Today (Get API Keys):
- [ ] Google Maps API Key (10 min)
  - Google Cloud Console
  - Create project
  - Enable Maps API
  - Create API key
  
- [ ] Stripe API Keys (15 min)
  - Create Stripe account
  - Get test keys (pk_test_ and sk_test_)
  - Get webhook secret (whsec_)
  
- [ ] SendGrid API Key (10 min)
  - Create SendGrid account
  - Create API key (SG....)
  - Verify sender email
  
- [ ] Add all to .env.local
  - Copy keys into .env.local
  - Save file

### This Week (Test Everything):
- [ ] Test maps on `/tracking` page
- [ ] Test payment with card 4242 4242 4242 4242
- [ ] Test email by creating an order
- [ ] Deploy to production

### Before Going Live:
- [ ] Switch Stripe from test to LIVE keys
- [ ] Update webhook URL to production
- [ ] Verify domain ownership in SendGrid
- [ ] Set up custom domain email

---

## 🚨 SECURITY TIPS

### NEVER DO THIS:
- ❌ Share your API keys with anyone
- ❌ Commit .env.local to GitHub
- ❌ Post keys in chat or emails
- ❌ Use live keys in development

### ALWAYS DO THIS:
- ✅ Keep keys in .env.local only
- ✅ Add .env.local to .gitignore
- ✅ Use test keys first, live keys later
- ✅ Rotate keys periodically
- ✅ Restrict keys to your domains

### If You Accidentally Expose a Key:
1. **Immediately regenerate it** in the service's dashboard
2. **Remove the old key** from your .env.local
3. **Add the new key** to .env.local
4. **Redeploy** your application
5. **No one can use the old key anymore**

---

## 💡 WHY EACH SERVICE?

| Service | Why | Cost | Status |
|---------|-----|------|--------|
| Google Maps | Live tracking with map | Free tier (1000/day) | Optional but cool |
| Stripe | Payment processing | 2.9% + $0.30/transaction | Essential for revenue |
| SendGrid | Email delivery | 100 free emails/day | Essential for UX |
| Firebase | Database & auth | Free tier generous | Already set up |

---

## 🔗 USEFUL LINKS

**Google Maps**:
- Console: https://console.cloud.google.com
- Documentation: https://developers.google.com/maps/documentation

**Stripe**:
- Dashboard: https://dashboard.stripe.com
- Test Cards: https://stripe.com/docs/testing
- Documentation: https://stripe.com/docs

**SendGrid**:
- Dashboard: https://app.sendgrid.com
- Documentation: https://sendgrid.com/docs

**Firebase**:
- Console: https://console.firebase.google.com
- Documentation: https://firebase.google.com/docs

---

## ❓ TROUBLESHOOTING

**Maps not showing?**
- Check key is in .env.local
- Verify domain is in API restrictions
- Check browser console for errors

**Payments not working?**
- Verify Stripe keys are correct
- Make sure you're using test keys (pk_test_)
- Check webhook secret is set
- Look for errors in Stripe dashboard

**Emails not sending?**
- Check SendGrid key is correct
- Verify sender email is verified
- Check spam folder
- Look for errors in SendGrid dashboard

**Still stuck?**
- Each service has great documentation
- Google the error message
- Check your .env.local file for typos
- Restart dev server after changes

---

## 🎯 NEXT STEPS

1. **Get the 3 API keys** (Google Maps, Stripe, SendGrid)
2. **Add them to .env.local**
3. **Restart dev server**: `npm run dev`
4. **Test each feature**:
   - Maps: Visit `/tracking`
   - Payments: Try checkout
   - Emails: Create an order
5. **Deploy to production** when ready
6. **Switch to live keys** for real money

---

## 📞 SUPPORT

If you get stuck on any of these:
1. Visit the service's official website
2. Look for "Get Started" or "Sign Up" button
3. Follow their official guide
4. Copy your key exactly (no spaces before/after)
5. Add to .env.local
6. Restart dev server

You've got this! All the services have great free tiers for getting started. 🚀

