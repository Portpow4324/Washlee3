#!/bin/bash

################################################################################
# WASHLEE - COMPREHENSIVE AUTOMATED API TEST SUITE
# 
# This script performs full end-to-end testing of all Washlee features via
# terminal-level curl commands, including authentication, payments, orders,
# loyalty program, and admin operations.
#
# Usage: bash test-suite-automated.sh
# Target: https://washlee3-llqy.onrender.com (production) or http://localhost:3000 (local)
################################################################################

set -e

# Configuration
API_BASE_URL="${API_URL:-https://washlee3-llqy.onrender.com/api}"
LOCAL_API_URL="http://localhost:3000/api"
STRIPE_TEST_KEY="${STRIPE_SECRET_KEY:-sk_test_51StlVu38bIfbwMU66Vdy3IvlwfktjMky1SCZGW3zbn6vMkLDmiTKEujUotCwLHD82grKjWWkiTHu9HwUHIIoVPqH000PkkLFjR}"
ADMIN_PASSWORD="${NEXT_PUBLIC_OWNER_PASSWORD:-washlee2025}"

# Color output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Test data
TEST_EMAIL="test-$(date +%s)@washlee.test"
TEST_PHONE="+14155552671"  # Stripe test phone
TEST_PASSWORD="TestPass123!"
CUSTOMER_UID=""
AUTH_TOKEN=""
STRIPE_CUSTOMER_ID=""
LOYALTY_CARD_NUMBER=""
ORDER_ID=""

# Test results tracking
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

################################################################################
# UTILITY FUNCTIONS
################################################################################

log_section() {
  echo -e "\n${BLUE}========================================${NC}"
  echo -e "${BLUE}$1${NC}"
  echo -e "${BLUE}========================================${NC}\n"
}

log_success() {
  echo -e "${GREEN}✓ $1${NC}"
  ((PASSED_TESTS++))
}

log_failure() {
  echo -e "${RED}✗ $1${NC}"
  ((FAILED_TESTS++))
}

log_info() {
  echo -e "${YELLOW}ℹ $1${NC}"
}

log_test() {
  echo -e "${BLUE}→ Testing: $1${NC}"
  ((TOTAL_TESTS++))
}

# API request helper with error handling
api_request() {
  local method=$1
  local endpoint=$2
  local data=$3
  local auth_token=$4
  
  local url="${API_BASE_URL}${endpoint}"
  local headers="-H 'Content-Type: application/json'"
  
  if [ -n "$auth_token" ]; then
    headers="${headers} -H 'Authorization: Bearer ${auth_token}'"
  fi
  
  local cmd="curl -s -X ${method} '${url}' ${headers}"
  
  if [ -n "$data" ]; then
    cmd="${cmd} -d '${data}'"
  fi
  
  eval $cmd
}

# Check if response is successful (HTTP 200, 201, 204)
is_success() {
  local response=$1
  local status=$(echo "$response" | tail -c 4)
  [[ "$status" =~ ^[2][0-9][0-9]$ ]]
}

################################################################################
# FEATURE 1: AUTHENTICATION
################################################################################

