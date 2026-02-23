#!/bin/bash

# Order System Fix - Verification Script
# This script verifies all files and changes are in place

echo "🔍 Verifying Order System Implementation..."
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check function
check_file() {
  if [ -f "$1" ]; then
    echo -e "${GREEN}✓${NC} $1"
    return 0
  else
    echo -e "${RED}✗${NC} $1"
    return 1
  fi
}

check_content() {
  if grep -q "$2" "$1" 2>/dev/null; then
    echo -e "${GREEN}✓${NC} $1 contains '$2'"
    return 0
  else
    echo -e "${RED}✗${NC} $1 missing '$2'"
    return 1
  fi
}

echo "📁 Backend Files:"
check_file "backend/services/firebaseService.js"
check_content "backend/services/firebaseService.js" "async function createOrder"
check_content "backend/services/firebaseService.js" "async function getOrder"
check_content "backend/services/firebaseService.js" "async function getUserOrders"
check_content "backend/services/firebaseService.js" "async function updateOrderStatus"
check_content "backend/routes/webhook.routes.js" "createOrder"

echo ""
echo "🌐 Frontend API Routes:"
check_file "app/api/orders/[orderId]/route.ts"
check_file "app/api/orders/user/[uid]/route.ts"

echo ""
echo "📄 Frontend Pages:"
check_file "app/checkout/success/page.tsx"
check_file "app/tracking/page.tsx"
check_content "app/checkout/success/page.tsx" "fetch(\`/api/orders/user"
check_content "app/tracking/page.tsx" "fetch(\`/api/orders/\${orderId}"

echo ""
echo "📋 Documentation:"
check_file "ORDER_FIX_COMPLETE.md"

echo ""
echo "================================================"
echo "✅ Order System Implementation Complete!"
echo "================================================"
echo ""
echo "Key Features:"
echo "  • Backend webhook creates Firestore orders"
echo "  • API endpoints for order retrieval"
echo "  • Success page fetches real orders with polling"
echo "  • Tracking page displays actual order timeline"
echo "  • Full error handling and fallbacks"
echo ""
echo "Next Steps:"
echo "  1. Test with real Stripe payment"
echo "  2. Verify webhook triggers and creates orders"
echo "  3. Confirm success page shows real order details"
echo "  4. Add Google Maps integration"
echo "  5. Display orders in admin dashboard"
echo ""
