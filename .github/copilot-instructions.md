# Copilot Instructions - Washlee Website

## Project Overview
Washlee is a **full-stack service marketplace application** for on-demand laundry pickup and delivery. Built with Next.js 14+, TypeScript, Tailwind CSS, Firebase, and React. Features multi-page website, customer and pro dashboards, real-time order tracking, and authentication.

## Tech Stack
- **Frontend**: Next.js 14, React 18, TypeScript, Tailwind CSS
- **Backend**: Next.js API routes (can be extended to Express/Node.js)
- **Auth**: NextAuth.js (email/password + Google OAuth)
- **Database**: Firebase (Firestore + Auth)
- **Real-time**: Firebase Realtime DB / Firestore listeners
- **Email**: SendGrid / Resend integration ready
- **Icons**: Lucide React

## Project Structure

app/
  ├── page.tsx              # Homepage (hero, how-it-works, pricing preview, testimonials)
  ├── how-it-works/page.tsx # Detailed 4-step guide
  ├── pricing/page.tsx      # Pricing, add-ons, subscription plans, FAQ
  ├── faq/page.tsx          # FAQ with contact form
  ├── pro/page.tsx          # Become a Washlee Pro signup
  ├── tracking/page.tsx     # Real-time order tracking
  ├── auth/
  │   ├── login/page.tsx    # Login page
  │   └── signup/page.tsx   # Signup (customer + pro selection)
  ├── dashboard/
  │   ├── customer/page.tsx # Customer dashboard (orders, payments, preferences)
  │   └── pro/page.tsx      # Pro dashboard (available jobs, earnings, ratings)
  ├── layout.tsx            # Root layout
  └── globals.css           # Global styles + Tailwind

components/
  ├── Header.tsx            # Navigation with mobile menu
  ├── Footer.tsx            # Footer with links
  ├── Button.tsx            # Reusable button (primary, outline, ghost)
  └── Card.tsx              # Reusable card component

lib/
  └── firebase.ts           # Firebase initialization

public/                      # Static assets

tailwind.config.ts           # Tailwind config with Washlee colors
.env.local                   # Environment variables (Firebase, NextAuth, etc.)
```

## Design System

### Colors
- **Primary**: `#48C9B0` (teal) - main brand color
- **Light**: `#f7fefe` - backgrounds
- **Dark**: `#1f2d2b` - text
- **Gray**: `#6b7b78` - secondary text
- **Mint**: `#E8FFFB` - hero gradients
- **Accent**: `#7FE3D3` - lighter teal highlights

### Components Pattern
All components are client-side (`'use client'`). Button and Card are reusable with variants:
- **Button**: `primary` | `outline` | `ghost` sizes `sm` | `md` | `lg`
- **Card**: Basic card with optional `hoverable` prop

### Responsive Design
Mobile-first: single column base, grid layouts via Tailwind breakpoints (`md:`, `lg:`).

## Key Features

### Public Pages
- **Homepage**: Hero, 4-step process, 6 benefits, pricing preview, testimonials, CTA
- **How It Works**: Detailed alternating layout with icons and descriptions
- **Pricing**: $3.00/kg model, add-ons (hang dry, delicates, comforters, stain treatment), 3 subscription tiers
- **FAQ**: Accordion-style Q&A, contact form, live chat placeholder
- **Become a Pro**: Earnings info, requirements, application form

### Authentication Pages
- **Login**: Email/password + Google OAuth
- **Signup**: Customer or Pro selection, form validation

### Protected Pages (Mock Data)
- **Customer Dashboard**: Active orders, order history, payment methods, preferences
- **Pro Dashboard**: Available jobs, active jobs, completed jobs, earnings/payouts
- **Order Tracking**: Real-time progress steps, map placeholder, pro contact info

## Development Patterns

### State Management
- Local React state for form handling and tabs
- Firebase for authentication (to be implemented)
- Mock data currently used—replace with API calls

### Form Handling
```tsx
const [formData, setFormData] = useState({ field: '' })
const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value })
```

### Navigation
All navigation via Next.js `Link` component. Header includes mobile menu toggle via `useState`.

## Styling Approach
- Tailwind CSS for utility-first styling
- Custom colors defined in `tailwind.config.ts`
- Global components in `/components` (Header, Footer reused on all pages)
- Custom CSS for transitions and animations in `app/globals.css`

## Commands & Workflows

```bash
npm install                  # Install dependencies
npm run dev                  # Start dev server (http://localhost:3000)
npm run build               # Build for production
npm run start               # Start production server
npm run lint                # Run ESLint
```

## Next Steps / Integration Points

1. **Firebase Setup**: Add real Firebase credentials to `.env.local`
2. **NextAuth Integration**: Configure OAuth providers and Firestore adapter
3. **Database Schema**: Design Firestore collections (users, orders, pros, reviews, transactions)
4. **Order Lifecycle API**: Create backend routes for order creation, updates, status tracking
5. **Real-time Notifications**: Set up Firestore listeners for order status
6. **Payment Integration**: Stripe/PayPal for checkout
7. **Email Service**: Configure SendGrid or Resend for order confirmations
8. **Maps Integration**: Google Maps API for real-time tracking
9. **Image Uploads**: Firebase Storage for profile pictures, order images
10. **Error Boundaries & Loading States**: Add where needed

## Common Patterns

### Creating a New Page
1. Create folder: `app/new-page/`
2. Add `page.tsx` with `'use client'` if interactive
3. Import Header/Footer, Button, Card components
4. Use Tailwind classes for styling
5. Add to Header navigation if needed

### Adding Navigation Link
- Update Header.tsx `nav` links
- Update mobile menu in Header
- Update Footer links if appropriate

---

**Last Updated**: January 18, 2026