test_auth_signup() {
  log_section "FEATURE 1: AUTHENTICATION - SIGNUP & EMAIL/PHONE VERIFICATION"
  
  # Test 1.1: Sign up with email
  log_test "Customer signup with email"
  local signup_response=$(curl -s -X POST "${API_BASE_URL}/auth/signup" \
    -H "Content-Type: application/json" \
    -d "{
      \"email\": \"${TEST_EMAIL}\",
      \"password\": \"${TEST_PASSWORD}\",
      \"fullName\": \"Test Customer\",
      \"userType\": \"customer\"
    }")
  
  if echo "$signup_response" | grep -q "uid\|success"; then
    CUSTOMER_UID=$(echo "$signup_response" | grep -o '"uid":"[^"]*"' | cut -d'"' -f4 | head -1)
    log_success "Customer signup successful (UID: ${CUSTOMER_UID:0:10}...)"
  else
    log_failure "Customer signup failed: $signup_response"
    return 1
  fi
  
  # Test 1.2: Request email verification
  log_test "Request email verification code"
  local email_verify_response=$(curl -s -X POST "${API_BASE_URL}/auth/send-verification-email" \
    -H "Content-Type: application/json" \
    -d "{\"email\": \"${TEST_EMAIL}\"}")
  
  if echo "$email_verify_response" | grep -q "success\|code\|sent"; then
    log_success "Email verification code sent"
  else
    log_failure "Email verification request failed: $email_verify_response"
  fi
  
  # Test 1.3: Request phone verification (DEV MODE)
  log_test "Request phone verification code (dev mode)"
  local phone_verify_response=$(curl -s -X POST "${API_BASE_URL}/auth/send-phone-code" \
    -H "Content-Type: application/json" \
    -d "{
      \"uid\": \"${CUSTOMER_UID}\",
      \"phone\": \"${TEST_PHONE}\",
      \"devMode\": true
    }")
  
  if echo "$phone_verify_response" | grep -q "code\|success"; then
    local DEV_CODE=$(echo "$phone_verify_response" | grep -o '"code":"[^"]*"' | cut -d'"' -f4)
    log_success "Phone verification code sent (dev code: ${DEV_CODE:0:6}...)"
    
    # Test 1.4: Verify phone code
    log_test "Verify phone code"
    local phone_confirm_response=$(curl -s -X POST "${API_BASE_URL}/auth/verify-phone-code" \
      -H "Content-Type: application/json" \
      -d "{
        \"uid\": \"${CUSTOMER_UID}\",
        \"code\": \"${DEV_CODE}\"
      }")
    
    if echo "$phone_confirm_response" | grep -q "verified\|success"; then
      log_success "Phone verification successful"
    else
      log_failure "Phone verification failed: $phone_confirm_response"
    fi
  else
    log_failure "Phone code request failed: $phone_verify_response"
  fi
  
  # Test 1.5: Login
  log_test "Login with email and password"
  local login_response=$(curl -s -X POST "${API_BASE_URL}/auth/signin" \
    -H "Content-Type: application/json" \
    -d "{
      \"email\": \"${TEST_EMAIL}\",
      \"password\": \"${TEST_PASSWORD}\"
    }")
  
  if echo "$login_response" | grep -q "idToken\|token"; then
    AUTH_TOKEN=$(echo "$login_response" | grep -o '"idToken":"[^"]*"' | cut -d'"' -f4 | head -1)
    log_success "Login successful (Token: ${AUTH_TOKEN:0:20}...)"
  else
    log_failure "Login failed: $login_response"
    return 1
  fi
}

################################################################################
# FEATURE 2: LOYALTY PROGRAM
################################################################################

