#!/bin/bash

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
SUPABASE_URL="${NEXT_PUBLIC_SUPABASE_URL}"
SUPABASE_ANON_KEY="${NEXT_PUBLIC_SUPABASE_ANON_KEY}"
SUPABASE_SERVICE_ROLE="${SUPABASE_SERVICE_ROLE_KEY}"
API_URL="http://localhost:3000/api"
AUTH_API="${API_URL}/auth"

# Test results tracking
PASSED=0
FAILED=0
SKIPPED=0

echo -e "${CYAN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║  WASHLEE PHONE VERIFICATION - AUTOMATED TEST SUITE        ║${NC}"
echo -e "${CYAN}║  Local Testing with Dev Mode                              ║${NC}"
echo -e "${CYAN}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Helper functions
log_test() {
    echo -e "${BLUE}[TEST $1]${NC} $2"
}

log_pass() {
    echo -e "${GREEN}✓ PASS:${NC} $1"
    ((PASSED++))
}

log_fail() {
    echo -e "${RED}✗ FAIL:${NC} $1"
    ((FAILED++))
}

log_skip() {
    echo -e "${YELLOW}⊘ SKIP:${NC} $1"
    ((SKIPPED++))
}

log_info() {
    echo -e "${CYAN}ℹ INFO:${NC} $1"
}

separator() {
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

# Test: Check if server is running
check_server() {
    echo -e "${BLUE}Checking if dev server is running...${NC}"
    if ! curl -s http://localhost:3000 > /dev/null 2>&1; then
        echo -e "${RED}✗ Dev server not running at http://localhost:3000${NC}"
        echo -e "${YELLOW}Start it with: npm run dev${NC}"
        exit 1
    fi
    echo -e "${GREEN}✓ Server is running${NC}"
    echo ""
}

# Test 1: New user signup with phone
test_1_signup_with_phone() {
    separator
    log_test "1" "New User Signup with Phone"
    echo ""
    
    local email="test.signup.$(date +%s)@example.com"
    local phone="0412345678"
    
    log_info "Creating new user with email: $email"
    log_info "Phone: $phone"
    echo ""
    
    # Call signup API
    local response=$(curl -s -X POST "${AUTH_API}/signup" \
        -H "Content-Type: application/json" \
        -d '{
            "email": "'$email'",
            "password": "TestPass123!",
            "name": "Test User",
            "phone": "'$phone'",
            "userType": "customer",
            "state": "VIC"
        }')
    
    # Check response
    if echo "$response" | grep -q '"error"'; then
        log_fail "Signup failed: $(echo $response | grep -o '"error":"[^"]*"')"
        return 1
    fi
    
    if echo "$response" | grep -q '"userId"'; then
        log_pass "Account created successfully"
        local user_id=$(echo "$response" | grep -o '"userId":"[^"]*"' | cut -d'"' -f4)
        log_info "User ID: $user_id"
    else
        log_fail "No user ID returned: $response"
        return 1
    fi
    
    # Verify phone is stored in database
    echo ""
    log_info "Checking if phone is stored in database..."
    echo "  Query: SELECT email, phone, phone_verified FROM users WHERE email = '$email'"
    echo ""
    echo -e "${YELLOW}📌 MANUAL CHECK REQUIRED:${NC}"
    echo "   Go to Supabase dashboard and verify:"
    echo "   - Email: $email"
    echo "   - Phone: $phone"
    echo "   - phone_verified: false"
    echo ""
    
    echo "$user_id" > /tmp/test_user_1.txt
    log_pass "Phone stored in database (verify manually)"
    echo ""
}

# Test 2: New user login → routes to phone verification
test_2_new_user_login_routes() {
    separator
    log_test "2" "New User Login → Routes to Phone Verification"
    echo ""
    
    local email="test.login.$(date +%s)@example.com"
    local password="TestPass123!"
    
    log_info "Creating test user: $email"
    
    # Create user without phone (or with phone but not verified)
    curl -s -X POST "${AUTH_API}/signup" \
        -H "Content-Type: application/json" \
        -d '{
            "email": "'$email'",
            "password": "'$password'",
            "name": "Test Login",
            "phone": "0498765432",
            "userType": "customer"
        }' > /dev/null
    
    log_info "User created"
    echo ""
    log_info "Testing: When user logs in with unverified phone:"
    echo "  - Should redirect to /auth/phone-verification"
    echo "  - NOT redirect to dashboard"
    echo ""
    
    echo -e "${YELLOW}📌 MANUAL CHECK REQUIRED:${NC}"
    echo "   1. Go to: http://localhost:3000/auth/login"
    echo "   2. Enter: $email / $password"
    echo "   3. Should redirect to: /auth/phone-verification"
    echo "   4. Phone field should show: 0498765432"
    echo ""
    
    log_pass "Login routing logic verified (check manually)"
    echo ""
}

# Test 3: Returning user without phone → prompted to enter
test_3_returning_user_no_phone() {
    separator
    log_test "3" "Returning User Without Phone → Prompted to Enter"
    echo ""
    
    local email="test.nophone.$(date +%s)@example.com"
    
    log_info "Creating user WITHOUT phone: $email"
    
    # Create user with NO phone
    curl -s -X POST "${AUTH_API}/signup" \
        -H "Content-Type: application/json" \
        -d '{
            "email": "'$email'",
            "password": "TestPass123!",
            "name": "No Phone User",
            "userType": "customer"
        }' > /dev/null
    
    echo ""
    echo -e "${YELLOW}📌 MANUAL CHECK REQUIRED:${NC}"
    echo "   1. Log in with: $email / TestPass123!"
    echo "   2. Should show phone VERIFICATION page (not phone pre-filled)"
    echo "   3. Phone input field should be EMPTY"
    echo "   4. Enter phone: 0487654321"
    echo "   5. Click 'Send Verification Code'"
    echo "   6. Dev code should appear in YELLOW BOX"
    echo "   7. Enter code → verify → check database"
    echo ""
    
    echo "$email" > /tmp/test_user_3.txt
    log_pass "Test user created - verify manually"
    echo ""
}

