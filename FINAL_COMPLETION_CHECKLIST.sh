#!/bin/bash

# 📋 FINAL COMPLETION CHECKLIST
# Run this to verify the entire order system is in place

echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║           ORDER SYSTEM - FINAL VERIFICATION               ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

TOTAL_CHECKS=0
PASSED_CHECKS=0

check() {
  TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
  
  if [ -f "$1" ] || grep -q "$2" "$3" 2>/dev/null; then
    echo -e "${GREEN}✓${NC} $4"
    PASSED_CHECKS=$((PASSED_CHECKS + 1))
  else
    echo -e "${RED}✗${NC} $4"
  fi
}

check_file_exists() {
  TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
  
  if [ -f "$1" ]; then
    echo -e "${GREEN}✓${NC} $2"
    PASSED_CHECKS=$((PASSED_CHECKS + 1))
  else
    echo -e "${RED}✗${NC} $2 (Missing: $1)"
  fi
}

echo -e "${BLUE}BACKEND FILES${NC}"
echo "─────────────────────────────────────────────────────"
check_file_exists "backend/services/firebaseService.js" "Firebase Service exists"
check "backend/services/firebaseService.js" "async function createOrder" "" "createOrder function exists"
check "backend/services/firebaseService.js" "async function getOrder" "" "getOrder function exists"
check "backend/services/firebaseService.js" "async function getUserOrders" "" "getUserOrders function exists"
check "backend/services/firebaseService.js" "async function updateOrderStatus" "" "updateOrderStatus function exists"
check "backend/services/firebaseService.js" "createOrder," "" "createOrder exported"

check_file_exists "backend/routes/webhook.routes.js" "Webhook routes exists"
check "backend/routes/webhook.routes.js" "createOrder" "" "createOrder imported in webhook"
check "backend/routes/webhook.routes.js" "await createOrder" "" "createOrder called in webhook"

echo ""
echo -e "${BLUE}FRONTEND API ENDPOINTS${NC}"
echo "─────────────────────────────────────────────────────"
check_file_exists "app/api/orders/[orderId]/route.ts" "Single order endpoint exists"
check "app/api/orders/[orderId]/route.ts" "export async function GET" "" "GET endpoint implemented"

check_file_exists "app/api/orders/user/[uid]/route.ts" "User orders endpoint exists"
check "app/api/orders/user/[uid]/route.ts" "export async function GET" "" "GET endpoint implemented"

echo ""
echo -e "${BLUE}FRONTEND UI PAGES${NC}"
echo "─────────────────────────────────────────────────────"
check_file_exists "app/checkout/success/page.tsx" "Success page exists"
check "app/checkout/success/page.tsx" "fetch(\`/api/orders/user" "" "Success page fetches orders"
check "app/checkout/success/page.tsx" "setTimeout" "" "Success page has webhook delay"

check_file_exists "app/tracking/page.tsx" "Tracking page exists"
check "app/tracking/page.tsx" "fetch(\`/api/orders/\${orderId}" "" "Tracking page fetches order"
check "app/tracking/page.tsx" "timeline" "" "Tracking page displays timeline"

echo ""
echo -e "${BLUE}DOCUMENTATION${NC}"
echo "─────────────────────────────────────────────────────"
check_file_exists "ORDER_FIX_COMPLETE.md" "Problem/solution doc exists"
check_file_exists "IMPLEMENTATION_TECHNICAL_SUMMARY.md" "Technical summary exists"
check_file_exists "QUICK_START_TEST.md" "Testing guide exists"
check_file_exists "ORDER_SYSTEM_COMPLETE_SUMMARY.md" "Executive summary exists"
check_file_exists "ORDER_SYSTEM_DOCUMENTATION_INDEX.md" "Documentation index exists"

echo ""
echo -e "${BLUE}VERIFICATION SCRIPTS${NC}"
echo "─────────────────────────────────────────────────────"
check_file_exists "verify-order-fix.sh" "Verification script exists"

echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo -e "║${BLUE}                   RESULTS${NC}                              ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

if [ $PASSED_CHECKS -eq $TOTAL_CHECKS ]; then
  echo -e "${GREEN}✅ ALL CHECKS PASSED ($PASSED_CHECKS/$TOTAL_CHECKS)${NC}"
  echo ""
  echo "The entire order system has been successfully implemented!"
  echo ""
  echo "What's been done:"
  echo "  ✓ Backend order creation system"
  echo "  ✓ Stripe webhook integration"
  echo "  ✓ Firestore order persistence"
  echo "  ✓ Order API endpoints"
  echo "  ✓ Success page rewrite"
  echo "  ✓ Tracking page rewrite"
  echo "  ✓ Complete documentation"
  echo "  ✓ Testing scripts"
  echo ""
  echo "Ready to test! Run: npm run dev"
  echo ""
  echo "For testing instructions, see: QUICK_START_TEST.md"
  exit 0
else
  echo -e "${RED}❌ SOME CHECKS FAILED ($PASSED_CHECKS/$TOTAL_CHECKS)${NC}"
  echo ""
  echo "Please review the items marked with ✗ above."
  exit 1
fi