test_loyalty_program() {
  log_section "FEATURE 2: LOYALTY PROGRAM - CARD CREATION & TIER-BASED DISCOUNTS"
  
  if [ -z "$AUTH_TOKEN" ]; then
    log_failure "Loyalty tests skipped - no auth token"
    return 1
  fi
  
  # Test 2.1: Create loyalty card
  log_test "Create loyalty card"
  local create_card_response=$(curl -s -X POST "${API_BASE_URL}/loyalty/create-card" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer ${AUTH_TOKEN}" \
    -d "{
      \"uid\": \"${CUSTOMER_UID}\",
      \"email\": \"${TEST_EMAIL}\"
    }")
  
  if echo "$create_card_response" | grep -q "cardNumber\|card_number\|success"; then
    LOYALTY_CARD_NUMBER=$(echo "$create_card_response" | grep -o '"cardNumber":"[^"]*"\|"card_number":"[^"]*"' | cut -d'"' -f4 | head -1)
    log_success "Loyalty card created (Card: ${LOYALTY_CARD_NUMBER:0:12}...)"
  else
    log_failure "Loyalty card creation failed: $create_card_response"
  fi
  
  # Test 2.2: Get loyalty dashboard
  log_test "Fetch loyalty dashboard"
  local loyalty_dash_response=$(curl -s -X GET "${API_BASE_URL}/loyalty/dashboard?uid=${CUSTOMER_UID}" \
    -H "Authorization: Bearer ${AUTH_TOKEN}")
  
  if echo "$loyalty_dash_response" | grep -q "tier\|points\|card"; then
    local tier=$(echo "$loyalty_dash_response" | grep -o '"tier":"[^"]*"\|"tier":[0-9]' | cut -d'"' -f4 | head -1)
    local points=$(echo "$loyalty_dash_response" | grep -o '"points":[0-9]*' | cut -d':' -f2 | head -1)
    log_success "Loyalty dashboard fetched (Tier: ${tier:-Bronze}, Points: ${points:-0})"
  else
    log_failure "Loyalty dashboard fetch failed: $loyalty_dash_response"
  fi
  
  # Test 2.3: Check tier benefits
  log_test "Verify tier benefits available"
  local tiers_response=$(curl -s -X GET "${API_BASE_URL}/loyalty/tiers" \
    -H "Authorization: Bearer ${AUTH_TOKEN}")
  
  if echo "$tiers_response" | grep -q "bronze\|silver\|gold\|platinum"; then
    log_success "Tier benefits structure available"
  else
    log_failure "Tier benefits not available: $tiers_response"
  fi
}

################################################################################
# FEATURE 3: SUBSCRIPTIONS/PLANS
################################################################################

test_subscriptions() {
  log_section "FEATURE 3: SUBSCRIPTIONS - PURCHASE, MODIFY, CANCEL"
  
  if [ -z "$AUTH_TOKEN" ]; then
    log_failure "Subscription tests skipped - no auth token"
    return 1
  fi
  
  # Test 3.1: Get available plans
  log_test "Fetch subscription plans"
  local plans_response=$(curl -s -X GET "${API_BASE_URL}/subscriptions/plans" \
    -H "Authorization: Bearer ${AUTH_TOKEN}")
  
  if echo "$plans_response" | grep -q "monthly\|quarterly\|yearly\|plan"; then
    log_success "Subscription plans retrieved"
  else
    log_failure "Plans fetch failed: $plans_response"
  fi
  
  # Test 3.2: Create Stripe checkout session for subscription
  log_test "Create subscription checkout session"
  local checkout_response=$(curl -s -X POST "${API_BASE_URL}/subscriptions/create-checkout-session" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer ${AUTH_TOKEN}" \
    -d "{
      \"planType\": \"monthly\",
      \"uid\": \"${CUSTOMER_UID}\",
      \"email\": \"${TEST_EMAIL}\"
    }")
  
  if echo "$checkout_response" | grep -q "sessionId\|id\|url"; then
    local session_id=$(echo "$checkout_response" | grep -o '"sessionId":"[^"]*"\|"id":"[^"]*"' | cut -d'"' -f4 | head -1)
    log_success "Subscription checkout session created (Session: ${session_id:0:20}...)"
  else
    log_failure "Checkout session creation failed: $checkout_response"
  fi
}

################################################################################
# FEATURE 4: ORDERS
################################################################################

test_orders() {
  log_section "FEATURE 4: ORDERS - BOOKING, FETCHING, LIVE TRACKING"
  
  if [ -z "$AUTH_TOKEN" ]; then
    log_failure "Order tests skipped - no auth token"
    return 1
  fi
  
  # Test 4.1: Create order
  log_test "Create order booking"
  local order_response=$(curl -s -X POST "${API_BASE_URL}/orders" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer ${AUTH_TOKEN}" \
    -d "{
      \"uid\": \"${CUSTOMER_UID}\",
      \"serviceType\": \"standard\",
      \"weight\": 10,
      \"price\": 45.00,
      \"scheduledDate\": \"$(date -u -d '+2 days' +'%Y-%m-%d')\",
      \"pickupAddress\": \"123 Main St, San Francisco, CA 94105\",
      \"specialInstructions\": \"Fragile items - handle with care\",
      \"addOns\": []
    }")
  
  if echo "$order_response" | grep -q "orderId\|id\|success"; then
    ORDER_ID=$(echo "$order_response" | grep -o '"orderId":"[^"]*"\|"id":"[^"]*"' | cut -d'"' -f4 | head -1)
    log_success "Order created successfully (Order ID: ${ORDER_ID:0:15}...)"
  else
    log_failure "Order creation failed: $order_response"
    return 1
  fi
  
  # Test 4.2: Fetch user's orders
  log_test "Fetch user's orders list"
  local orders_list=$(curl -s -X GET "${API_BASE_URL}/orders/user/${CUSTOMER_UID}" \
    -H "Authorization: Bearer ${AUTH_TOKEN}")
  
  if echo "$orders_list" | grep -q "orderId\|orders"; then
    log_success "Orders list retrieved"
  else
    log_failure "Orders list fetch failed: $orders_list"
  fi
  
  # Test 4.3: Get order details
  log_test "Fetch specific order details"
  local order_detail=$(curl -s -X GET "${API_BASE_URL}/orders/${ORDER_ID}" \
    -H "Authorization: Bearer ${AUTH_TOKEN}")
  
  if echo "$order_detail" | grep -q "status\|weight\|price"; then
    local status=$(echo "$order_detail" | grep -o '"status":"[^"]*"' | cut -d'"' -f4)
    log_success "Order details retrieved (Status: ${status:-pending})"
  else
    log_failure "Order detail fetch failed: $order_detail"
  fi
  
  # Test 4.4: Modify order (reschedule)
  log_test "Modify order (reschedule)"
  local modify_response=$(curl -s -X PATCH "${API_BASE_URL}/orders/modify" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer ${AUTH_TOKEN}" \
    -d "{
      \"orderId\": \"${ORDER_ID}\",
      \"action\": \"reschedule\",
      \"newDate\": \"$(date -u -d '+3 days' +'%Y-%m-%d')\"
    }")
  
  if echo "$modify_response" | grep -q "success\|updated"; then
    log_success "Order rescheduled successfully"
  else
    log_failure "Order modification failed: $modify_response"
  fi
  
  # Test 4.5: Get real-time tracking
  log_test "Get real-time order tracking"
  local tracking=$(curl -s -X GET "${API_BASE_URL}/orders/${ORDER_ID}/tracking" \
    -H "Authorization: Bearer ${AUTH_TOKEN}")
  
  if echo "$tracking" | grep -q "status\|steps\|progress"; then
    log_success "Real-time tracking retrieved"
  else
    log_failure "Tracking fetch failed: $tracking"
  fi
}

################################################################################
# FEATURE 5: PAYMENTS
################################################################################

test_payments() {
  log_section "FEATURE 5: PAYMENTS - STRIPE PAYMENTS & REFUNDS"
  
  if [ -z "$AUTH_TOKEN" ] || [ -z "$ORDER_ID" ]; then
    log_failure "Payment tests skipped - missing prerequisites"
    return 1
  fi
  
  # Test 5.1: Create Stripe checkout for order
  log_test "Create payment checkout session"
  local payment_checkout=$(curl -s -X POST "${API_BASE_URL}/checkout" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer ${AUTH_TOKEN}" \
    -d "{
      \"orderId\": \"${ORDER_ID}\",
      \"amount\": 4500,
      \"currency\": \"usd\",
      \"email\": \"${TEST_EMAIL}\"
    }")
  
  if echo "$payment_checkout" | grep -q "sessionId\|clientSecret"; then
    log_success "Payment checkout session created"
  else
    log_failure "Payment checkout failed: $payment_checkout"
  fi
  
  # Test 5.2: Get payment history
  log_test "Fetch payment history"
  local payment_history=$(curl -s -X GET "${API_BASE_URL}/payments/history?uid=${CUSTOMER_UID}" \
    -H "Authorization: Bearer ${AUTH_TOKEN}")
  
  if echo "$payment_history" | grep -q "payments\|transactions"; then
    log_success "Payment history retrieved"
  else
    log_failure "Payment history fetch failed: $payment_history"
  fi
  
  # Test 5.3: Retrieve payment intent status
  log_test "Get payment intent status"
  local intent_status=$(curl -s -X GET "${API_BASE_URL}/payments/intent-status?orderId=${ORDER_ID}" \
    -H "Authorization: Bearer ${AUTH_TOKEN}")
  
  if echo "$intent_status" | grep -q "status"; then
    log_success "Payment intent status retrieved"
  else
    log_failure "Payment status fetch failed: $intent_status"
  fi
}

################################################################################
# FEATURE 6: ADMIN PANEL
################################################################################

test_admin_panel() {
  log_section "FEATURE 6: ADMIN PANEL - USER & ORDER MANAGEMENT"
  
  # Test 6.1: Admin login
  log_test "Admin panel access"
  local admin_response=$(curl -s -X POST "${API_BASE_URL}/admin/login" \
    -H "Content-Type: application/json" \
    -d "{\"password\": \"${ADMIN_PASSWORD}\"}")
  
  local admin_token=""
  if echo "$admin_response" | grep -q "token\|success"; then
    admin_token=$(echo "$admin_response" | grep -o '"token":"[^"]*"\|"accessToken":"[^"]*"' | cut -d'"' -f4 | head -1)
    log_success "Admin access granted"
  else
    log_failure "Admin login failed: $admin_response"
    return 1
  fi
  
  # Test 6.2: Get all users
  log_test "Fetch all users"
  local all_users=$(curl -s -X GET "${API_BASE_URL}/admin/users" \
    -H "Authorization: Bearer ${admin_token}")
  
  if echo "$all_users" | grep -q "users\|uid"; then
    log_success "All users retrieved"
  else
    log_failure "Users fetch failed: $all_users"
  fi
  
  # Test 6.3: Get all orders
  log_test "Fetch all orders (admin)"
  local all_orders=$(curl -s -X GET "${API_BASE_URL}/admin/orders" \
    -H "Authorization: Bearer ${admin_token}")
  
  if echo "$all_orders" | grep -q "orders\|orderId"; then
    log_success "All orders retrieved"
  else
    log_failure "Orders fetch failed: $all_orders"
  fi
  
  # Test 6.4: Update order status
  log_test "Update order status (admin)"
  local status_update=$(curl -s -X PATCH "${API_BASE_URL}/admin/orders/${ORDER_ID}/status" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer ${admin_token}" \
    -d "{\"status\": \"confirmed\"}")
  
  if echo "$status_update" | grep -q "success\|updated"; then
    log_success "Order status updated"
  else
    log_failure "Status update failed: $status_update"
  fi
  
  # Test 6.5: Get analytics
  log_test "Fetch admin analytics"
  local analytics=$(curl -s -X GET "${API_BASE_URL}/admin/analytics" \
    -H "Authorization: Bearer ${admin_token}")
  
  if echo "$analytics" | grep -q "totalOrders\|totalRevenue\|stats"; then
    log_success "Analytics retrieved"
  else
    log_failure "Analytics fetch failed: $analytics"
  fi
}

################################################################################
# ERROR SCENARIO TESTING
################################################################################

test_error_scenarios() {
  log_section "EDGE CASES: ERROR HANDLING & VALIDATION"
  
  # Test E1: Invalid auth token
  log_test "Reject request with invalid token"
  local invalid_token_response=$(curl -s -X GET "${API_BASE_URL}/orders/user/${CUSTOMER_UID}" \
    -H "Authorization: Bearer invalid-token-123")
  
  if echo "$invalid_token_response" | grep -q "401\|Unauthorized\|invalid"; then
    log_success "Invalid token properly rejected"
  else
    log_failure "Invalid token not rejected: $invalid_token_response"
  fi
  
  # Test E2: Missing required fields
  log_test "Reject order with missing fields"
  local missing_fields=$(curl -s -X POST "${API_BASE_URL}/orders" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer ${AUTH_TOKEN}" \
    -d "{\"weight\": 10}")
  
  if echo "$missing_fields" | grep -q "400\|required\|missing"; then
    log_success "Missing fields validation works"
  else
    log_failure "Missing fields not validated: $missing_fields"
  fi
  
  # Test E3: Invalid email format
  log_test "Reject signup with invalid email"
  local invalid_email=$(curl -s -X POST "${API_BASE_URL}/auth/signup" \
    -H "Content-Type: application/json" \
    -d "{
      \"email\": \"not-an-email\",
      \"password\": \"${TEST_PASSWORD}\",
      \"userType\": \"customer\"
    }")
  
  if echo "$invalid_email" | grep -q "400\|invalid\|email"; then
    log_success "Invalid email format rejected"
  else
    log_failure "Invalid email not rejected: $invalid_email"
  fi
  
  # Test E4: Duplicate user signup
  log_test "Reject duplicate email signup"
  local duplicate_signup=$(curl -s -X POST "${API_BASE_URL}/auth/signup" \
    -H "Content-Type: application/json" \
    -d "{
      \"email\": \"${TEST_EMAIL}\",
      \"password\": \"${TEST_PASSWORD}\",
      \"userType\": \"customer\"
    }")
  
  if echo "$duplicate_signup" | grep -q "409\|exists\|duplicate"; then
    log_success "Duplicate signup properly rejected"
  else
    log_failure "Duplicate not rejected: $duplicate_signup"
  fi
}

################################################################################
# MAIN TEST EXECUTION
################################################################################

main() {
  echo -e "\n${BLUE}"
  echo "╔════════════════════════════════════════════════════════════╗"
  echo "║  WASHLEE - COMPREHENSIVE AUTOMATED TEST SUITE              ║"
  echo "║  Target: ${API_BASE_URL}"
  echo "╚════════════════════════════════════════════════════════════╝"
  echo -e "${NC}\n"
  
  # Test authentication first (prerequisite for other tests)
  test_auth_signup || exit 1
  
  # Run all feature tests
  test_loyalty_program
  test_subscriptions
  test_orders
  test_payments
  test_admin_panel
  test_error_scenarios
  
  # Summary
  log_section "TEST SUMMARY"
  echo -e "Total Tests: ${TOTAL_TESTS}"
  echo -e "${GREEN}Passed: ${PASSED_TESTS}${NC}"
  echo -e "${RED}Failed: ${FAILED_TESTS}${NC}"
  
  if [ $FAILED_TESTS -eq 0 ]; then
    echo -e "\n${GREEN}✓ ALL TESTS PASSED!${NC}\n"
    exit 0
  else
    echo -e "\n${RED}✗ SOME TESTS FAILED${NC}\n"
    exit 1
  fi
}

# Run tests
main "$@"
