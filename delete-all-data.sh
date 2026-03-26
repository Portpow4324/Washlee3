#!/bin/bash

# DELETE ALL DATA - Complete Backend Reset
# This script deletes everything from your Supabase database

set -e

echo "⚠️  WARNING: This will DELETE ALL DATA from your Supabase database!"
echo "    - All users will be deleted"
echo "    - All orders will be deleted"
echo "    - All transactions will be deleted"
echo "    - All subscriptions will be deleted"
echo "    - Everything will be PERMANENTLY DELETED"
echo ""
read -p "Are you absolutely sure? Type 'DELETE ALL' to confirm: " confirm

if [ "$confirm" != "DELETE ALL" ]; then
    echo "❌ Cancelled. No data was deleted."
    exit 1
fi

echo ""
echo "🔄 Connecting to Supabase and deleting all data..."
echo ""

# Run the deletion script
psql "$DATABASE_URL" < DELETE_ALL_DATA.sql

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ SUCCESS! All data has been deleted from your database."
    echo "   - All tables are now empty"
    echo "   - All sequences have been reset to 1"
    echo "   - You can now start fresh"
else
    echo ""
    echo "❌ ERROR: Failed to delete data. Check your DATABASE_URL"
fi
