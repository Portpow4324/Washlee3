# Error Handling & Security - Quick Reference

## 🚀 What Was Implemented

✅ **Input Validation** - Zod schemas for all API inputs
✅ **Rate Limiting** - Request limits per endpoint  
✅ **Error Handling** - Standardized error responses
✅ **Error Boundaries** - Component error catching

---

## 📁 New Files

| File | Purpose |
|------|---------|
| `components/ErrorBoundary.tsx` | Catch React component errors |
| `lib/validationSchemas.ts` | Zod validation schemas (15+ types) |
| `lib/apiUtils.ts` | Standardized response functions |
| `lib/middleware/rateLimit.ts` | Rate limiting middleware |

---

## 🔒 Rate Limits

```
checkout:      5 req/min   (payment processing)
payment:      10 req/min   (payment operations)
orders:       20 req/min   (order creation)
ordersList:   50 req/min   (listing orders)
addresses:    30 req/min   (address operations)
search:      100 req/min   (search/tracking)
login:         5 req/5min  (login attempts)
signup:        3 req/hour  (registration)
passwordReset: 3 req/hour  (password reset)
```

---

## ✨ Quick Examples

### Adding Validation to an API Route

```typescript
import { MySchema, validateData } from '@/lib/validationSchemas'
import { validationError, createdResponse, serverError } from '@/lib/apiUtils'
import { withRateLimit, rateLimits } from '@/lib/middleware/rateLimit'

export async function POST(request: NextRequest) {
  // 1️⃣ Rate Limit
  const { allowed, response } = withRateLimit(
    request,
    rateLimits.orders.max,
    rateLimits.orders.window
  )
  if (!allowed) return response!

  try {
    // 2️⃣ Validate
    const body = await request.json()
    const validation = validateData(MySchema, body)
    if (!validation.success) {
      return validationError('Invalid data', validation.error.flatten().fieldErrors)
    }

    // 3️⃣ Process
    const data = validation.data
    // ... your logic ...

    // 4️⃣ Respond
    return createdResponse({ id: '123' })
  } catch (error: any) {
    // 5️⃣ Handle Errors
    return serverError(error, 'Operation failed')
  }
}
```

### Creating a Validation Schema

```typescript
import { z } from 'zod'

export const MySchema = z.object({
  email: z.string().email('Invalid email'),
  age: z.number().min(18, 'Must be 18+'),
  type: z.enum(['customer', 'pro'] as const),
})

export type MyType = z.infer<typeof MySchema>
```

### Response Functions

```typescript
// Success
return successResponse({ id: '123' })           // 200
return createdResponse(data)                    // 201
return okResponse()                             // 204

// Client Errors
return validationError('Invalid', fieldErrors)  // 400
return unauthorizedError('Not authenticated')   // 401
return forbiddenError('Access denied')          // 403
return notFoundError('Not found')               // 404
return conflictError('Already exists')          // 409
return rateLimitError(60)                       // 429

// Server Errors
return serverError(error, 'Operation failed')   // 500
return databaseError('DB connection failed')    // 500
```

---

## 🧪 Testing

### Test Rate Limiting
```bash
# Make 6 requests to checkout endpoint (limit is 5/min)
# 6th request should get 429 error
```

### Test Validation
```bash
# Send invalid email to login
# Should get 400 with field errors

curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "invalid", "password": "test123"}'

# Response:
{
  "success": false,
  "error": "Invalid data",
  "details": {
    "email": ["Invalid email address"]
  }
}
```

### Test Error Boundary
```tsx
// Throw error in any component to test
throw new Error('Test error')

// Should see fallback UI instead of white screen
```

---

## 📊 Files Updated

| File | Changes |
|------|---------|
| `app/api/orders/route.ts` | ✅ Validation + Rate Limit |
| `app/api/checkout/route.ts` | ✅ Validation + Rate Limit |
| `app/api/payments/route.ts` | ✅ Validation + Rate Limit |
| `app/layout.tsx` | ✅ ErrorBoundary wrapper |

---

## ✅ Verification

```bash
# TypeScript - should show 0 errors
npx tsc --noEmit

# Build - should succeed
npm run build

# Dev - should start without errors
npm run dev
```

---

## 🐛 Debugging

### Check Validation Errors
```typescript
const validation = validateData(MySchema, body)
console.log(validation.error?.flatten())  // See all field errors
```

### Enable Rate Limit Logging
```typescript
// In rateLimit.ts, uncomment debug logs
console.log('[RATE-LIMIT] Checking:', key)
console.log('[RATE-LIMIT] Current count:', requests.length)
```

### Component Error Catching
```typescript
// Error boundary catches:
- Rendering errors
- Lifecycle method errors
- Constructor errors

// Does NOT catch:
- Event handler errors (use try/catch)
- Async code errors (use try/catch)
- Server-side errors (use API error handling)
```

---

## 🚀 Production Checklist

- [ ] All new files deployed
- [ ] Rate limits tuned for your traffic
- [ ] Error tracking enabled (Sentry, etc.)
- [ ] Validation errors tested
- [ ] Component errors tested
- [ ] Load testing completed
- [ ] Monitoring alerts configured
- [ ] Documentation updated

---

## 📞 Need Help?

1. **Validation Schema Issue?** → Check `lib/validationSchemas.ts`
2. **Rate Limit Not Working?** → Check `lib/middleware/rateLimit.ts`
3. **Wrong Error Format?** → Check `lib/apiUtils.ts`
4. **Component Crashing?** → Check `components/ErrorBoundary.tsx`

---

## 🔗 Related Documentation

- **Full Implementation**: `ERROR_HANDLING_SECURITY_IMPLEMENTATION.md`
- **Original Evaluation**: `PROJECT_EVALUATION_COMPREHENSIVE.md`
- **Security Fixes**: `ACTIONABLE_FIXES.md`

---

**Last Updated**: January 18, 2026
**Status**: ✅ Production Ready
