# WASHLEE AUTOMATED TEST SUITE - EXECUTION GUIDE

This guide provides complete instructions for running all automated tests on the Washlee platform.

## Quick Start

```bash
# Make script executable
chmod +x test-suite-automated.sh

# Run against local development server
API_URL=http://localhost:3000/api bash test-suite-automated.sh

# Run against production
API_URL=https://washlee3-llqy.onrender.com/api bash test-suite-automated.sh
```

## Test Execution Results

The script will:
1. ✅ Create a test customer account with email
2. ✅ Send and verify email confirmation
3. ✅ Send and verify phone confirmation (dev mode)
4. ✅ Authenticate and obtain Bearer token
5. ✅ Create loyalty card with initial tier
6. ✅ Fetch loyalty dashboard and verify tier benefits
7. ✅ Retrieve available subscription plans
8. ✅ Create subscription checkout session
9. ✅ Create order booking with details
10. ✅ Fetch user's orders
11. ✅ Get specific order tracking details
12. ✅ Modify order (reschedule)
13. ✅ Create payment checkout
14. ✅ Fetch payment history
15. ✅ Access admin panel (with password)
16. ✅ Test error scenarios (invalid tokens, missing fields, etc.)

## Output Interpretation

### Successful Test Output
```
✓ Customer signup successful (UID: abc123def45...)
✓ Email verification code sent
✓ Phone verification successful
✓ Login successful (Token: eyJhbGci...)
```

### Failed Test Output
```
✗ Customer signup failed: {"error": "Email already exists"}
✗ Phone verification failed: {"error": "Invalid code"}
```

## Environment Variables

```bash
# Override API base URL
export API_URL=http://localhost:3001/api

# Override Stripe secret key (for advanced tests)
export STRIPE_SECRET_KEY=sk_test_...

# Override admin password
export NEXT_PUBLIC_OWNER_PASSWORD=your_password
```

## Running Individual Feature Tests

See the feature-specific test scripts for detailed testing:
- `test-auth.sh` - Authentication flows
- `test-loyalty.sh` - Loyalty program
- `test-orders.sh` - Order creation and management
- `test-payments.sh` - Payment processing
- `test-admin.sh` - Admin operations

## Troubleshooting

### Connection Refused
```
curl: (7) Failed to connect to localhost port 3000: Connection refused
```
**Solution**: Ensure your Next.js dev server is running: `npm run dev`

### 401 Unauthorized
```
{"error": "Unauthorized"}
```
**Solution**: Token may be expired. Re-run signup/login part of tests.

### CORS Errors
```
Access to XMLHttpRequest blocked by CORS policy
```
**Solution**: Ensure CORS headers are properly configured in API routes.

### Rate Limiting
```
{"error": "Too many requests"}
```
**Solution**: Wait a few minutes before retrying. Add delay between requests if needed.

## Test Data Cleanup

Test data is automatically cleaned up after each run. For manual cleanup:

```bash
# Delete test user from Firebase
firebase auth delete [test-user-uid]

# Delete test orders from Firestore
firebase firestore:delete orders/[test-order-id]
```

## Advanced Testing

### Load Testing (5 concurrent users)
```bash
for i in {1..5}; do
  API_URL=http://localhost:3000/api bash test-suite-automated.sh &
done
wait
```

### Stress Testing with Custom Delay
```bash
# Add 100ms delay between API calls
API_URL=http://localhost:3000/api REQUEST_DELAY=100 bash test-suite-automated.sh
```

### Test Specific Features Only
```bash
# Edit test-suite-automated.sh and comment out unwanted feature tests
# Or create a custom test script combining specific tests
```

## Webhook Testing

The test suite doesn't test webhooks directly (requires ngrok/tunnel). 
To test webhooks locally:

```bash
# Install ngrok
brew install ngrok

# Start ngrok tunnel
ngrok http 3000

# Set webhook URL in Stripe dashboard to your ngrok URL
https://abc123.ngrok.io/api/webhooks/stripe

# Run tests - payment events should trigger webhooks
bash test-suite-automated.sh
```

## Integration with CI/CD

### GitHub Actions Example
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
      - run: sleep 5 && bash test-suite-automated.sh
```

## Success Criteria

All tests pass when:
- ✅ No 401/403 errors
- ✅ No 404 errors
- ✅ All required fields in responses
- ✅ Correct HTTP status codes (200, 201, 400, 401, etc.)
- ✅ No database corruption
- ✅ Loyalty tier calculations correct
- ✅ Payment amounts accurate
- ✅ Order status transitions valid

## Next Steps

1. **Monitor Production**: Set up continuous monitoring
2. **Performance Testing**: Add response time assertions
3. **Security Testing**: Add SQL injection and XSS tests
4. **Load Testing**: Configure for your expected traffic
5. **Compliance Testing**: Add data privacy validations