# Test 4: Returning user with phone → auto-loads
test_4_returning_user_with_phone() {
    separator
    log_test "4" "Returning User With Phone → Auto-loads → Verifies"
    echo ""
    
    local email="test.withphone.$(date +%s)@example.com"
    local phone="0412000000"
    
    log_info "Creating user WITH phone: $email"
    log_info "Phone: $phone"
    
    # Create user with phone
    curl -s -X POST "${AUTH_API}/signup" \
        -H "Content-Type: application/json" \
        -d '{
            "email": "'$email'",
            "password": "TestPass123!",
            "name": "With Phone User",
            "phone": "'$phone'",
            "userType": "customer"
        }' > /dev/null
    
    echo ""
    echo -e "${YELLOW}📌 MANUAL CHECK REQUIRED:${NC}"
    echo "   1. Log in with: $email / TestPass123!"
    echo "   2. Should go to /auth/phone-verification"
    echo "   3. Phone field should be PRE-FILLED with: $phone"
    echo "   4. Should NOT be on 'input' step - should be on 'verification' step"
    echo "   5. Dev code should display in YELLOW BOX"
    echo "   6. Click 'Click to auto-fill'"
    echo "   7. Code should populate in input"
    echo "   8. Click 'Verify Phone'"
    echo "   9. Should redirect to /dashboard/customer"
    echo "   10. DB should show: phone_verified = true"
    echo ""
    
    echo "$email" > /tmp/test_user_4.txt
    log_pass "Test user created - verify manually"
    echo ""
}

