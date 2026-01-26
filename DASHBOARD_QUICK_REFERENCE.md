# Dashboard Quick Reference

## Navigation Structure

```
Dashboard Layout (layout.tsx)
├── Dashboard Home (page.tsx)
├── My Orders (/orders)
├── Addresses (/addresses)
├── Payments (/payments)
├── Subscriptions (/subscriptions)
├── Security (/security)
├── Support (/support)
└── Mobile App (/mobile)
```

## Page Features at a Glance

### Dashboard Home
- **Path**: `/dashboard`
- **Contains**: Welcome message, stats, active orders, quick actions
- **Key Components**: 3 stat cards, active orders list, 6 quick action links

### My Orders
- **Path**: `/dashboard/orders`
- **Contains**: Order history with status tracking
- **Key Components**: Order list, status badges, pagination, Track/Reorder buttons

### Addresses
- **Path**: `/dashboard/addresses`
- **Contains**: Saved delivery addresses
- **Key Components**: Address list, Add/Edit/Delete forms, Set Default option

### Payments
- **Path**: `/dashboard/payments`
- **Contains**: Payment methods and transaction history
- **Key Components**: Saved cards, Add Card form, Transaction table

### Subscriptions
- **Path**: `/dashboard/subscriptions`
- **Contains**: Current subscription and plan comparison
- **Key Components**: Current plan card, 3 plan tiers, Billing history, Cancel modal

### Security
- **Path**: `/dashboard/security`
- **Contains**: Password, 2FA, sessions, and login history
- **Key Components**: Change password form, 2FA toggle, Active sessions, Login history

### Support
- **Path**: `/dashboard/support`
- **Contains**: Help articles, FAQs, and contact form
- **Key Components**: Search bar, Category filters, 24 expandable articles, Contact form

### Mobile App
- **Path**: `/dashboard/mobile`
- **Contains**: App information and downloads
- **Key Components**: Download buttons, Features, System requirements, App FAQ

## Authentication Flow

```
Sign Up
  ↓
Create Account
  ↓
Complete Profile (/auth/complete-profile)
  ↓
✅ Redirect to Homepage (/) 
   → New users see homepage
   → They can explore and understand Washlee

Login
  ↓
/auth/login
  ↓
Check profile completion
  ↓
✅ Redirect to /dashboard/{userType}
   → Returning users go straight to dashboard
   → They have existing orders and data
```

## Responsive Behavior

### Desktop (md: breakpoint and above)
- Sidebar always visible on left
- Main content takes up remaining width
- Grid layouts: 2-3 columns depending on page

### Mobile (below md: breakpoint)
- Hamburger menu in header
- Full-width content
- Grid layouts: 1 column

## Mock Data Examples

### Order
```javascript
{
  id: '#WL-2402-001',
  date: 'Jan 20, 2024',
  status: 'In Washing',
  weight: '5 kg',
  items: 'Jeans, T-shirts, Socks',
  cost: '$36.00'
}
```

### Address
```javascript
{
  id: 1,
  label: 'Home',
  address: '123 Main St',
  city: 'San Francisco',
  state: 'CA',
  postcode: '94102',
  isDefault: true
}
```

### Subscription Plan
```javascript
{
  name: 'Pro',
  price: '$19.99',
  period: '/month',
  features: [
    { text: 'Unlimited orders', included: true },
    { text: 'Free pickup & delivery', included: true },
    ...
  ]
}
```

## Component Usage

### Button Component
```tsx
<Button>Primary Button</Button>
<Button variant="outline">Outline Button</Button>
<Button variant="ghost">Ghost Button</Button>
<Button size="sm">Small</Button>
<Button size="lg">Large</Button>
```

### Card Component
```tsx
<Card>Regular Card</Card>
<Card hoverable>Hoverable Card</Card>
<Card className="custom-class">Custom Card</Card>
```

## Quick Navigation Links

| Page | URL | Icon |
|------|-----|------|
| Dashboard | `/dashboard` | Home |
| Orders | `/dashboard/orders` | Package |
| Addresses | `/dashboard/addresses` | MapPin |
| Payments | `/dashboard/payments` | CreditCard |
| Subscriptions | `/dashboard/subscriptions` | Settings |
| Security | `/dashboard/security` | Lock |
| Support | `/dashboard/support` | LifeBuoy |
| Mobile App | `/dashboard/mobile` | Smartphone |

## Styling Constants

- **Primary Color**: #1B7A7A (Teal)
- **Accent Color**: #7FE3D3 (Light Teal)
- **Mint Background**: #E8FFFB
- **Light Background**: #f7fefe
- **Dark Text**: #1f2d2b
- **Gray Text**: #6b7b78
- **Border**: #d0d5d4

## Key Features

✅ **Authentication Guard**: Redirects to `/auth/login` if not authenticated
✅ **Responsive Design**: Works on mobile, tablet, and desktop
✅ **Mock Data**: Easy to replace with real API calls
✅ **State Management**: Client-side with React hooks
✅ **User Personalization**: Shows user's name throughout dashboard
✅ **Quick Actions**: Fast navigation to common tasks
✅ **Real-time Updates**: Ready for Firebase real-time listeners

## Common Tasks

### Add New Address
1. Click "Add Address" button on Addresses page
2. Fill form (Label, Address, City, State, Postcode)
3. Click "Add Address" to save

### Change Password
1. Go to Security page
2. Fill Current Password, New Password, Confirm New Password
3. Click "Update Password"
4. See success message

### Filter Support Articles
1. Go to Support page
2. Click category button or use search bar
3. Articles filter in real-time
4. Click article to expand and read

### View Order Details
1. Go to My Orders page
2. Each order shows full details in list
3. Click "Track" to see real-time tracking
4. Click "Reorder" to place same order again

---

**Last Updated**: [Current Date]
**Version**: 1.0 - Complete Dashboard Implementation
