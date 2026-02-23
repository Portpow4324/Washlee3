#!/bin/bash

# Washlee Backend Quick Start Script

echo "🚀 Washlee Backend Setup"
echo "========================"
echo ""

# Check Node.js
if ! command -v node &> /dev/null; then
  echo "❌ Node.js not installed. Please install Node.js 18+"
  exit 1
fi

echo "✅ Node.js $(node -v)"
echo ""

# Check if .env exists
if [ ! -f .env ]; then
  echo "⚠️  .env file not found"
  echo ""
  echo "Creating .env from .env.example..."
  cp .env.example .env
  echo "✅ .env created (update with your credentials)"
  echo ""
  echo "Required values:"
  echo "  - FIREBASE_SERVICE_ACCOUNT_KEY"
  echo "  - STRIPE_SECRET_KEY"
  echo "  - STRIPE_WEBHOOK_SECRET"
  echo ""
  echo "Edit: nano .env"
  echo ""
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

if [ $? -eq 0 ]; then
  echo "✅ Dependencies installed"
  echo ""
  echo "🎯 Next steps:"
  echo ""
  echo "1. Update .env with your credentials:"
  echo "   nano .env"
  echo ""
  echo "2. Start server:"
  echo "   npm run dev"
  echo ""
  echo "3. Test health check:"
  echo "   curl http://localhost:3001/health"
  echo ""
  echo "📖 Documentation:"
  echo "   - README.md - Overview and setup"
  echo "   - INTEGRATION_GUIDE.md - Complete integration steps"
  echo "   - API_REFERENCE.md - All endpoints"
  echo ""
else
  echo "❌ Failed to install dependencies"
  exit 1
fi