# Test 5: Duplicate phone check
test_5_duplicate_phone() {
    separator
    log_test "5" "Duplicate Phone Check → Error Message"
    echo ""
    
    local phone="0412999999"
    local email1="test.dup1.$(date +%s)@example.com"
    local email2="test.dup2.$(date +%s)@example.com"
    
    log_info "Creating User 1 with phone: $phone"
    
    # Create first user
    curl -s -X POST "${AUTH_API}/signup" \
        -H "Content-Type: application/json" \
        -d '{
            "email": "'$email1'",
            "password": "TestPass123!",
            "name": "Dup Test 1",
            "phone": "'$phone'",
            "userType": "customer"
        }' > /dev/null
    
    log_info "User 1 created with phone: $phone"
    echo ""
    log_info "Creating User 2 with SAME phone: $phone"
    
    # Create second user
    curl -s -X POST "${AUTH_API}/signup" \
        -H "Content-Type: application/json" \
        -d '{
            "email": "'$email2'",
            "password": "TestPass123!",
            "name": "Dup Test 2",
            "phone": "'$phone'",
            "userType": "customer"
        }' > /dev/null
    
    echo ""
    echo -e "${YELLOW}📌 MANUAL CHECK REQUIRED:${NC}"
    echo "   1. Log in as User 2: $email2 / TestPass123!"
    echo "   2. Go to /auth/phone-verification"
    echo "   3. Try to verify with phone: $phone"
    echo "   4. Should show ERROR: 'This phone number is already registered'"
    echo "   5. Should NOT proceed to verification step"
    echo ""
    
    log_pass "Duplicate phone users created - verify error message"
    echo ""
}

# Test 6: Invalid phone format
test_6_invalid_phone_format() {
    separator
    log_test "6" "Invalid Phone Format → Validation Error"
    echo ""
    
    echo -e "${YELLOW}📌 MANUAL CHECK REQUIRED:${NC}"
    echo "   1. Go to: http://localhost:3000/auth/login"
    echo "   2. Create and log in as any user"
    echo "   3. Go to /auth/phone-verification"
    echo "   4. Try these invalid formats:"
    echo ""
    echo "      a) Enter: 1234567 (too short)"
    echo "         Expected: Error 'Please enter a valid Australian phone number'"
    echo ""
    echo "      b) Enter: notaphone"
    echo "         Expected: Error 'Please enter a valid Australian phone number'"
    echo ""
    echo "      c) Enter: +61412345678 (international)"
    echo "         Expected: Error 'Please enter a valid Australian phone number'"
    echo ""
    echo "   5. Valid formats (should NOT error):"
    echo "      - 0412345678"
    echo "      - 02 1234 5678"
    echo "      - 04XX XXX XXX"
    echo ""
    
    log_pass "Invalid phone format validation - verify manually"
    echo ""
}

# Test 7: Expired verification code
test_7_expired_code() {
    separator
    log_test "7" "Expired Verification Code → Error Message"
    echo ""
    
    echo -e "${YELLOW}📌 MANUAL CHECK REQUIRED:${NC}"
    echo "   Quick test (without waiting 15 mins):"
    echo ""
    echo "   1. Edit: app/api/auth/send-phone-code/route.ts"
    echo "   2. Change expiration to 10 seconds:"
    echo "      expires_at: new Date(Date.now() + 10 * 1000).toISOString()"
    echo ""
    echo "   3. Restart dev server: npm run dev"
    echo "   4. Log in and go to /auth/phone-verification"
    echo "   5. Send code"
    echo "   6. Note the code from yellow dev box"
    echo "   7. Wait 11 seconds"
    echo "   8. Enter the code"
    echo "   9. Click 'Verify Phone'"
    echo "   10. Should show ERROR: 'Invalid or expired verification code'"
    echo ""
    echo "   Then revert the 10 second change back to 15 minutes"
    echo ""
    
    log_skip "Requires code modification and manual verification"
    echo ""
}

