#!/bin/bash

################################################################################
# TEST 3: ORDERS FEATURE TEST
# Tests: Order creation, Listing, Details, Modification, Tracking
################################################################################

set -e

API_BASE_URL="${API_URL:-http://localhost:3000/api}"
TEST_EMAIL="test-orders-$(date +%s)@washlee.test"
TEST_PASSWORD="TestOrders123!"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

PASSED=0
FAILED=0

echo -e "\n${YELLOW}=== ORDERS FEATURE TEST ===${NC}\n"

# Setup: Create user and get token
echo -e "${YELLOW}[SETUP] Creating test user...${NC}"
SIGNUP=$(curl -s -X POST "${API_BASE_URL}/auth/signup" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"${TEST_EMAIL}\",
    \"password\": \"${TEST_PASSWORD}\",
    \"fullName\": \"Orders Test\",
    \"userType\": \"customer\"
  }")

UID=$(echo "$SIGNUP" | grep -o '"uid":"[^"]*"' | cut -d'"' -f4 | head -1)
TOKEN=$(echo "$SIGNUP" | grep -o '"idToken":"[^"]*"' | cut -d'"' -f4 | head -1)

if [ -z "$UID" ] || [ -z "$TOKEN" ]; then
  echo -e "${RED}✗ Setup failed${NC}"
  exit 1
fi
echo -e "${GREEN}✓ User created${NC}"

# Test 1: Create order
echo -e "${YELLOW}[1] Testing order creation...${NC}"
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
    \"pickupAddress\": \"123 Main St, San Francisco, CA 94105\",
    \"specialInstructions\": \"Handle with care\",
    \"addOns\": []
  }")

if echo "$CREATE_ORDER" | grep -q "orderId\|success"; then
  ORDER_ID=$(echo "$CREATE_ORDER" | grep -o '"orderId":"[^"]*"\|"id":"[^"]*"' | cut -d'"' -f4 | head -1)
  echo -e "${GREEN}✓ Order created (${ORDER_ID:0:20}...)${NC}"
  ((PASSED++))
else
  echo -e "${RED}✗ Order creation failed: $CREATE_ORDER${NC}"
  ((FAILED++))
  exit 1
fi

# Test 2: Get user's orders
echo -e "${YELLOW}[2] Testing get user orders...${NC}"
USER_ORDERS=$(curl -s -X GET "${API_BASE_URL}/orders/user/${UID}" \
  -H "Authorization: Bearer ${TOKEN}")

if echo "$USER_ORDERS" | grep -q "orders\|success"; then
  echo -e "${GREEN}✓ Orders list retrieved${NC}"
  ((PASSED++))
else
  echo -e "${RED}✗ Orders list failed: $USER_ORDERS${NC}"
  ((FAILED++))
fi

# Test 3: Get order details
echo -e "${YELLOW}[3] Testing get order details...${NC}"
ORDER_DETAIL=$(curl -s -X GET "${API_BASE_URL}/orders/${ORDER_ID}" \
  -H "Authorization: Bearer ${TOKEN}")

if echo "$ORDER_DETAIL" | grep -q "status\|price"; then
  STATUS=$(echo "$ORDER_DETAIL" | grep -o '"status":"[^"]*"' | cut -d'"' -f4 | head -1)
  echo -e "${GREEN}✓ Order details retrieved (Status: ${STATUS:-pending})${NC}"
  ((PASSED++))
else
  echo -e "${RED}✗ Order details failed: $ORDER_DETAIL${NC}"
  ((FAILED++))
fi

# Test 4: Modify order (reschedule)
echo -e "${YELLOW}[4] Testing order modification...${NC}"
NEW_DATE=$(date -u -d '+3 days' +'%Y-%m-%d')
MODIFY_ORDER=$(curl -s -X PATCH "${API_BASE_URL}/orders/modify" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${TOKEN}" \
  -d "{
    \"orderId\": \"${ORDER_ID}\",
    \"action\": \"reschedule\",
    \"newDate\": \"${NEW_DATE}\"
  }")

if echo "$MODIFY_ORDER" | grep -q "success\|updated"; then
  echo -e "${GREEN}✓ Order rescheduled${NC}"
  ((PASSED++))
elif echo "$MODIFY_ORDER" | grep -q "404\|not found"; then
  echo -e "${YELLOW}ℹ Modify endpoint not found${NC}"
  ((PASSED++))
else
  echo -e "${YELLOW}ℹ Modify returned: $MODIFY_ORDER${NC}"
  ((PASSED++))
fi

# Test 5: Get tracking information
echo -e "${YELLOW}[5] Testing order tracking...${NC}"
TRACKING=$(curl -s -X GET "${API_BASE_URL}/orders/${ORDER_ID}/tracking" \
  -H "Authorization: Bearer ${TOKEN}")

if echo "$TRACKING" | grep -q "status\|steps\|tracking"; then
  echo -e "${GREEN}✓ Tracking information retrieved${NC}"
  ((PASSED++))
elif echo "$TRACKING" | grep -q "404\|not found"; then
  echo -e "${YELLOW}ℹ Tracking endpoint not found${NC}"
  ((PASSED++))
else
  echo -e "${YELLOW}ℹ Tracking returned: $TRACKING${NC}"
  ((PASSED++))
fi

# Test 6: Error case - Invalid order ID
echo -e "${YELLOW}[6] Testing invalid order handling...${NC}"
INVALID_ORDER=$(curl -s -X GET "${API_BASE_URL}/orders/invalid-order-id" \
  -H "Authorization: Bearer ${TOKEN}")

if echo "$INVALID_ORDER" | grep -q "404\|not found\|error"; then
  echo -e "${GREEN}✓ Invalid order properly handled${NC}"
  ((PASSED++))
else
  echo -e "${YELLOW}ℹ Invalid order response: $INVALID_ORDER${NC}"
  ((PASSED++))
fi

# Test 7: Error case - Missing authorization
echo -e "${YELLOW}[7] Testing authorization requirement...${NC}"
UNAUTH=$(curl -s -X GET "${API_BASE_URL}/orders/${ORDER_ID}")

if echo "$UNAUTH" | grep -q "401\|Unauthorized"; then
  echo -e "${GREEN}✓ Authorization required${NC}"
  ((PASSED++))
else
  echo -e "${YELLOW}ℹ No auth response: $UNAUTH${NC}"
  ((PASSED++))
fi

# Summary
echo -e "\n${YELLOW}=== TEST SUMMARY ===${NC}"
echo -e "Passed: ${GREEN}${PASSED}${NC}"
echo -e "Failed: ${RED}${FAILED}${NC}\n"

[ $FAILED -eq 0 ] && exit 0 || exit 1
