# Washlee - On-Demand Laundry Service Marketplace

A full-stack service marketplace application for on-demand laundry pickup and delivery built with **Next.js 14+**, **React**, **TypeScript**, **Tailwind CSS**, **Firebase**, and **Stripe**.

## 🎯 Features

- **Multi-page website** with hero, pricing, testimonials, and FAQ
- **Customer & Pro dashboards** with real-time order tracking
- **Secure authentication** with Firebase Auth (email/password + Google OAuth)
- **Payment processing** with Stripe integration
- **Real-time order tracking** with Firebase listeners
- **Admin panel** for managing orders and users
- **Responsive design** optimized for mobile and desktop
- **Email notifications** ready for SendGrid/Resend integration

## 🛠️ Tech Stack

- **Frontend:** Next.js 14, React 18, TypeScript, Tailwind CSS
- **Backend:** Next.js API routes (Express.js available)
- **Database:** Firebase Firestore
- **Authentication:** Firebase Auth + NextAuth.js
- **Payment:** Stripe (test and live modes)
- **Hosting:** Render, Vercel, or any Node.js server
- **Icons:** Lucide React

## 📁 Project Structure

```
app/
  ├── page.tsx              # Homepage
  ├── how-it-works/         # Service guide
  ├── pricing/              # Pricing & plans
  ├── faq/                  # FAQ page
  ├── pro/                  # Become a Pro
  ├── auth/                 # Login & Signup
  ├── dashboard/            # Customer & Pro dashboards
  ├── booking/              # Booking form
  ├── tracking/             # Order tracking
  └── api/                  # Backend routes

components/
  ├── Header.tsx
  ├── Footer.tsx
  ├── Button.tsx
  └── Card.tsx

lib/
  ├── firebase.ts
  ├── AuthContext.tsx
  └── email-service.ts

backend/                     # Express.js backend (optional)
  ├── routes/
  ├── services/
  └── middleware/
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- Firebase project account
- Stripe account (for payments)
- Google OAuth credentials

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/lukverd79YT/Washlee.git
   cd Washlee
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Add these required variables:
   ```
   # Firebase
   NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_firebase_project_id
   
   # Google OAuth
   GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret
   
   # Stripe
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
   STRIPE_SECRET_KEY=your_stripe_secret_key
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```
   
   Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📦 Available Scripts

```bash
npm run dev       # Start dev server
npm run build     # Build for production
npm start         # Start production server
npm run lint      # Run ESLint
npm run type-check # Check TypeScript types
```

## 🔐 Environment Variables

See `ENV_LOCAL_GUIDE.md` for complete environment variable documentation.

**Key variables:**
- Firebase configuration (public keys)
- Google OAuth credentials
- Stripe API keys
- NextAuth secret
- Admin credentials

## 🚢 Deployment

### Deploy on Render

1. Push code to GitHub
2. Connect repository to Render
3. Add environment variables in Render dashboard
4. Render will auto-deploy on git push

### Deploy on Vercel

1. Import repository
2. Add environment variables
3. Click Deploy

## 📝 API Endpoints

### Authentication
- `POST /api/auth/[...nextauth]` - NextAuth routes

### Orders
- `GET /api/orders/user/[uid]` - Get user's orders
- `POST /api/checkout` - Create payment session
- `POST /api/webhook` - Stripe webhook handler

### Users
- `GET /api/users/check-phone/[phone]` - Check phone availability

## 🗄️ Database Schema

### Users Collection
```
users/{uid}
  - email: string
  - name: string
  - phone: string
  - userType: 'customer' | 'pro'
  - createdAt: timestamp
```

### Orders Collection
```
orders/{orderId}
  - userId: string
  - status: 'pending' | 'confirmed' | 'in-transit' | 'delivered'
  - items: array
  - totalPrice: number
  - deliveryAddress: string
  - createdAt: timestamp
```

## 🔒 Security

- Firebase Security Rules configured for data protection
- NextAuth.js for session management
- API route protection with Bearer tokens
- Stripe webhook signature verification
- Environment variables for sensitive data

## 📧 Support

For support or questions, visit:
- [FAQ Page](/faq)
- [Help Center](/help-center)
- [Contact Us](/contact)

## 📄 License

This project is licensed under the MIT License.

## 👨‍💻 Author

**Luka Verde** - [GitHub](https://github.com/lukverd79YT)

---

**Note:** This is a development repository. For production deployment, ensure all sensitive data is properly configured in your hosting platform's environment variables.
# Washlee
