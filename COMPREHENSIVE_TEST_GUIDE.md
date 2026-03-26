# WASHLEE AUTOMATED TEST SUITE - QUICK START

## What You Have

Complete, fully automated terminal-based test suite for your Washlee platform that covers:

✅ **Authentication** (Signup, Email verification, Phone verification, Login)
✅ **Loyalty Program** (Card creation, Tier system, Credits, Discounts)
✅ **Orders** (Booking, Modification, Tracking, Real-time updates)
✅ **Payments & Subscriptions** (Checkout, History, Refunds, Plans)
✅ **Admin Panel** (User management, Order management, Analytics)
✅ **Error Scenarios** (Invalid tokens, Missing fields, Rate limits, etc.)

---

## Files Created

### Main Test Scripts
1. **`run-all-tests.sh`** - Master runner (executes all tests and generates report)
2. **`test-suite-automated.sh`** - Comprehensive end-to-end test (~500 lines)
3. **`test-auth.sh`** - Authentication feature tests
4. **`test-loyalty.sh`** - Loyalty program tests
5. **`test-orders.sh`** - Order management tests
6. **`test-payments.sh`** - Payment & subscription tests
7. **`test-admin.sh`** - Admin panel tests

### Documentation
1. **`API_REFERENCE_COMPLETE.md`** - 100+ API endpoints with curl examples
2. **`TEST_EXECUTION_GUIDE.md`** - Comprehensive testing documentation
3. **`COMPREHENSIVE_TEST_GUIDE.md`** - This file

---

## Quick Start (3 Steps)

### Step 1: Make scripts executable
```bash
chmod +x test-*.sh run-all-tests.sh
```

### Step 2: Run master test suite
```bash
# Against local dev server (http://localhost:3000)
bash run-all-tests.sh

# Against production
API_URL=https://washlee3-llqy.onrender.com/api bash run-all-tests.sh
```

### Step 3: Review results
```bash
# Report is saved as TEST_REPORT_YYYY-MM-DD_HH-MM-SS.txt
cat TEST_REPORT_*.txt
```

---

## Running Individual Feature Tests

```bash
# Test just authentication
bash test-auth.sh

# Test just loyalty program
bash test-loyalty.sh

# Test just orders
bash test-orders.sh

# Test just payments
bash test-payments.sh

# Test just admin panel
bash test-admin.sh

# Or run comprehensive suite
bash test-suite-automated.sh
```

---

## Test Execution Flow

### Complete End-to-End Flow (test-suite-automated.sh)
```
1. Create customer account
2. Send email verification
3. Send phone verification code (dev mode returns code)
4. Verify phone code
5. Login & get auth token
6. Create loyalty card
7. Fetch loyalty dashboard
8. Verify tier benefits
9. Get subscription plans
10. Create subscription checkout
11. Create order
12. Fetch user's orders
13. Get order details & tracking
14. Create payment checkout
15. Get payment history
16. Login as admin
17. Fetch all users & orders
18. Test error scenarios (invalid tokens, missing fields)
```

---

## Environment Variables

```bash
# Set API URL (defaults to http://localhost:3000/api)
export API_URL=https://washlee3-llqy.onrender.com/api

# Set Stripe test key
export STRIPE_SECRET_KEY=sk_test_...

# Set admin password
export NEXT_PUBLIC_OWNER_PASSWORD=washlee2025
```

---

## Example: Running Full Test Suite Locally

```bash
# Start your dev server in one terminal
npm run dev

# In another terminal, run tests
cd /Users/lukaverde/Desktop/Website.BUsiness
bash run-all-tests.sh
```

---

## Example: Running Against Production

```bash
API_URL=https://washlee3-llqy.onrender.com/api bash run-all-tests.sh
```

---

## Test Output Examples

### Successful Test
```
✓ Customer signup successful (UID: abc123def456...)
✓ Email verification code sent
✓ Phone verification successful
✓ Login successful (Token: eyJhbGci...)
✓ Loyalty card created (WASH-1234567890)
✓ Order created successfully (Order ID: order_xyz...)
```

### Failed Test
```
✗ Customer signup failed: {"error": "Email already exists"}
✗ Phone verification failed: {"error": "Invalid code"}
```

---

## Test Reports

Each test run generates a detailed report:

```
TEST_REPORT_2026-03-26_10-30-45.txt
```

Reports include:
- ✓ Passed tests count
- ✗ Failed tests count
- Detailed results for each test
- Full API responses
- Timestamps for each test
- Success rate percentage

---

## Validations Performed

### Authentication Tests
- ✅ Valid signup with all fields
- ✅ Email/phone verification flow
- ✅ Successful login with credentials
- ✅ Token refresh mechanism
- ❌ Invalid token rejection
- ❌ Duplicate email detection
- ❌ Missing password validation

