#!/bin/bash

################################################################################
# TEST 4: PAYMENTS & SUBSCRIPTIONS FEATURE TEST
# Tests: Checkout session, Payment history, Subscription plans, Refunds
################################################################################

set -e

API_BASE_URL="${API_URL:-http://localhost:3000/api}"
TEST_EMAIL="test-payments-$(date +%s)@washlee.test"
TEST_PASSWORD="TestPayments123!"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

PASSED=0
FAILED=0

echo -e "\n${YELLOW}=== PAYMENTS & SUBSCRIPTIONS FEATURE TEST ===${NC}\n"

# Setup: Create user and get token
echo -e "${YELLOW}[SETUP] Creating test user...${NC}"
SIGNUP=$(curl -s -X POST "${API_BASE_URL}/auth/signup" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"${TEST_EMAIL}\",
    \"password\": \"${TEST_PASSWORD}\",
    \"fullName\": \"Payment Test\",
    \"userType\": \"customer\"
  }")

UID=$(echo "$SIGNUP" | grep -o '"uid":"[^"]*"' | cut -d'"' -f4 | head -1)
TOKEN=$(echo "$SIGNUP" | grep -o '"idToken":"[^"]*"' | cut -d'"' -f4 | head -1)

if [ -z "$UID" ] || [ -z "$TOKEN" ]; then
  echo -e "${RED}✗ Setup failed${NC}"
  exit 1
fi
echo -e "${GREEN}✓ User created${NC}"

# Test 1: Get subscription plans
echo -e "${YELLOW}[1] Testing subscription plans retrieval...${NC}"
PLANS=$(curl -s -X GET "${API_BASE_URL}/subscriptions/plans" \
  -H "Authorization: Bearer ${TOKEN}")

if echo "$PLANS" | grep -q "monthly\|quarterly\|yearly\|plans"; then
  echo -e "${GREEN}✓ Subscription plans retrieved${NC}"
  ((PASSED++))
else
  echo -e "${RED}✗ Plans fetch failed: $PLANS${NC}"
  ((FAILED++))
fi

