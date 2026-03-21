# 📧 Washlee Branded Email Confirmation

## Email Design

```
┌─────────────────────────────────────────┐
│                                         │
│  ╔═══════════════════════════════════╗  │
│  ║   [Teal Gradient Background]      ║  │
│  ║                                   ║  │
│  ║              🧺                    ║  │
│  ║                                   ║  │
│  ║   Confirm Your Email              ║  │
│  ║   Welcome to Washlee              ║  │
│  │                                   │  │
│  ╚═══════════════════════════════════╝  │
│                                         │
│  Hi there,                              │
│                                         │
│  Thanks for signing up! To get          │
│  started with Washlee and book your     │
│  first laundry order, please confirm    │
│  your email address by clicking the     │
│  button below.                          │
│                                         │
│         ┌─────────────────────┐         │
│         │ Confirm Email       │         │
│         │ Address             │         │
│         └─────────────────────┘         │
│      (Teal gradient button)              │
│                                         │
│  Or copy and paste this link in your    │
│  browser:                               │
│                                         │
│  https://your-app.com/auth/            │
│  callback?code=xxxxx...                 │
│                                         │
│  ┌───────────────────────────────────┐  │
│  │ 🎉 Welcome Bonus!                 │  │
│  │                                   │  │
│  │ Get $10 OFF your first order      │  │
│  │ with code WELCOME10               │  │
│  └───────────────────────────────────┘  │
│     (Light teal background)             │
│                                         │
│  This link expires in 24 hours. If      │
│  you didn't create this account, you    │
│  can safely ignore this email.          │
│                                         │
│  © 2026 Washlee Inc.                    │
│  Privacy Policy | Terms of Service      │
│                                         │
└─────────────────────────────────────────┘
```

## Color Palette

- **Primary Teal**: `#48C9B0`
- **Secondary Teal**: `#7FE3D3`
- **Background Light**: `#f7fefe`
- **Text Dark**: `#1f2d2b`
- **Text Gray**: `#6b7b78`
- **Alert Light**: `#E8FFFB`

## Key Features

✅ **Professional Design**
- Matches Washlee brand colors
- Modern gradient header
- Clear visual hierarchy

✅ **Mobile Responsive**
- Works on all screen sizes
- Readable on small screens
- Touch-friendly button

✅ **Security & Trust**
- 24-hour expiration notice
- Backup plain text link
- Fraud warning (if ignored)
- Professional footer

✅ **Promotional**
- Welcome bonus highlighted
- Promo code included
- Drives first purchase

✅ **Accessible**
- Plain text fallback
- High contrast colors
- Clear instructions

## Customization

### Change the Welcome Bonus
In `lib/emailService.ts`, update:
```html
<p style="margin: 0; font-size: 14px; color: #1f2d2b;">
  Get <strong>$10 OFF</strong> your first order with code <strong>WELCOME10</strong>
</p>
```

### Change Header Colors
```typescript
style="background: linear-gradient(135deg, #48C9B0 0%, #7FE3D3 100%);"
```

### Add Company Logo
Add before the emoji:
```html
<img src="https://your-domain.com/logo.png" style="height: 40px; margin-bottom: 10px;" alt="Washlee" />
```

### Change Confirmation Button Text
```html
<a href="${vars.confirmLink}" style="...">
  Your Custom Text Here
</a>
```

## Implementation Status

| Component | Status | Location |
|-----------|--------|----------|
| Template | ✅ Done | `lib/emailService.ts` |
| Function | ✅ Done | `lib/emailService.ts` |
| API Endpoint | ✅ Done | `app/api/auth/send-confirmation/route.ts` |
| Signup Flow | ✅ Ready | `app/auth/signup-customer/page.tsx` |
| SendGrid Setup | ⏳ Optional | `.env.local` |

## Test the Email

1. Create new account at `/auth/signup-customer`
2. Check console logs for email output:
   ```
   [EMAIL] Branded confirmation email sent to: user@example.com
   ```
3. (If SendGrid configured) Check inbox for branded email
4. Click confirmation link in email

## Production Setup

To enable real email sending:

1. **Get SendGrid Account**
   - Go to https://sendgrid.com/
   - Create free account
   - Verify sender email

2. **Add API Keys to `.env.local`**
   ```env
   SENDGRID_API_KEY=SG.xxxxxxxxxxxx
   SENDGRID_FROM_EMAIL=noreply@washlee.com
   ```

3. **Deploy to Production**
   - Copy `.env.local` variables to hosting platform
   - Users will receive branded confirmation emails

## Support

For issues:
- Check `.env.local` has API keys
- Verify email in SendGrid dashboard
- Check console logs for errors
- Review `lib/emailService.ts` for template customization

---

**Status**: ✅ Branded Email Confirmation Ready  
**Updated**: March 20, 2026
