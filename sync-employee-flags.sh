#!/bin/bash

# Sync employee flags to all existing employee accounts
# This updates their user documents with isEmployee=true and userType='pro'

echo "🔄 Syncing employee flags to all employee accounts..."

# You need to provide your own admin ID (any string will work for testing)
ADMIN_ID="sync-$(date +%s)"

curl -X POST http://localhost:3000/api/admin/sync-employee-flags \
  -H "Content-Type: application/json" \
  -d "{\"adminId\": \"$ADMIN_ID\"}" \
  | jq '.'

echo ""
echo "✓ Sync complete!"
