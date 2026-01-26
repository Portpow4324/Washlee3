#!/bin/bash

# Color codes for terminal output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Title
clear
cat << 'EOF'
╔═══════════════════════════════════════════════════════════════════════╗
║                                                                       ║
║                    🔑 WASHLEE API KEYS HELPER                        ║
║                                                                       ║
║   Getting the 3 remaining API keys (you already have Stripe!)        ║
║                                                                       ║
╚═══════════════════════════════════════════════════════════════════════╝
EOF

echo ""
echo -e "${BLUE}📋 What you need to do:${NC}"
echo "   1. Google Maps API Key (10 min)"
echo "   2. SendGrid API Key (10 min)"
echo "   3. Google OAuth Keys (optional, 10 min)"
echo ""
echo -e "${YELLOW}⏱️  Total time: 20-30 minutes${NC}"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Function to pause and wait for user
wait_for_key() {
    echo -e "${YELLOW}Press Enter when you're done...${NC}"
    read
}

# Function to open URL
open_url() {
    if command -v open &> /dev/null; then
        open "$1"
    elif command -v xdg-open &> /dev/null; then
        xdg-open "$1"
    else
        echo -e "${YELLOW}🌐 Open this URL in your browser:${NC}"
        echo "$1"
    fi
}

# ===========================
# 1. GOOGLE MAPS API KEY
# ===========================
echo ""
echo -e "${GREEN}✅ STEP 1: GET GOOGLE MAPS API KEY${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo -e "${BLUE}1. Go to Google Cloud Console${NC}"
echo "   URL: https://console.cloud.google.com"
echo ""
echo -e "${BLUE}2. Create a new project:${NC}"
echo "   - Click \"Select a Project\" (top left)"
echo "   - Click \"NEW PROJECT\""
echo "   - Name: \"Washlee\""
echo "   - Click \"CREATE\""
echo "   - Wait 30 seconds..."
echo ""
echo -e "${BLUE}3. Search for \"Maps JavaScript API\":${NC}"
echo "   - Click search bar at top"
echo "   - Type: Maps JavaScript API"
echo "   - Click on it"
echo ""
echo -e "${BLUE}4. Click \"ENABLE\"${NC}"
echo "   - Blue button at top"
echo ""
echo -e "${BLUE}5. Create an API Key:${NC}"
echo "   - Click \"Create Credentials\" button"
echo "   - Select \"API Key\""
echo "   - Copy the key (it starts with AIza...)"
echo ""
echo -e "${YELLOW}⏳ Do steps 1-5 above, then press Enter${NC}"
wait_for_key

echo ""
echo -e "${YELLOW}💾 Now I'll help you add this key to .env.local${NC}"
echo ""
echo -e "${BLUE}Paste your Google Maps API Key:${NC}"
read GOOGLE_MAPS_KEY

if [ -z "$GOOGLE_MAPS_KEY" ]; then
    echo -e "${RED}❌ No key entered, skipping Google Maps${NC}"
else
    # Add to .env.local
    if grep -q "GOOGLE_MAPS_API_KEY" .env.local; then
        # Replace existing
        sed -i '' "s/^GOOGLE_MAPS_API_KEY=.*/GOOGLE_MAPS_API_KEY=$GOOGLE_MAPS_KEY/" .env.local
        echo -e "${GREEN}✅ Updated GOOGLE_MAPS_API_KEY${NC}"
    else
        # Add new
        echo "" >> .env.local
        echo "# Google Maps API" >> .env.local
        echo "GOOGLE_MAPS_API_KEY=$GOOGLE_MAPS_KEY" >> .env.local
        echo -e "${GREEN}✅ Added GOOGLE_MAPS_API_KEY${NC}"
    fi
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# ===========================
# 2. SENDGRID API KEY
# ===========================
echo -e "${GREEN}✅ STEP 2: GET SENDGRID API KEY${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo -e "${BLUE}1. Go to SendGrid signup${NC}"
echo "   URL: https://sendgrid.com/free"
echo ""
echo -e "${BLUE}2. Sign up with your email${NC}"
echo "   - Enter email and password"
echo "   - Click \"Create Account\""
echo ""
echo -e "${BLUE}3. Answer setup questions:${NC}"
echo "   - Use case: \"Transactional\""
echo "   - Emails per day: \"Less than 100\""
echo "   - Company size: \"1 person\""
echo ""
echo -e "${BLUE}4. Create API Key:${NC}"
echo "   - In dashboard, click Settings (gear icon)"
echo "   - Click \"API Keys\""
echo "   - Click \"Create API Key\""
echo "   - Name it: \"Washlee App\""
echo "   - Copy the key (it starts with SG.)"
echo ""
echo -e "${YELLOW}⏳ Do steps 1-4 above, then press Enter${NC}"
wait_for_key

echo ""
echo -e "${YELLOW}💾 Now I'll help you add this key to .env.local${NC}"
echo ""
echo -e "${BLUE}Paste your SendGrid API Key:${NC}"
read SENDGRID_KEY

if [ -z "$SENDGRID_KEY" ]; then
    echo -e "${RED}❌ No key entered, skipping SendGrid${NC}"
