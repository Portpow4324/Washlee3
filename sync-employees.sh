#!/bin/bash

# Employee Record Sync Script
# This script syncs all approved employees to the 'employees' collection

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🔄 Starting Employee Records Sync...${NC}"
echo ""

# Check if curl is available
if ! command -v curl &> /dev/null; then
    echo -e "${RED}❌ curl not found. Please install curl.${NC}"
    exit 1
fi

# Get admin ID (you can set this or use a dummy value for testing)
ADMIN_ID="${1:-admin-sync-$(date +%s)}"

echo -e "${YELLOW}📝 Syncing with Admin ID:${NC} $ADMIN_ID"
echo ""

# Make the sync request
echo -e "${YELLOW}⏳ Sending sync request to API...${NC}"

RESPONSE=$(curl -s -X POST http://localhost:3000/api/admin/sync-employee-records \
  -H "Content-Type: application/json" \
  -d "{\"adminId\": \"$ADMIN_ID\"}")

echo ""
echo -e "${YELLOW}Response:${NC}"
echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"

# Parse response for status
if echo "$RESPONSE" | grep -q '"success": true'; then
    SYNCED=$(echo "$RESPONSE" | jq '.synced' 2>/dev/null || echo "?")
    ERRORS=$(echo "$RESPONSE" | jq '.errors' 2>/dev/null || echo "?")
    echo ""
    echo -e "${GREEN}✅ Sync completed!${NC}"
    echo -e "   Synced: ${GREEN}$SYNCED records${NC}"
    if [ "$ERRORS" != "0" ]; then
        echo -e "   Errors: ${RED}$ERRORS${NC}"
    fi
else
    echo ""
    echo -e "${RED}❌ Sync failed!${NC}"
fi

echo ""
echo -e "${YELLOW}📋 Summary:${NC}"
echo "   - All approved employees should now be in 'employees' collection"
echo "   - You can now login with your Employee ID"
echo ""
