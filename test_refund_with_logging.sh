#!/bin/bash

echo "📧 Testing Refund API Email Sending"
echo "Testing with VALID UUIDs..."
echo ""

# Generate valid UUIDs for testing
USER_UUID="550e8400-e29b-41d4-a716-446655440000"
ORDER_UUID="550e8400-e29b-41d4-a716-446655440001"

echo "Request Details:"
echo "  User UUID: $USER_UUID"
echo "  Order UUID: $ORDER_UUID"
echo "  Amount: $45.50"
echo "  Email: testuser@example.com"
echo ""

# Send the request
RESPONSE=$(curl -s -X POST http://localhost:3000/api/refunds \
  -H "Content-Type: application/json" \
  -d "{
    \"orderId\": \"$ORDER_UUID\",
    \"userId\": \"$USER_UUID\",
    \"amount\": 45.50,
    \"email\": \"testuser@example.com\",
    \"customerName\": \"Test Customer\",
    \"notes\": \"Product damaged during delivery\",
    \"paymentMethod\": \"credit_card\",
    \"transactionId\": \"txn_test_123\"
  }")

echo "Response:"
echo "$RESPONSE" | jq . 2>/dev/null || echo "$RESPONSE"
echo ""
echo "✅ Check your terminal output above for '[RefundAPI]' logs showing email sending"
echo ""
echo "Also check:"
echo "  - Resend dashboard: https://resend.com/emails"
echo "  - Gmail inbox: lukaverde045@gmail.com (for both customer & admin emails)"
echo "  - Spam/Promotions folder if you don't see it"

