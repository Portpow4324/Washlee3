# Resend Email Integration - Setup Guide

## ✅ What Was Changed

All SendGrid integration has been removed and replaced with **Resend** for email sending.

### Removed
- ❌ All SendGrid API calls
- ❌ SendGrid configuration requirements  
- ❌ SendGrid fallback to Gmail logic
- ❌ `/lib/sendgrid-email.ts` imports from API routes

### Added
- ✅ Resend client initialization
- ✅ Clean email templates
- ✅ Resend error handling
- ✅ Professional branded emails

## Files Updated

### Core Files
1. **`/lib/resend-email.ts`** - NEW ✨
   - Resend client initialization
   - Email sending function
   - Professional HTML email templates
   - `getEmailTemplates()` for admin/marketing

2. **`/app/api/email-verification/route.ts`**
   - Now uses Resend exclusively
   - Removed SendGrid and Gmail fallback
   - Simplified to single email service

3. **`/app/api/test-email/route.ts`**
   - Updated to test Resend instead of SendGrid
   - Beautiful test email template

4. **`/app/admin/marketing/campaigns/page.tsx`**
   - Updated import from sendgrid-email to resend-email
   - Uses new getEmailTemplates() function

## Setup Instructions

### Step 1: Get Resend API Key

1. Go to **https://resend.com**
2. Sign up for free account
3. Go to **Dashboard → API Keys**
4. Copy your API key

### Step 2: Configure Environment Variables

Add to `.env.local`:

```bash
# Resend Email Service
RESEND_API_KEY=your_resend_api_key_here
RESEND_FROM_EMAIL=noreply@washlee.com
```

### Step 3: Verify Sender Email

1. Go to **Resend Dashboard → Domains**
2. Add your domain or sender email
3. Verify the domain/email (Resend provides instructions)
4. Once verified, you can send emails

### Step 4: Test Email Sending

Visit this URL in your browser:

```
http://localhost:3000/api/test-email?to=your-email@example.com
```

You should receive:
- ✓ Test email within 30 seconds
- ✓ Professional Washlee branding
- ✓ Success confirmation message

## Available Email Templates

The `/lib/resend-email.ts` file includes these professional templates:

### 1. Verification Email
- **Function**: `getVerificationEmailHtml(firstName, code)`
- **Use**: Email verification during signup
- **Template**: 6-digit code display, security warnings, instructions

### 2. Welcome Email
- **Function**: `getWelcomeEmailHtml(firstName)`
- **Use**: New customer onboarding
- **Template**: Welcome message, promo code WELCOME10, benefits list, CTA

### 3. Order Confirmation
- **Function**: `getOrderConfirmationEmailHtml(name, orderId, date, time, amount)`
- **Use**: After order placement
- **Template**: Order details, pickup info, tracking link, next steps

## How to Send Emails

### Via API Route
```typescript
import { sendEmailViaResend, getVerificationEmailHtml } from '@/lib/resend-email'

const html = getVerificationEmailHtml('John', '123456')
await sendEmailViaResend({
  to: 'user@example.com',
  subject: 'Verify Your Email',
  html,
  replyTo: 'support@washlee.com'
})
```

### Usage Examples

**Verification Email:**
```typescript
const html = getVerificationEmailHtml(firstName, verificationCode)
await sendEmailViaResend({
  to: userEmail,
  subject: 'Verify Your Washlee Email Address',
  html
})
```

**Welcome Email:**
```typescript
const html = getWelcomeEmailHtml(firstName)
await sendEmailViaResend({
  to: userEmail,
  subject: 'Welcome to Washlee! Get $10 Off Your First Order',
  html
})
```

**Order Confirmation:**
```typescript
const html = getOrderConfirmationEmailHtml(
  customerName,
  orderId,
  pickupDate,
  pickupTime,
  totalAmount
)
await sendEmailViaResend({
  to: userEmail,
  subject: `Order Confirmed: ${orderId}`,
  html
})
```

## Pricing

**Resend Free Tier:**
- ✓ 100 emails/day
- ✓ Perfect for development
- ✓ No credit card needed

**Resend Paid Tier:**
- $20/month for unlimited emails
- Production-ready
- Professional email deliverability

