# Rate Limiting & IP Whitelist Guide

## Overview
- **Rate Limiting Active**: 5 signup attempts per IP / 3 per email per hour
- **IP Whitelisting**: Certain IPs bypass rate limits (useful for testing)
- **Logging**: All signup attempts tracked in `signup_attempts` table
- **No Admin Bypass**: Everyone goes through rate limiting (unless whitelisted)

## How It Works

### For Regular Users
```
User submits signup → Rate limit check → If within limit → Create account
                    ↓
               If exceeded → Return 429 error
```

### For Whitelisted IPs (Testing)
```
User submits signup → Is IP whitelisted? → YES → Skip rate limit → Create account
                                       ↓ NO
                    Check signup count → If exceeded → Return 429 error
```

## Managing the Whitelist

### Check Current Whitelisted IPs
```sql
SELECT ip_address, description, is_active 
FROM public.rate_limit_whitelist 
WHERE is_active = true;
```

### Add Your Testing IP
```sql
INSERT INTO public.rate_limit_whitelist (ip_address, description, is_active)
VALUES ('YOUR_IP_HERE', 'Local testing or office network', true);
```

Example:
```sql
INSERT INTO public.rate_limit_whitelist (ip_address, description, is_active)
VALUES 
  ('192.168.1.100', 'Office network', true),
  ('203.0.113.42', 'QA testing machine', true),
  ('203.0.113.43', 'Dev server', true);
```

### Disable an IP
```sql
UPDATE public.rate_limit_whitelist 
SET is_active = false 
WHERE ip_address = 'IP_TO_DISABLE';
```

### Find Your IP
1. For local machine: `127.0.0.1` and `::1` are automatically whitelisted
2. For remote: Visit https://whatismyipaddress.com/ to find your IP
3. In your browser console: `fetch('https://api.ipify.org?format=json').then(r => r.json()).then(d => console.log(d.ip))`

## Rate Limit Configuration

Edit `lib/rateLimitUtil.ts` to adjust limits:

```typescript
const defaultConfig: RateLimitConfig = {
  maxAttemptsPerIP: 5,          // Max 5 attempts per IP
  maxAttemptsPerEmail: 3,        // Max 3 attempts per email
  windowDurationMinutes: 60,     // Per hour
  skipRateLimitForWhitelistedIPs: true
}
```

## Monitoring Signup Attempts

### View All Attempts (Last 24 Hours)
```sql
SELECT ip_address, email, success, created_at
FROM public.signup_attempts
WHERE created_at > NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC;
```

### View Failed Attempts (Rate Limited)
```sql
SELECT ip_address, email, COUNT(*) as failed_attempts, MAX(created_at) as last_attempt
FROM public.signup_attempts
WHERE success = false
  AND created_at > NOW() - INTERVAL '1 hour'
GROUP BY ip_address, email
HAVING COUNT(*) >= 5
ORDER BY failed_attempts DESC;
```

### Clear Old Attempts (Maintenance)
```sql
DELETE FROM public.signup_attempts
WHERE created_at < NOW() - INTERVAL '7 days';
```

## Signup Flow (Updated)

### Customer Signup
1. User enters email/password/name ✓
2. Rate limit check
   - If whitelisted IP: Skip limit → Create account
   - If not whitelisted: Check attempts → If OK → Create account
3. No phone verification required
4. Account active immediately

### Pro Signup
1. User enters email/password/name/phone
2. Rate limit check (same as above)
3. Send email confirmation via SendGrid
4. Require phone verification
5. Account active after both verified

## Troubleshooting

### "Too many signup attempts from this IP"
**Solution**: Add your IP to the whitelist
```sql
INSERT INTO public.rate_limit_whitelist (ip_address, description)
VALUES ('YOUR_IP', 'Testing');
```

### Still getting rate limited after whitelisting
**Check**:
1. Is the IP exactly correct? (No leading/trailing spaces)
2. Is `is_active` set to `true`?
3. Restart the Next.js dev server to clear any cached whitelist

```sql
SELECT * FROM public.rate_limit_whitelist WHERE is_active = true;
```

### Want to disable rate limiting temporarily
**Option 1**: Whitelist your IP (recommended)
**Option 2**: Set very high limits
```typescript
// In lib/rateLimitUtil.ts
const defaultConfig: RateLimitConfig = {
  maxAttemptsPerIP: 1000,
  maxAttemptsPerEmail: 1000,
  windowDurationMinutes: 1,
  skipRateLimitForWhitelistedIPs: true
}
```

## Security Notes

✓ Rate limiting prevents spam signups
✓ IP whitelisting allows testing without rate limits
✓ Phone verification still REQUIRED for Pro (no bypass)
✓ All attempts logged for monitoring
✓ Automatic cleanup of old data recommended
✓ No "admin bypass" - everyone follows the same rules

## API Response Codes

### Success
- **200**: Account created successfully

### Errors
- **400**: Missing required fields
- **409**: Email already registered
- **429**: Rate limited (too many attempts)
- **500**: Server error

Rate limit error example:
```json
{
  "error": "Too many signup attempts from this IP. Please try again in 60 minutes.",
  "code": "RATE_LIMITED",
  "retryAfter": 3600
}
```
