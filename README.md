# Washlee - Laundry Service Marketplace

A modern, full-stack web application for connecting customers with professional laundry service providers. Built with Next.js 14, React 18, TypeScript, Tailwind CSS, and Firebase.

## 🚀 Features

### For Customers
- **Browse & Schedule**: Easy booking of laundry pickup and delivery services
- **Real-Time Tracking**: Live updates on order status and driver location
- **Flexible Preferences**: Choose detergent type, folding style, and special care options
- **Dashboard**: View active orders, history, payments, and saved preferences
- **Multiple Payment Methods**: Credit card, debit card, Apple Pay, Google Pay

### For Washlee Pros (Service Providers)
- **Job Board**: Browse available laundry jobs in your area
- **Flexible Scheduling**: Accept/decline jobs on your own schedule
- **Earnings Tracking**: Real-time dashboard showing income and payouts
- **Rating System**: Build your professional reputation with 5-star ratings
- **Weekly Payouts**: Direct deposit every Monday

## 📋 Pages & Routes

### Public Pages
- `/` - Homepage
- `/how-it-works` - Detailed 4-step process
- `/pricing` - Pricing, add-ons, subscription plans
- `/faq` - FAQ with contact options
- `/pro` - Become a Washlee Pro

### Authentication
- `/auth/login` - Login page
- `/auth/signup` - Sign up page

### User Dashboards
- `/dashboard/customer` - Customer portal
- `/dashboard/pro` - Pro dashboard
- `/tracking` - Order tracking

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Firebase
- **Auth**: NextAuth.js + Google OAuth
- **Database**: Firebase Firestore
- **Icons**: Lucide React

## 🎨 Design System

- Primary Color: #48C9B0 (Teal)
- Responsive mobile-first design
- Reusable Button, Card, Header, Footer components
- Smooth animations and transitions

## 🚀 Getting Started

### Installation

```bash
npm install
npm run dev
# Open http://localhost:3000
```

### Environment Variables

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_domain.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_bucket.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key
```

### Commands

```bash
npm run dev      # Development server
npm run build    # Production build
npm start        # Start production server
npm run lint     # Run ESLint
```

## 📁 Project Structure

```
app/
  ├── page.tsx                   # Homepage
  ├── how-it-works/page.tsx      # How it works
  ├── pricing/page.tsx           # Pricing
  ├── faq/page.tsx               # FAQ
  ├── pro/page.tsx               # Become Pro
  ├── tracking/page.tsx          # Order tracking
  ├── auth/
  │   ├── login/page.tsx         # Login
  │   └── signup/page.tsx        # Sign up
  ├── dashboard/
  │   ├── customer/page.tsx      # Customer dashboard
  │   └── pro/page.tsx           # Pro dashboard
  ├── layout.tsx                 # Root layout
  └── globals.css                # Global styles

components/
  ├── Header.tsx                 # Navigation
  ├── Footer.tsx                 # Footer
  ├── Button.tsx                 # Button component
  └── Card.tsx                   # Card component

lib/
  └── firebase.ts                # Firebase config
```

## 📊 Pricing Model

- **$3.00 per kg** - Standard service
- **Minimum order**: $25
- **Premium add-ons**: Hang dry, delicates care, comforters, stain treatment
- **Subscription plans**: Basic, Plus (10% off), Premium (20% off)

## 🐛 Known Limitations

- Authentication is mock (NextAuth not fully configured)
- Payment processing is not functional
- Real-time tracking uses placeholder map
- Order data is not persisted (mock data only)

## 🚀 Next Steps

1. Configure Firebase credentials
2. Set up NextAuth with real OAuth
3. Implement payment processing (Stripe/PayPal)
4. Add email notifications (SendGrid)
5. Integrate Google Maps for tracking
6. Build backend API (Express/Node.js)

## 📧 Support

- Email: support@washly.co
- Phone: 1-800-333-4455

---

**Built with ❤️ by the Washlee Team**
# Washlee