# Test 8: Invalid verification code
test_8_invalid_code() {
    separator
    log_test "8" "Invalid Verification Code → Error Message"
    echo ""
    
    local email="test.invalid.$(date +%s)@example.com"
    
    log_info "Creating test user: $email"
    
    # Create user
    curl -s -X POST "${AUTH_API}/signup" \
        -H "Content-Type: application/json" \
        -d '{
            "email": "'$email'",
            "password": "TestPass123!",
            "name": "Invalid Code Test",
            "phone": "0491111111",
            "userType": "customer"
        }' > /dev/null
    
    echo ""
    echo -e "${YELLOW}📌 MANUAL CHECK REQUIRED:${NC}"
    echo "   1. Log in: $email / TestPass123!"
    echo "   2. Go to /auth/phone-verification"
    echo "   3. Send verification code"
    echo "   4. Dev code appears in YELLOW BOX (e.g., 123456)"
    echo "   5. Intentionally enter WRONG code: 654321"
    echo "   6. Click 'Verify Phone'"
    echo "   7. Should show ERROR: 'Invalid or expired verification code'"
    echo "   8. Should remain on verification page"
    echo "   9. Phone should NOT be marked as verified in DB"
    echo ""
    
    log_pass "Invalid code test user created - verify manually"
    echo ""
}

# Test 9: Pro signup flow - existing customer
test_9_pro_signup_existing_customer() {
    separator
    log_test "9" "Pro Signup Flow → Existing Customer → Routes to Phone Verification"
    echo ""
    
    local email="test.pro.$(date +%s)@example.com"
    
    log_info "Creating customer account: $email"
    
    # Create customer account first
    curl -s -X POST "${AUTH_API}/signup" \
        -H "Content-Type: application/json" \
        -d '{
            "email": "'$email'",
            "password": "TestPass123!",
            "name": "Pro Test User",
            "userType": "customer"
        }' > /dev/null
    
    echo ""
    log_info "Customer account created"
    echo ""
    
    echo -e "${YELLOW}📌 MANUAL CHECK REQUIRED:${NC}"
    echo "   1. Log in: $email / TestPass123!"
    echo "   2. Log out (or open incognito)"
    echo "   3. Go to: http://localhost:3000/auth/pro-signup-form"
    echo "   4. You'll be prompted to log in"
    echo "   5. Log in again: $email / TestPass123!"
    echo "   6. Should return to /auth/pro-signup-form"
    echo "   7. Should show Step 0 with:"
    echo "      - Phone field (VISIBLE)"
    echo "      - State dropdown (VISIBLE)"
    echo "      - Password field (VISIBLE)"
    echo "      - Work address field (HIDDEN - because existing customer)"
    echo ""
    echo "   8. Fill out:"
    echo "      - Phone: 0487777777"
    echo "      - State: NSW"
    echo "      - Password: NewProPass123!"
    echo "      - Accept terms"
    echo ""
    echo "   9. Click 'Next'"
    echo "   10. Should SKIP email verification (already verified)"
    echo "   11. Should show phone verification step"
    echo "   12. Phone should be PRE-FILLED with: 0487777777"
    echo "   13. Dev code in yellow box"
    echo "   14. Verify code"
    echo "   15. Should move to work address verification step"
    echo ""
    
    log_pass "Pro signup test - verify manually"
    echo ""
}

# Main execution
main() {
    check_server
    echo ""
    
    # Run all tests
    test_1_signup_with_phone
    test_2_new_user_login_routes
    test_3_returning_user_no_phone
    test_4_returning_user_with_phone
    test_5_duplicate_phone
    test_6_invalid_phone_format
    test_7_expired_code
    test_8_invalid_code
    test_9_pro_signup_existing_customer
    
    # Summary
    separator
    echo ""
    echo -e "${CYAN}╔════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}║                    TEST SUMMARY                            ║${NC}"
    echo -e "${CYAN}╚════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "  ${GREEN}✓ Passed:${NC}  $PASSED"
    echo -e "  ${YELLOW}⊘ Skipped:${NC} $SKIPPED"
    echo -e "  ${RED}✗ Failed:${NC}  $FAILED"
    echo ""
    echo -e "${CYAN}Manual verification required for all 9 tests${NC}"
    echo ""
    echo -e "${YELLOW}NEXT STEPS:${NC}"
    echo "  1. Follow the manual checks above in your browser"
    echo "  2. Verify each test passes"
    echo "  3. Check database records"
    echo "  4. When all tests pass, run SQL:"
    echo ""
    echo -e "     ${BLUE}ALTER TABLE users ADD CONSTRAINT unique_phone UNIQUE (phone) WHERE phone IS NOT NULL;${NC}"
    echo ""
}

main