else
    # Add to .env.local
    if grep -q "SENDGRID_API_KEY" .env.local; then
        # Replace existing
        sed -i '' "s/^SENDGRID_API_KEY=.*/SENDGRID_API_KEY=$SENDGRID_KEY/" .env.local
        echo -e "${GREEN}✅ Updated SENDGRID_API_KEY${NC}"
    else
        # Add new
        echo "" >> .env.local
        echo "# SendGrid Email API" >> .env.local
        echo "SENDGRID_API_KEY=$SENDGRID_KEY" >> .env.local
        echo "SENDGRID_FROM_EMAIL=noreply@washlee.com" >> .env.local
        echo -e "${GREEN}✅ Added SENDGRID_API_KEY and SENDGRID_FROM_EMAIL${NC}"
    fi
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# ===========================
# 3. GOOGLE OAUTH (Optional)
# ===========================
echo -e "${GREEN}✅ STEP 3: GOOGLE OAUTH KEYS (OPTIONAL)${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo -e "${BLUE}This allows users to sign in with Google${NC}"
echo ""
echo "Do you want to set up Google OAuth now? (y/n)"
read SETUP_GOOGLE

if [ "$SETUP_GOOGLE" == "y" ] || [ "$SETUP_GOOGLE" == "Y" ]; then
    echo ""
    echo -e "${BLUE}1. Go to Google Cloud Console${NC}"
    echo "   URL: https://console.cloud.google.com"
    echo ""
    echo -e "${BLUE}2. Make sure you're in the \"Washlee\" project${NC}"
    echo "   - Click project dropdown at top"
    echo "   - Select \"Washlee\""
    echo ""
    echo -e "${BLUE}3. Create OAuth Consent Screen:${NC}"
    echo "   - Click APIs & Services"
    echo "   - Click \"OAuth Consent Screen\""
    echo "   - Select \"External\""
    echo "   - Click \"CREATE\""
    echo "   - App name: \"Washlee\""
    echo "   - User support email: your email"
    echo "   - Developer contact: your email"
    echo "   - Click \"SAVE AND CONTINUE\""
    echo "   - Click \"SAVE AND CONTINUE\" again (scopes)"
    echo "   - Click \"SAVE AND CONTINUE\" again (test users)"
    echo ""
    echo -e "${BLUE}4. Create OAuth Credentials:${NC}"
    echo "   - Click \"Credentials\" (left menu)"
    echo "   - Click \"Create Credentials\""
    echo "   - Select \"OAuth client ID\""
    echo "   - Application type: \"Web application\""
    echo "   - Name: \"Washlee Web\""
    echo ""
    echo -e "${BLUE}5. Add Authorized redirect URIs:${NC}"
    echo "   - Click \"ADD URI\""
    echo "   - Add: http://localhost:3000/api/auth/callback/google"
    echo "   - Click \"ADD URI\""
    echo "   - Add: https://yourdomain.com/api/auth/callback/google"
    echo "   - Replace yourdomain.com with your actual domain"
    echo ""
    echo -e "${BLUE}6. Copy your credentials:${NC}"
    echo "   - Copy Client ID"
    echo "   - Copy Client Secret"
    echo ""
    echo -e "${YELLOW}⏳ Do steps 1-6 above, then press Enter${NC}"
    wait_for_key
    
    echo ""
    echo -e "${YELLOW}💾 Now I'll help you add these keys to .env.local${NC}"
    echo ""
    echo -e "${BLUE}Paste your Google Client ID:${NC}"
    read GOOGLE_CLIENT_ID
    
    echo -e "${BLUE}Paste your Google Client Secret:${NC}"
    read GOOGLE_CLIENT_SECRET
    
    if [ -z "$GOOGLE_CLIENT_ID" ] || [ -z "$GOOGLE_CLIENT_SECRET" ]; then
        echo -e "${RED}❌ Missing credentials, skipping Google OAuth${NC}"
    else
        # Add to .env.local
        sed -i '' "s/^GOOGLE_CLIENT_ID=.*/GOOGLE_CLIENT_ID=$GOOGLE_CLIENT_ID/" .env.local
        sed -i '' "s/^GOOGLE_CLIENT_SECRET=.*/GOOGLE_CLIENT_SECRET=$GOOGLE_CLIENT_SECRET/" .env.local
        echo -e "${GREEN}✅ Updated GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET${NC}"
    fi
else
    echo -e "${YELLOW}⏭️  Skipping Google OAuth for now${NC}"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# ===========================
# FINAL STEPS
# ===========================
echo -e "${GREEN}✅ ALL DONE!${NC}"
echo ""
echo -e "${BLUE}What's next:${NC}"
echo ""
echo "1. Restart your dev server:"
echo -e "   ${YELLOW}npm run dev${NC}"
echo ""
echo "2. Test the features:"
echo -e "   ${YELLOW}Maps:   http://localhost:3000/tracking${NC}"
echo -e "   ${YELLOW}Emails: Create an order${NC}"
echo ""
echo "3. Deploy to production:"
echo -e "   ${YELLOW}npm run build${NC}"
echo -e "   ${YELLOW}vercel deploy --prod${NC}"
echo ""
echo -e "${GREEN}🎉 You're all set!${NC}"
echo ""
