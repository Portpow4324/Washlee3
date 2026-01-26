# Washlee - Quick Start Guide

## 🚀 Getting Started in 5 Minutes

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Development Server
```bash
npm run dev
```
Open **http://localhost:3000** in your browser

### 3. Explore the Pages

| Route | Description |
|-------|-------------|
| `/` | Homepage with hero, features, pricing |
| `/how-it-works` | Detailed 4-step process |
| `/pricing` | Service pricing and add-ons |
| `/faq` | FAQ and contact form |
| `/pro` | Become a Washlee Pro |
| `/auth/login` | Customer/Pro login |
| `/auth/signup` | Create account |
| `/dashboard/customer` | Customer orders and preferences |
| `/dashboard/pro` | Pro jobs and earnings |
| `/tracking` | Order tracking |

---

## 📁 Key Files to Know

**Pages** → `app/*/page.tsx`
**Components** → `components/*.tsx`
**Styles** → `app/globals.css` and Tailwind classes
**Config** → `tailwind.config.ts`, `tsconfig.json`
**Firebase** → `lib/firebase.ts`

---

## 🎨 Tailwind Colors

Use these custom colors in Tailwind classes:

```
primary (teal)    → bg-primary, text-primary, hover:bg-primary
light             → bg-light, text-light
dark              → text-dark, bg-dark
gray              → text-gray
mint              → bg-mint
accent            → hover:bg-accent, text-accent
```

---

## 🧩 Reusable Components

### Button
```tsx
import Button from '@/components/Button'

<Button variant="primary" size="lg">Click me</Button>
// Variants: primary (default), outline, ghost
// Sizes: sm, md (default), lg
```

### Card
```tsx
import Card from '@/components/Card'

<Card hoverable>
  <h3>Card Title</h3>
  <p>Card content</p>
</Card>
```

### Header & Footer
```tsx
import Header from '@/components/Header'
import Footer from '@/components/Footer'

// Already included on most pages
```

---

## 🛠️ Common Tasks

### Create a New Page
1. Create folder: `app/new-page/`
2. Create file: `app/new-page/page.tsx`
3. Add content:
```tsx
'use client'

import Header from '@/components/Header'
import Footer from '@/components/Footer'

export default function NewPage() {
  return (
    <>
      <Header />
      <main className="max-w-7xl mx-auto px-4 py-12">
        {/* Your content */}
      </main>
      <Footer />
    </>
  )
}
```
4. Update Header.tsx navigation

### Add a Form
```tsx
const [formData, setFormData] = useState({ email: '', password: '' })

const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  setFormData({ ...formData, [e.target.name]: e.target.value })
}

const handleSubmit = (e: React.FormEvent) => {
  e.preventDefault()
  console.log(formData)
}

return (
  <form onSubmit={handleSubmit}>
    <input
      type="email"
      name="email"
      value={formData.email}
      onChange={handleChange}
      className="px-4 py-2 border border-gray rounded-lg"
    />
    <Button type="submit">Submit</Button>
  </form>
)
```

### Use State Management
```tsx
const [activeTab, setActiveTab] = useState('active')

return (
  <button onClick={() => setActiveTab('active')}>
    Active
  </button>
)
```

---

## 🎯 Next Integration Steps

### 1. Firebase Setup
Add your Firebase credentials to `.env.local`:
```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_domain
# ... other Firebase config
```

### 2. Payment Integration
Add Stripe keys to `.env.local`:
```env
NEXT_PUBLIC_STRIPE_KEY=your_public_key
STRIPE_SECRET_KEY=your_secret_key
```

### 3. Email Service
Configure SendGrid:
```env
SENDGRID_API_KEY=your_api_key
```

### 4. Google OAuth
Add Google OAuth credentials:
```env
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret
```

---

## 🐛 Troubleshooting

**Port 3000 in use?**
```bash
npm run dev -- -p 3001
```

**Build errors?**
```bash
rm -rf .next
npm run build
```

**Tailwind styles not showing?**
- Check `app/globals.css` imports
- Verify `tailwind.config.ts` has correct content paths
- Restart dev server

**TypeScript errors?**
- Run `npm run lint` to see all issues
- Check file extensions (.tsx not .ts for React components)

---

## 📚 Useful Resources

- [Next.js Docs](https://nextjs.org/docs)
- [React Hooks](https://react.dev/reference/react/hooks)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [TypeScript](https://www.typescriptlang.org/docs/)
- [Lucide Icons](https://lucide.dev)

---

## 🚀 Deployment Checklist

- [ ] Update `.env.local` with production values
- [ ] Test all pages in production build (`npm run build`)
- [ ] Update domain in `NEXTAUTH_URL`
- [ ] Add Firebase production project
- [ ] Configure payment processing
- [ ] Set up email service
- [ ] Deploy to Vercel
- [ ] Set custom domain
- [ ] Enable HTTPS
- [ ] Monitor with analytics

---

## 📧 Support

Questions or issues? Check:
1. `.github/copilot-instructions.md` - AI coding guidelines
2. `.github/PROJECT_SUMMARY.md` - Project overview
3. `README.md` - Full documentation

---

**Happy coding! 🎉**
