#!/bin/bash

################################################################################
# TEST 1: AUTHENTICATION FEATURE TEST
# Tests: Signup, Email verification, Phone verification, Login, Token refresh
################################################################################

set -e

API_BASE_URL="${API_URL:-http://localhost:3000/api}"
TEST_EMAIL="test-auth-$(date +%s)@washlee.test"
TEST_PHONE="+14155552671"
TEST_PASSWORD="TestAuth123!"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

PASSED=0
FAILED=0

echo -e "\n${YELLOW}=== AUTHENTICATION FEATURE TEST ===${NC}\n"

# Test 1: Sign up
echo -e "${YELLOW}[1] Testing signup...${NC}"
SIGNUP_RESPONSE=$(curl -s -X POST "${API_BASE_URL}/auth/signup" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"${TEST_EMAIL}\",
    \"password\": \"${TEST_PASSWORD}\",
    \"fullName\": \"Test User\",
    \"userType\": \"customer\"
  }")

if echo "$SIGNUP_RESPONSE" | grep -q "uid\|idToken"; then
  UID=$(echo "$SIGNUP_RESPONSE" | grep -o '"uid":"[^"]*"' | cut -d'"' -f4 | head -1)
  echo -e "${GREEN}✓ Signup successful (UID: ${UID:0:20}...)${NC}"
  ((PASSED++))
else
  echo -e "${RED}✗ Signup failed: $SIGNUP_RESPONSE${NC}"
  ((FAILED++))
fi

# Test 2: Send email verification
echo -e "${YELLOW}[2] Testing email verification...${NC}"
EMAIL_VERIFY=$(curl -s -X POST "${API_BASE_URL}/auth/send-verification-email" \
  -H "Content-Type: application/json" \
  -d "{\"email\": \"${TEST_EMAIL}\"}")

if echo "$EMAIL_VERIFY" | grep -q "success\|sent"; then
  echo -e "${GREEN}✓ Email verification sent${NC}"
  ((PASSED++))
else
  echo -e "${RED}✗ Email verification failed: $EMAIL_VERIFY${NC}"
  ((FAILED++))
fi

# Test 3: Send phone verification (DEV MODE)
echo -e "${YELLOW}[3] Testing phone verification...${NC}"
PHONE_CODE_RESPONSE=$(curl -s -X POST "${API_BASE_URL}/auth/send-phone-code" \
  -H "Content-Type: application/json" \
  -d "{
    \"uid\": \"${UID}\",
    \"phone\": \"${TEST_PHONE}\",
    \"devMode\": true
  }")

if echo "$PHONE_CODE_RESPONSE" | grep -q "code\|success"; then
  CODE=$(echo "$PHONE_CODE_RESPONSE" | grep -o '"code":"[^"]*"' | cut -d'"' -f4)
  echo -e "${GREEN}✓ Phone code sent (code: ${CODE})${NC}"
  ((PASSED++))
  
  # Verify phone code
  echo -e "${YELLOW}[4] Testing phone code verification...${NC}"
  VERIFY_PHONE=$(curl -s -X POST "${API_BASE_URL}/auth/verify-phone-code" \
    -H "Content-Type: application/json" \
    -d "{
      \"uid\": \"${UID}\",
      \"code\": \"${CODE}\"
    }")
  
  if echo "$VERIFY_PHONE" | grep -q "verified\|success"; then
    echo -e "${GREEN}✓ Phone verified${NC}"
    ((PASSED++))
  else
    echo -e "${RED}✗ Phone verification failed: $VERIFY_PHONE${NC}"
    ((FAILED++))
  fi
else
  echo -e "${RED}✗ Phone code request failed: $PHONE_CODE_RESPONSE${NC}"
  ((FAILED++))
fi

# Test 5: Login
echo -e "${YELLOW}[5] Testing login...${NC}"
LOGIN_RESPONSE=$(curl -s -X POST "${API_BASE_URL}/auth/signin" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"${TEST_EMAIL}\",
    \"password\": \"${TEST_PASSWORD}\"
  }")

if echo "$LOGIN_RESPONSE" | grep -q "idToken"; then
  TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"idToken":"[^"]*"' | cut -d'"' -f4 | head -1)
  echo -e "${GREEN}✓ Login successful (Token: ${TOKEN:0:30}...)${NC}"
  ((PASSED++))
  
  # Test 6: Refresh token
  echo -e "${YELLOW}[6] Testing token refresh...${NC}"
  REFRESH_RESPONSE=$(curl -s -X POST "${API_BASE_URL}/auth/refresh-token" \
    -H "Authorization: Bearer ${TOKEN}" \
    -d "{\"uid\": \"${UID}\"}")
  
  if echo "$REFRESH_RESPONSE" | grep -q "idToken"; then
    NEW_TOKEN=$(echo "$REFRESH_RESPONSE" | grep -o '"idToken":"[^"]*"' | cut -d'"' -f4 | head -1)
    echo -e "${GREEN}✓ Token refreshed (New token: ${NEW_TOKEN:0:30}...)${NC}"
    ((PASSED++))
  else
    echo -e "${RED}✗ Token refresh failed: $REFRESH_RESPONSE${NC}"
    ((FAILED++))
  fi
else
  echo -e "${RED}✗ Login failed: $LOGIN_RESPONSE${NC}"
  ((FAILED++))
fi

# Test 7: Error case - Invalid token
echo -e "${YELLOW}[7] Testing invalid token rejection...${NC}"
INVALID_TOKEN=$(curl -s -X POST "${API_BASE_URL}/auth/refresh-token" \
  -H "Authorization: Bearer invalid-token-xyz" \
  -d "{\"uid\": \"${UID}\"}")

if echo "$INVALID_TOKEN" | grep -q "401\|Unauthorized\|invalid"; then
  echo -e "${GREEN}✓ Invalid token properly rejected${NC}"
  ((PASSED++))
else
  echo -e "${RED}✗ Invalid token not rejected: $INVALID_TOKEN${NC}"
  ((FAILED++))
fi

# Summary
echo -e "\n${YELLOW}=== TEST SUMMARY ===${NC}"
echo -e "Passed: ${GREEN}${PASSED}${NC}"
echo -e "Failed: ${RED}${FAILED}${NC}\n"

[ $FAILED -eq 0 ] && exit 0 || exit 1
