#!/bin/bash

# Refund Email Testing Helper
# Usage: ./test_refund_email.sh <order_uuid> <user_uuid> <amount> <email> <name>

if [ $# -lt 5 ]; then
  echo "❌ Missing arguments"
  echo ""
  echo "Usage: ./test_refund_email.sh <order_uuid> <user_uuid> <amount> <email> <name>"
  echo ""
  echo "Example:"
  echo "  ./test_refund_email.sh a1b2c3d4-e5f6-7890-abcd-ef1234567890 f1a2b3c4-d5e6-f789-0abc-def123456789 45.50 john@example.com 'John Smith'"
  echo ""
  echo "📌 Get real UUIDs from Supabase:"
  echo "  SELECT o.id, o.user_id, o.total_price, u.email, u.first_name, u.last_name"
  echo "  FROM orders o JOIN users u ON o.user_id = u.id LIMIT 5;"
  exit 1
fi

ORDER_UUID=$1
USER_UUID=$2
AMOUNT=$3
EMAIL=$4
NAME=$5

echo "📧 Testing Refund Email System"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📝 Request Details:"
echo "  Order UUID: $ORDER_UUID"
echo "  User UUID:  $USER_UUID"
echo "  Amount:     \$$AMOUNT"
echo "  Email:      $EMAIL"
echo "  Name:       $NAME"
echo ""

echo "🚀 Sending request to: POST /api/refunds"
echo ""

RESPONSE=$(curl -s -X POST http://localhost:3000/api/refunds \
  -H "Content-Type: application/json" \
  -d "{
    \"orderId\": \"$ORDER_UUID\",
    \"userId\": \"$USER_UUID\",
    \"amount\": $AMOUNT,
    \"email\": \"$EMAIL\",
    \"customerName\": \"$NAME\",
    \"notes\": \"Test refund request\",
    \"paymentMethod\": \"credit_card\"
  }")

echo "📬 Response:"
echo "$RESPONSE" | jq . 2>/dev/null || echo "$RESPONSE"
echo ""

# Extract refund ID if successful
REFUND_ID=$(echo "$RESPONSE" | jq -r '.refundId' 2>/dev/null)

if [ "$REFUND_ID" != "null" ] && [ -n "$REFUND_ID" ]; then
  echo "✅ Refund Created Successfully!"
  echo ""
  echo "📌 Refund ID: $REFUND_ID"
  echo ""
  echo "📧 Emails should be sent to:"
  echo "  • Customer: $EMAIL"
  echo "  • Admin: lukaverde045@gmail.com"
  echo ""
  echo "⏱️  Check your inbox in ~5 seconds..."
  echo ""
  echo "📊 Check email status at:"
  echo "  🔗 https://resend.com/emails"
  echo ""
  echo "🔍 Query refund status:"
  echo "  curl http://localhost:3000/api/refunds?refundId=$REFUND_ID"
else
  echo "❌ Failed to create refund"
  echo ""
  echo "Troubleshooting:"
  echo "  1. Check order UUID exists: SELECT id FROM orders WHERE id = '$ORDER_UUID';"
  echo "  2. Check user UUID exists: SELECT id FROM users WHERE id = '$USER_UUID';"
  echo "  3. Verify email is valid format"
  echo "  4. Ensure refund_requests table exists in Supabase"
fi
