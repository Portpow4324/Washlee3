# Quick Start: Rate Limiting Setup (5 Minutes)

## Step 1: Update Database (1 minute)
Go to: https://supabase.com/dashboard/project/hygktikkjggkgmlpxefp/sql

Copy and paste in SQL Editor:
```sql
-- Add whitelist table
CREATE TABLE IF NOT EXISTS public.rate_limit_whitelist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address TEXT NOT NULL UNIQUE,
  description TEXT,
  created_by UUID REFERENCES public.users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE
);

-- Add signup attempts tracking
CREATE TABLE IF NOT EXISTS public.signup_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address TEXT NOT NULL,
  email TEXT NOT NULL,
  success BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_rate_limit_whitelist_ip ON public.rate_limit_whitelist(ip_address);
CREATE INDEX IF NOT EXISTS idx_signup_attempts_ip ON public.signup_attempts(ip_address);
CREATE INDEX IF NOT EXISTS idx_signup_attempts_email ON public.signup_attempts(email);

-- Seed localhost for development
INSERT INTO public.rate_limit_whitelist (ip_address, description, is_active)
VALUES 
  ('127.0.0.1', 'Localhost development', true),
  ('::1', 'Localhost IPv6 development', true)
ON CONFLICT (ip_address) DO NOTHING;
```

Click "Run" ✓

## Step 2: Find Your IP (1 minute)
**If testing locally**: Use `127.0.0.1` (already whitelisted)

**If testing remotely**: 
- Visit: https://whatismyipaddress.com/
- Copy your IP address

## Step 3: Add Your IP to Whitelist (1 minute)
In SQL Editor, run:
```sql
INSERT INTO public.rate_limit_whitelist (ip_address, description)
VALUES ('YOUR_IP_HERE', 'My testing IP');
```

Replace `YOUR_IP_HERE` with your actual IP (e.g., `203.0.113.42`)

## Step 4: Update Code (2 minutes)
Install the rate limiting utility in your project (already done, just verify):

✓ `lib/rateLimitUtil.ts` exists
✓ `app/api/auth/signup/route.ts` imports it

## Step 5: Test (0 minutes - automatic)
Your signup now has rate limiting:
- ✓ Max 5 attempts per IP / hour
- ✓ Max 3 attempts per email / hour  
- ✓ Whitelisted IPs bypass limits
- ✓ All attempts logged

## That's It!

### What's Protected
✓ Spam prevention (5 per IP/hour)
✓ Email enumeration attacks (3 per email/hour)
✓ Brute force attacks
✓ Bot signups

### Still Required
✓ Email verification for Pro accounts
✓ Phone verification for Pro accounts
✓ Valid password requirements
✓ Email uniqueness

---

## Common Issues

### "Too many signup attempts"
**Fix**: Add your IP to whitelist
```sql
INSERT INTO public.rate_limit_whitelist (ip_address) VALUES ('YOUR_IP');
```

### What's my IP?
**For localhost**: `127.0.0.1`
**For remote**: Check https://whatismyipaddress.com/

### I want to test without limits
**Option 1** (Recommended): Whitelist your IP (done above)
**Option 2**: Edit `lib/rateLimitUtil.ts` change `maxAttemptsPerIP: 5` to `maxAttemptsPerIP: 10000`

### How do I monitor attempts?
```sql
SELECT ip_address, email, success, created_at
FROM public.signup_attempts
ORDER BY created_at DESC
LIMIT 20;
```

## Files Modified

- `lib/rateLimitUtil.ts` ← Rate limiting logic
- `app/api/auth/signup/route.ts` ← Integrated checks
- `COMPREHENSIVE_SCHEMA_COMPLETE.sql` ← Added tables

## Rate Limit Settings

Location: `lib/rateLimitUtil.ts`

To change limits:
```typescript
const defaultConfig: RateLimitConfig = {
  maxAttemptsPerIP: 5,           // ← Change this
  maxAttemptsPerEmail: 3,         // ← Or this
  windowDurationMinutes: 60,      // ← Or this (minutes)
  skipRateLimitForWhitelistedIPs: true
}
```

Example: Allow 10 per IP, 5 per email, per 24 hours:
```typescript
const defaultConfig: RateLimitConfig = {
  maxAttemptsPerIP: 10,
  maxAttemptsPerEmail: 5,
  windowDurationMinutes: 1440,    // 24 hours
  skipRateLimitForWhitelistedIPs: true
}
```

## Done ✓

Your signup is now protected from spam and has IP whitelisting for testing!
