#!/bin/bash

################################################################################
# WASHLEE - MASTER TEST RUNNER
# Executes all feature tests and generates comprehensive report
################################################################################

set -e

# Configuration
API_URL="${API_URL:-http://localhost:3000/api}"
EXPORT_API_URL="API_URL=${API_URL}"
TESTS_DIR="/Users/lukaverde/Desktop/Website.BUsiness"
TIMESTAMP=$(date '+%Y-%m-%d_%H-%M-%S')
REPORT_FILE="TEST_REPORT_${TIMESTAMP}.txt"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Results tracking
TOTAL_PASSED=0
TOTAL_FAILED=0
TOTAL_SKIPPED=0

# Create report header
{
  echo "╔════════════════════════════════════════════════════════════════╗"
  echo "║  WASHLEE - COMPREHENSIVE TEST REPORT                          ║"
  echo "║  Generated: $(date)                   ║"
  echo "║  Target API: ${API_URL}"
  echo "╚════════════════════════════════════════════════════════════════╝"
  echo ""
} > "$REPORT_FILE"

echo -e "${BLUE}"
cat << "EOF"
╔════════════════════════════════════════════════════════════════╗
║  WASHLEE - MASTER TEST RUNNER                                 ║
║  Running comprehensive test suite across all features         ║
╚════════════════════════════════════════════════════════════════╝
EOF
echo -e "${NC}\n"

# Function to run individual test
run_test() {
  local test_name=$1
  local test_script=$2
  
  echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${BLUE}Running: ${test_name}${NC}"
  echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"
  
  # Run test and capture output
  if $EXPORT_API_URL bash "$test_script" > "test_output.tmp" 2>&1; then
    echo -e "${GREEN}✓ ${test_name} - PASSED${NC}\n"
    ((TOTAL_PASSED++))
    RESULT="PASSED"
  else
    echo -e "${RED}✗ ${test_name} - FAILED${NC}\n"
    ((TOTAL_FAILED++))
    RESULT="FAILED"
  fi
  
  # Append to report
  {
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "TEST: ${test_name}"
    echo "RESULT: ${RESULT}"
    echo "TIME: $(date)"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    cat test_output.tmp
    echo ""
  } >> "$REPORT_FILE"
  
  rm -f test_output.tmp
}

# Test 1: Authentication
if [ -f "${TESTS_DIR}/test-auth.sh" ]; then
  run_test "Authentication (Signup, Email/Phone Verification, Login)" "${TESTS_DIR}/test-auth.sh"
else
  echo -e "${RED}✗ test-auth.sh not found${NC}\n"
  ((TOTAL_SKIPPED++))
fi

# Test 2: Loyalty Program
if [ -f "${TESTS_DIR}/test-loyalty.sh" ]; then
  run_test "Loyalty Program (Card Creation, Tiers, Discounts)" "${TESTS_DIR}/test-loyalty.sh"
else
  echo -e "${RED}✗ test-loyalty.sh not found${NC}\n"
  ((TOTAL_SKIPPED++))
fi

# Test 3: Orders
if [ -f "${TESTS_DIR}/test-orders.sh" ]; then
  run_test "Orders (Creation, Modification, Tracking)" "${TESTS_DIR}/test-orders.sh"
else
  echo -e "${RED}✗ test-orders.sh not found${NC}\n"
  ((TOTAL_SKIPPED++))
fi

# Test 4: Payments & Subscriptions
if [ -f "${TESTS_DIR}/test-payments.sh" ]; then
  run_test "Payments & Subscriptions (Checkout, History, Refunds)" "${TESTS_DIR}/test-payments.sh"
else
  echo -e "${RED}✗ test-payments.sh not found${NC}\n"
  ((TOTAL_SKIPPED++))
fi

# Test 5: Admin Panel
if [ -f "${TESTS_DIR}/test-admin.sh" ]; then
  run_test "Admin Panel (Users, Orders, Analytics)" "${TESTS_DIR}/test-admin.sh"
else
  echo -e "${RED}✗ test-admin.sh not found${NC}\n"
  ((TOTAL_SKIPPED++))
fi

# Generate Summary
{
  echo ""
  echo "╔════════════════════════════════════════════════════════════════╗"
  echo "║  TEST EXECUTION SUMMARY                                       ║"
  echo "╚════════════════════════════════════════════════════════════════╝"
  echo ""
  echo "Total Tests Executed: $((TOTAL_PASSED + TOTAL_FAILED))"
  echo "✓ Passed: ${TOTAL_PASSED}"
  echo "✗ Failed: ${TOTAL_FAILED}"
  echo "⊘ Skipped: ${TOTAL_SKIPPED}"
  echo ""
  echo "Success Rate: $(( TOTAL_PASSED * 100 / (TOTAL_PASSED + TOTAL_FAILED + 1) ))%"
  echo ""
  
  if [ $TOTAL_FAILED -eq 0 ]; then
    echo "╔════════════════════════════════════════════════════════════════╗"
    echo "║  ✓ ALL TESTS PASSED                                           ║"
    echo "╚════════════════════════════════════════════════════════════════╝"
  else
    echo "╔════════════════════════════════════════════════════════════════╗"
    echo "║  ✗ SOME TESTS FAILED - REVIEW REPORT                         ║"
    echo "╚════════════════════════════════════════════════════════════════╝"
  fi
  echo ""
  echo "Report generated: $(date)"
} >> "$REPORT_FILE"

# Display summary
echo -e "\n${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}TEST EXECUTION COMPLETE${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"

echo "Results Summary:"
echo -e "  ✓ Passed:  ${GREEN}${TOTAL_PASSED}${NC}"
echo -e "  ✗ Failed:  ${RED}${TOTAL_FAILED}${NC}"
echo -e "  ⊘ Skipped: ${YELLOW}${TOTAL_SKIPPED}${NC}"
echo ""
echo -e "Full report saved to: ${GREEN}${REPORT_FILE}${NC}\n"

# Display part of report
echo -e "${YELLOW}════ REPORT PREVIEW ════${NC}\n"
tail -20 "$REPORT_FILE"

echo -e "\n${YELLOW}════ END OF PREVIEW ════${NC}\n"

# Exit with appropriate code
[ $TOTAL_FAILED -eq 0 ] && exit 0 || exit 1
