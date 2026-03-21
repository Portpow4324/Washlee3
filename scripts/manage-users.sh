#!/bin/bash

# Admin User Management Script
# Lists all users and allows deletion of test users

API_URL="${1:-http://localhost:3001}"

echo "🔍 Fetching all users from $API_URL/api/admin/users..."
echo ""

# Fetch users
RESPONSE=$(curl -s "$API_URL/api/admin/users" -H "Content-Type: application/json")

# Check if it's valid JSON
if ! echo "$RESPONSE" | jq . >/dev/null 2>&1; then
  echo "❌ Failed to fetch users. Is the dev server running on $API_URL?"
  echo "Response: $RESPONSE"
  exit 1
fi

# Display auth users
AUTH_COUNT=$(echo "$RESPONSE" | jq '.authUsersCount')
echo "📧 Auth Users ($AUTH_COUNT):"
echo "$RESPONSE" | jq '.authUsers[] | "\(.email) (ID: \(.id), Created: \(.created_at))"' | sed 's/"//g' | sed 's/^/  - /'

echo ""

# Display customer profiles
CUSTOMER_COUNT=$(echo "$RESPONSE" | jq '.customersCount')
echo "👤 Customer Profiles ($CUSTOMER_COUNT):"
echo "$RESPONSE" | jq '.customers[] | "\(.email) (\(.first_name) \(.last_name), Status: \(.account_status))"' | sed 's/"//g' | sed 's/^/  - /'

echo ""
echo "To delete a user, run:"
echo "  ./scripts/manage-users.sh DELETE email@example.com"
echo ""

# Handle DELETE command
if [ "$1" = "DELETE" ] && [ ! -z "$2" ]; then
  EMAIL="$2"
  echo "⚠️  Deleting user: $EMAIL"
  read -p "Are you sure? (y/n) " -n 1 -r
  echo ""
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    DELETE_RESPONSE=$(curl -s -X DELETE "$API_URL/api/admin/users" \
      -H "Content-Type: application/json" \
      -d "{\"email\":\"$EMAIL\"}")
    
    if echo "$DELETE_RESPONSE" | jq . >/dev/null 2>&1; then
      SUCCESS=$(echo "$DELETE_RESPONSE" | jq '.success')
      if [ "$SUCCESS" = "true" ]; then
        echo "✅ User deleted successfully: $EMAIL"
      else
        ERROR=$(echo "$DELETE_RESPONSE" | jq '.error')
        echo "❌ Error: $ERROR"
      fi
    else
      echo "❌ Failed to delete user"
      echo "Response: $DELETE_RESPONSE"
    fi
  else
    echo "Cancelled."
  fi
fi
