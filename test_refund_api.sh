#!/bin/bash

# Test the refund API with proper error handling

echo "🧪 Testing Refund API..."
echo ""

# Test 1: Missing required fields
echo "Test 1: Missing required fields (should fail with 400)"
curl -s -X POST http://localhost:3000/api/refunds \
  -H "Content-Type: application/json" \
  -d '{"orderId": "test"}' | jq . || echo "Request failed"
echo ""
echo "---"
echo ""

# Test 2: Invalid UUID format
echo "Test 2: Invalid UUID format (should fail with 22P02)"
curl -s -X POST http://localhost:3000/api/refunds \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "not-a-uuid",
    "userId": "also-not-uuid",
    "amount": 45.50,
    "email": "test@example.com",
    "customerName": "Test User"
  }' | jq . || echo "Request failed"
echo ""
echo "---"
echo ""

echo "✅ To test with real data, you need actual order and user UUIDs from your database"
echo ""
echo "Get a real order UUID:"
echo "  SELECT id, user_id FROM orders LIMIT 1;"
echo ""
echo "Then use those UUIDs in your curl request"