[View Resend Pricing](https://resend.com/pricing)

## Features

✅ **Easy API** - Simple, intuitive JavaScript API
✅ **Reliable** - Built on AWS infrastructure
✅ **Fast** - Email delivery in <1 second
✅ **Deliverability** - 98%+ inbox placement
✅ **Templates** - HTML and React component support
✅ **Analytics** - Track opens, clicks, bounces
✅ **Webhooks** - Real-time event notifications
✅ **Domain Verification** - Custom domains supported

## Testing Checklist

- [ ] Get Resend API key from dashboard
- [ ] Add RESEND_API_KEY to .env.local
- [ ] Verify sender email in Resend dashboard
- [ ] Test email endpoint: `/api/test-email?to=your@email.com`
- [ ] Check inbox for test email
- [ ] Try signup flow to receive verification email
- [ ] Verify email template displays correctly
- [ ] Check email in multiple clients (Gmail, Outlook, etc.)

## Troubleshooting

### Issue: Email not sending
**Solutions:**
1. Verify RESEND_API_KEY is set in .env.local
2. Restart dev server after adding env vars
3. Check that sender email is verified in Resend dashboard
4. Check Resend logs for errors

### Issue: Email looks wrong
**Solutions:**
1. Resend uses Tailwind utility classes - add to HTML
2. Some email clients don't support all CSS
3. Test in multiple email clients
4. Check browser console for errors

### Issue: High bounce rate
**Solutions:**
1. Verify sender domain is properly configured
2. Use a business domain instead of free email
3. Follow email best practices
4. Check Resend analytics for issues

## API Reference

### `sendEmailViaResend(params)`

```typescript
interface SendEmailParams {
  to: string              // Email recipient
  subject: string         // Email subject
  html: string           // HTML email content
  replyTo?: string       // Reply-to address (optional)
}
```

**Returns**: Promise with Resend response including email ID

**Throws**: Error if API key not configured or request fails

### Template Functions

All template functions return HTML string ready to send:

```typescript
// Verification email
getVerificationEmailHtml(firstName: string, code: string): string

// Welcome email
getWelcomeEmailHtml(firstName: string): string

// Order confirmation
getOrderConfirmationEmailHtml(
  customerName: string,
  orderId: string,
  pickupDate: string,
  pickupTime: string,
  totalAmount: string
): string

// Get available templates for admin
getEmailTemplates(): Array<{
  id: string
  name: string
  subject: string
  description: string
}>
```

## Next Steps

1. **Setup Resend** (follow Setup Instructions above)
2. **Test email sending** (use `/api/test-email`)
3. **Monitor email delivery** (check Resend dashboard)
4. **Customize templates** (edit HTML in `/lib/resend-email.ts`)
5. **Add to more flows** (use in checkout, payments, etc.)

## Production Deployment

When deploying to production:

1. **Add to Vercel environment:**
   - Go to Project Settings → Environment Variables
   - Add `RESEND_API_KEY`
   - Redeploy project

2. **Setup verified domain:**
   - In Resend dashboard, add your domain
   - Follow domain verification steps
   - Update `RESEND_FROM_EMAIL` to your domain

3. **Monitor deliverability:**
   - Check Resend dashboard for bounces
   - Monitor email open/click rates
   - Adjust templates based on performance

## Migration From SendGrid

**What changed:**
- ❌ SendGrid API calls removed
- ✅ Resend API calls added
- ❌ Complex fallback logic removed
- ✅ Simple, clean email service
- ❌ SendGrid configuration removed
- ✅ Resend configuration added

**Impact:**
- Simpler code
- Better error handling
- Professional email design
- Faster email delivery
- Lower cost ($0 free tier vs SendGrid)

## Resources

- **Resend Docs**: https://resend.com/docs
- **API Reference**: https://resend.com/docs/api
- **React Email**: https://react.email/ (for advanced templates)
- **Email Best Practices**: https://resend.com/blog

---

**Status**: ✅ Resend integration complete
**Test Command**: `curl "http://localhost:3000/api/test-email?to=your@email.com"`
**API Key**: Set in `.env.local` as `RESEND_API_KEY`
