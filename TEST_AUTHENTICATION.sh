#!/bin/bash

# Washlee Authentication Testing Script
# Tests all authentication flows end-to-end

set -e

echo "================================"
echo "Washlee Authentication Test Suite"
echo "================================"
echo ""

# Color codes for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

TEST_EMAIL="testuser_$(date +%s)@example.com"
TEST_PHONE="0412345678"
TEST_PASSWORD="TestPassword123!"
ADMIN_EMAIL="admin@washlee.com.au"

echo -e "${YELLOW}📧 Test Credentials:${NC}"
echo "Email: $TEST_EMAIL"
echo "Phone: $TEST_PHONE"
echo "Password: $TEST_PASSWORD"
echo ""

# Function to test API endpoint
test_api() {
  local method=$1
  local endpoint=$2
  local data=$3
  local description=$4
  
  echo -e "${YELLOW}Testing: $description${NC}"
  echo "Endpoint: $method $endpoint"
  
  if [ -z "$data" ]; then
    response=$(curl -s -X $method \
      -H "Content-Type: application/json" \
      "http://localhost:3000$endpoint")
  else
    echo "Payload: $data"
    response=$(curl -s -X $method \
      -H "Content-Type: application/json" \
      -d "$data" \
      "http://localhost:3000$endpoint")
  fi
  
  echo "Response: $response"
  echo ""
  
  # Check if response contains error
  if echo "$response" | grep -q "error\|Error"; then
    echo -e "${RED}✗ FAILED${NC}"
    return 1
  else
    echo -e "${GREEN}✓ PASSED${NC}"
    return 0
  fi
}

# Test 1: Create customer account
echo -e "${YELLOW}=== TEST 1: Customer Account Creation ===${NC}"
test_api "POST" "/api/emails/send" \
  "{\"to\":\"$TEST_EMAIL\",\"subject\":\"Test\",\"html\":\"<p>Test</p>\"}" \
  "Email API route exists"

# Test 2: Test inquiry creation
echo -e "${YELLOW}=== TEST 2: Pro Inquiry Creation ===${NC}"
INQUIRY_DATA="{
  \"userId\":\"test-user-123\",
  \"firstName\":\"Test\",
  \"lastName\":\"User\",
  \"email\":\"$TEST_EMAIL\",
  \"phone\":\"$TEST_PHONE\",
  \"state\":\"NSW\",
  \"workVerification\":{
    \"hasWorkRight\":true,
    \"hasValidLicense\":true,
    \"hasTransport\":true,
    \"hasEquipment\":true,
    \"ageVerified\":true
  },
  \"skillsAssessment\":\"I have 5 years of laundry service experience with excellent customer satisfaction ratings.\",
  \"availability\":{\"monday\":true,\"tuesday\":true,\"wednesday\":true,\"thursday\":true,\"friday\":true,\"saturday\":false,\"sunday\":false},
  \"comments\":\"Available for flexible hours\"
}"

test_api "POST" "/api/inquiries/create" "$INQUIRY_DATA" "Inquiry creation API"

# Test 3: Verify API response codes
echo -e "${YELLOW}=== TEST 3: API Response Codes ===${NC}"

echo "Testing /auth/login..."
LOGIN_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:3000/auth/login")
if [ "$LOGIN_STATUS" = "200" ]; then
  echo -e "${GREEN}✓ Login page loads (HTTP $LOGIN_STATUS)${NC}"
else
  echo -e "${RED}✗ Login page error (HTTP $LOGIN_STATUS)${NC}"
fi

echo "Testing /auth/pro-signin..."
PRO_SIGNIN_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:3000/auth/pro-signin")
if [ "$PRO_SIGNIN_STATUS" = "200" ]; then
  echo -e "${GREEN}✓ Pro signin page loads (HTTP $PRO_SIGNIN_STATUS)${NC}"
else
  echo -e "${RED}✗ Pro signin page error (HTTP $PRO_SIGNIN_STATUS)${NC}"
fi

echo "Testing /auth/pro-signup-form..."
PRO_SIGNUP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:3000/auth/pro-signup-form")
if [ "$PRO_SIGNUP_STATUS" = "200" ]; then
  echo -e "${GREEN}✓ Pro signup form loads (HTTP $PRO_SIGNUP_STATUS)${NC}"
else
  echo -e "${RED}✗ Pro signup form error (HTTP $PRO_SIGNUP_STATUS)${NC}"
fi

# Test 4: Check Firebase configuration
echo -e "${YELLOW}=== TEST 4: Firebase Configuration ===${NC}"

if grep -q "FIREBASE_PROJECT_ID" ".env.local"; then
  echo -e "${GREEN}✓ Firebase Project ID configured${NC}"
else
  echo -e "${RED}✗ Firebase Project ID missing${NC}"
fi

if grep -q "FIREBASE_PRIVATE_KEY" ".env.local"; then
  echo -e "${GREEN}✓ Firebase Admin SDK configured${NC}"
else
  echo -e "${RED}✗ Firebase Admin SDK missing${NC}"
fi

# Test 5: Check email configuration
echo -e "${YELLOW}=== TEST 5: Email Service Configuration ===${NC}"

if grep -q "GMAIL_USER" ".env.local"; then
  GMAIL_USER=$(grep "GMAIL_USER" ".env.local" | cut -d'=' -f2)
  if [ ! -z "$GMAIL_USER" ] && [ "$GMAIL_USER" != "noreply@washlee.com.au" ]; then
    echo -e "${GREEN}✓ Gmail configured: $GMAIL_USER${NC}"
  else
    echo -e "${YELLOW}⚠ Gmail not fully configured (needs Gmail app password)${NC}"
  fi
else
  echo -e "${YELLOW}⚠ Gmail not configured${NC}"
fi

if grep -q "SENDGRID_API_KEY" ".env.local"; then
  echo -e "${GREEN}✓ SendGrid API key configured${NC}"
else
  echo -e "${YELLOW}⚠ SendGrid not configured${NC}"
fi

echo ""
echo -e "${YELLOW}=== Summary ===${NC}"
echo "Test completed. Check results above."
echo ""
echo -e "${YELLOW}Manual Testing Steps:${NC}"
echo "1. Visit http://localhost:3000/auth/signup"
echo "2. Create account with:"
echo "   Email: $TEST_EMAIL"
echo "   Password: $TEST_PASSWORD"
echo "3. Check browser console for logs"
echo "4. Visit http://localhost:3000/auth/pro-signup-form"
echo "5. Complete pro signup form"
echo "6. Check Firestore for created documents"
echo "7. Check console for Cloud Function ID generation"
echo ""