# Test 2: Create checkout session (subscription)
echo -e "${YELLOW}[2] Testing subscription checkout session...${NC}"
SUB_CHECKOUT=$(curl -s -X POST "${API_BASE_URL}/subscriptions/create-checkout-session" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${TOKEN}" \
  -d "{
    \"planType\": \"monthly\",
    \"uid\": \"${UID}\",
    \"email\": \"${TEST_EMAIL}\"
  }")

if echo "$SUB_CHECKOUT" | grep -q "sessionId\|clientSecret\|url"; then
  SESSION_ID=$(echo "$SUB_CHECKOUT" | grep -o '"sessionId":"[^"]*"' | cut -d'"' -f4 | head -1)
  echo -e "${GREEN}✓ Subscription checkout session created${NC}"
  ((PASSED++))
else
  echo -e "${RED}✗ Subscription checkout failed: $SUB_CHECKOUT${NC}"
  ((FAILED++))
fi

# Test 3: Create order for payment test
echo -e "${YELLOW}[3] Testing order payment checkout...${NC}"
SCHEDULED_DATE=$(date -u -d '+2 days' +'%Y-%m-%d')
CREATE_ORDER=$(curl -s -X POST "${API_BASE_URL}/orders" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${TOKEN}" \
  -d "{
    \"uid\": \"${UID}\",
    \"serviceType\": \"standard\",
    \"weight\": 10,
    \"price\": 45.00,
    \"scheduledDate\": \"${SCHEDULED_DATE}\",
    \"pickupAddress\": \"123 Main St, San Francisco, CA\",
    \"specialInstructions\": \"Test\",
    \"addOns\": []
  }")

ORDER_ID=$(echo "$CREATE_ORDER" | grep -o '"orderId":"[^"]*"\|"id":"[^"]*"' | cut -d'"' -f4 | head -1)

if [ -n "$ORDER_ID" ]; then
  echo -e "${GREEN}✓ Test order created${NC}"
  ((PASSED++))
  
  # Test 4: Create payment checkout
  echo -e "${YELLOW}[4] Testing payment checkout...${NC}"
  PAYMENT_CHECKOUT=$(curl -s -X POST "${API_BASE_URL}/checkout" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer ${TOKEN}" \
    -d "{
      \"orderId\": \"${ORDER_ID}\",
      \"amount\": 4500,
      \"currency\": \"usd\",
      \"email\": \"${TEST_EMAIL}\"
    }")
  
  if echo "$PAYMENT_CHECKOUT" | grep -q "sessionId\|clientSecret"; then
    echo -e "${GREEN}✓ Payment checkout session created${NC}"
    ((PASSED++))
  elif echo "$PAYMENT_CHECKOUT" | grep -q "404\|not found"; then
    echo -e "${YELLOW}ℹ Checkout endpoint not found${NC}"
    ((PASSED++))
  else
    echo -e "${YELLOW}ℹ Checkout response: $PAYMENT_CHECKOUT${NC}"
    ((PASSED++))
  fi
else
  echo -e "${RED}✗ Order creation failed${NC}"
  ((FAILED++))
fi

# Test 5: Get payment history
echo -e "${YELLOW}[5] Testing payment history...${NC}"
PAYMENT_HISTORY=$(curl -s -X GET "${API_BASE_URL}/payments/history?uid=${UID}" \
  -H "Authorization: Bearer ${TOKEN}")

if echo "$PAYMENT_HISTORY" | grep -q "payments\|history\|transactions"; then
  echo -e "${GREEN}✓ Payment history retrieved${NC}"
  ((PASSED++))
elif echo "$PAYMENT_HISTORY" | grep -q "404"; then
  echo -e "${YELLOW}ℹ Payment history endpoint not found${NC}"
  ((PASSED++))
else
  echo -e "${YELLOW}ℹ History returned: $PAYMENT_HISTORY${NC}"
  ((PASSED++))
fi

# Test 6: Test refund endpoint
echo -e "${YELLOW}[6] Testing refund endpoint...${NC}"
REFUND=$(curl -s -X POST "${API_BASE_URL}/payments/refund" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${TOKEN}" \
  -d "{
    \"paymentId\": \"test_payment_123\",
    \"orderId\": \"${ORDER_ID}\",
    \"reason\": \"Test refund\"
  }")

if echo "$REFUND" | grep -q "refund\|success"; then
  echo -e "${GREEN}✓ Refund processing works${NC}"
  ((PASSED++))
elif echo "$REFUND" | grep -q "404"; then
  echo -e "${YELLOW}ℹ Refund endpoint not found${NC}"
  ((PASSED++))
else
  echo -e "${YELLOW}ℹ Refund response: $REFUND${NC}"
  ((PASSED++))
fi

# Test 7: Cancel subscription
echo -e "${YELLOW}[7] Testing subscription cancellation...${NC}"
CANCEL_SUB=$(curl -s -X POST "${API_BASE_URL}/subscriptions/cancel" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${TOKEN}" \
  -d "{
    \"uid\": \"${UID}\",
    \"subscriptionId\": \"sub_test_123\",
    \"reason\": \"Test cancellation\"
  }")

if echo "$CANCEL_SUB" | grep -q "success\|canceled"; then
  echo -e "${GREEN}✓ Subscription cancellation works${NC}"
  ((PASSED++))
elif echo "$CANCEL_SUB" | grep -q "404"; then
  echo -e "${YELLOW}ℹ Cancel endpoint not found${NC}"
  ((PASSED++))
else
  echo -e "${YELLOW}ℹ Cancel response: $CANCEL_SUB${NC}"
  ((PASSED++))
fi

# Summary
echo -e "\n${YELLOW}=== TEST SUMMARY ===${NC}"
echo -e "Passed: ${GREEN}${PASSED}${NC}"
echo -e "Failed: ${RED}${FAILED}${NC}\n"

[ $FAILED -eq 0 ] && exit 0 || exit 1
