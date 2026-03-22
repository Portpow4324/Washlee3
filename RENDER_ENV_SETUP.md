# Render Environment Variables Setup

The app is deployed on Render but needs environment variables to be configured in the Render dashboard.

## ⚠️ CRITICAL: The `.env.production` file is NOT automatically used by Render

Render reads environment variables ONLY from:
1. **Environment Variables** section in Render dashboard (individual key-value pairs)
2. **Secret Files** section in Render dashboard (for sensitive data)

## Steps to Fix

### 1. Go to Render Dashboard
- Visit https://dashboard.render.com
- Select your service: **Washlee3**
- Click on **Environment** tab

### 2. Add ALL Public Variables (NEXT_PUBLIC_* and others)

These are safe to add in the regular **Environment Variables** section:

```
NEXT_PUBLIC_SUPABASE_URL=https://hygktikkjggkgmlpxefp.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_M7zU5nmCC3iwQoZdvW8Abg_0edITDKI
NEXTAUTH_URL=https://washlee3-llqy.onrender.com
NEXTAUTH_SECRET=d0374b9080f47b494a67872ed2cc9dbd639e5d096291c061e26431ffb30d3d7f
NEXT_PUBLIC_APP_URL=https://washlee3-llqy.onrender.com
GOOGLE_CLIENT_ID=491756085305-5licuu7325qrjk6j2c6bujvg37p6tgou.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-actual-google-client-secret
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_51StlVu38bIfbwMU6AxPVmVw4LledOTJ81le8rNUeMH9cnvRDQ909bJ42iSWUFxxDvdkkMy5GkVB1yKbRXHatAd5y00epXjzqjo
STRIPE_SECRET_KEY=sk_test_51StlVu38bIfbwMU66Vdy3IvlwfktjMky1SCZGW3zbn6vMkLDmiTKEujUotCwLHD82grKjWWkiTHu9HwUHIIoVPqH000PkkLFjR
STRIPE_WEBHOOK_SECRET=whsec_3c7e7d2f76f5516a6a3af76017bce7ea106d9feed2ef64b0db0829f66da69902
NEXT_PUBLIC_API_URL=https://washlee3-llqy.onrender.com/api
GOOGLE_MAPS_API_KEY=AIzaSyDhKr9c9U9eftZeFzuKMVrd_JHxRYg21-E
GOOGLE_PLACES_API_KEY=AIzaSyDhKr9c9U9eftZeFzuKMVrd_JHxRYg21-E
NEXT_PUBLIC_OWNER_PASSWORD=washlee2025
GMAIL_USER=lukaverde045@gmail.com
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=lukaverde045@gmail.com
SMTP_FROM_EMAIL=lukaverde045@gmail.com
EMPLOYER_EMAIL=lukaverde045@gmail.com
SENDGRID_FROM_EMAIL=lukaverde045@gmail.com
```

### 3. Add Sensitive Data via Secret Files

Click **Secret Files** and create a new file named `.env.secrets`:

**File path:** `.env.secrets`
**Contents:**
```
SUPABASE_SERVICE_ROLE_KEY=sb_secret_qXA2QNAt019Aanc7kaopCg_QSTm7Gzb
GMAIL_APP_PASSWORD=qkvm umzs xals ogrf
SMTP_PASSWORD=qkvm umzs xals ogrf
SENDGRID_API_KEY=SG.JlFAT7zQxyroqTC1U0_yQ.VR8LVKlhopy8r6n5wWnxTGv8gSEvJm8ojjIXlFqt8fM
```

### 4. Redeploy

After adding all variables:
1. Click **Manual Deploy** or push a new commit
2. Wait for build to complete
3. Visit https://washlee3-llqy.onrender.com
4. Open browser DevTools → Console
5. Confirm no "Missing Supabase credentials" error

## Why This Matters

- `.env.production` is only read during local builds (`npm run build`)
- Render never reads local `.env*` files - it only reads variables you explicitly set
- `NEXT_PUBLIC_*` variables are embedded in the JavaScript bundle during build
- Server-side variables like `STRIPE_SECRET_KEY` are injected at runtime

## Troubleshooting

If you still see "Missing Supabase credentials" error:

1. **Check Render Dashboard** - Verify all variables are actually set (not just saved as draft)
2. **Redeploy** - Click "Manual Deploy" after adding variables
3. **Clear browser cache** - DevTools → Application → Cache Storage → Delete all
4. **Check Deploy Logs** - Look for "Build successful" in Render's deploy logs

If the error persists, the most likely cause is that the variables weren't saved properly in Render's dashboard.