### Loyalty Program Tests
- ✅ Card creation with unique number
- ✅ Dashboard retrieval with tier info
- ✅ Tier system structure (Bronze/Silver/Gold/Platinum)
- ✅ Discount application
- ✅ Credits calculation
- ✅ Tier benefit listing

### Order Tests
- ✅ Order creation with all details
- ✅ Order listing for user
- ✅ Order detail retrieval
- ✅ Order modification (reschedule)
- ✅ Real-time tracking info
- ❌ Invalid order rejection

### Payment Tests
- ✅ Subscription plan retrieval
- ✅ Checkout session creation
- ✅ Payment history fetching
- ✅ Refund processing
- ✅ Payment status tracking
- ✅ Amount calculation accuracy

### Admin Tests
- ✅ Admin authentication
- ✅ User management (list, filter)
- ✅ Order management (list, update)
- ✅ Analytics retrieval
- ✅ Status update operations
- ❌ Unauthorized access rejection

### Error Scenarios
- ✅ Invalid token rejection (401)
- ✅ Missing field validation (400)
- ✅ Not found handling (404)
- ✅ Duplicate entry detection (409)
- ✅ Rate limiting handling (429)

---

## API Endpoints Tested (100+)

All endpoints are covered in `API_REFERENCE_COMPLETE.md` with:
- Full endpoint path & HTTP method
- Required headers & authentication
- Example request payloads
- Success response format
- Error response handling
- HTTP status codes

---

## Troubleshooting

### Issue: "Connection refused"
**Cause**: Dev server not running
**Solution**: `npm run dev` in your project directory

### Issue: "401 Unauthorized"
**Cause**: Invalid or expired token
**Solution**: Tests create new token automatically

### Issue: "CORS errors"
**Cause**: CORS not configured correctly
**Solution**: Check API route CORS headers

### Issue: "Rate limited (429)"
**Cause**: Too many requests in short time
**Solution**: Wait a few minutes, or add delays in tests

### Issue: Database connection errors
**Cause**: Firebase/Supabase not accessible
**Solution**: Check .env.local variables

---

## Advanced Testing

### Load Testing (5 concurrent users)
```bash
for i in {1..5}; do
  API_URL=http://localhost:3000/api bash test-suite-automated.sh &
done
wait
```

### Stress Testing (30 orders in parallel)
```bash
for i in {1..30}; do
  API_URL=http://localhost:3000/api bash test-orders.sh &
done
wait
```

### Continuous Testing (every hour)
```bash
while true; do
  bash run-all-tests.sh
  sleep 3600
done
```

---

## Integration with CI/CD

### GitHub Actions
```yaml
name: API Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: npm install
      - run: npm run build
      - run: npm run dev &
      - run: sleep 5 && bash run-all-tests.sh
```

### GitLab CI
```yaml
test-api:
  stage: test
  script:
    - npm install
    - npm run build
    - npm run dev &
    - sleep 5
    - bash run-all-tests.sh
```

---

## Success Criteria

✅ **All tests pass when**:
- No 401/403 errors
- All required response fields present
- Correct HTTP status codes returned
- No database corruption
- Loyalty calculations correct
- Payment amounts accurate
- Order status transitions valid
- Admin operations restricted properly

---

## Test Data

Tests automatically:
- Generate unique test email addresses
- Create temporary test users
- Clean up after completion (optional)
- Use Stripe test keys
- Use dev mode for phone verification (returns code in response)

---

## Performance Metrics

Tests measure:
- Response times
- Database query performance
- Payment processing speed
- Token generation time
- Admin operation latency

---

## Security Testing

Tests validate:
- Authentication enforcement (401 on missing token)
- Authorization enforcement (403 on insufficient permissions)
- Input validation (400 on invalid data)
- SQL injection prevention
- XSS prevention
- CSRF protection

---

## Next Steps

1. **Run tests locally**: `bash run-all-tests.sh`
2. **Review API reference**: `open API_REFERENCE_COMPLETE.md`
3. **Check test execution guide**: `open TEST_EXECUTION_GUIDE.md`
4. **Integrate into CI/CD**: Add GitHub Actions workflow
5. **Monitor production**: Set up continuous testing
6. **Collect metrics**: Track response times & success rates

---

## Support

For detailed API information, see:
- `API_REFERENCE_COMPLETE.md` - Complete endpoint documentation
- `TEST_EXECUTION_GUIDE.md` - Testing procedures & troubleshooting
- Individual test scripts - Implementation examples

---

**Ready to test? Run:**
```bash
bash run-all-tests.sh
```
