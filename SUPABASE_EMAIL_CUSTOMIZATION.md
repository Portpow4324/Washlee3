# Supabase Email Template Customization Guide

## Overview
Your signup flow now uses **Supabase's built-in email verification**. The verification email is sent automatically by Supabase, and you can customize its design to match your Washlee branding.

## How to Customize Email Template

### Step 1: Login to Supabase Dashboard
1. Go to: https://app.supabase.com
2. Select your project
3. Navigate to: **Authentication** (left sidebar)
4. Click: **Email Templates**

### Step 2: Edit "Confirm signup" Template

1. In the Email Templates section, find **"Confirm signup"**
2. Click the **Edit** button
3. You'll see the template editor with:
   - **Subject**: Email subject line
   - **Body**: HTML/CSS email template

### Step 3: Customize the Template

#### Basic Customization (Easy)

**Change Colors:**
Replace the teal color (`#48C9B0`) with your brand colors:
```html
<!-- Primary color -->
background-color: #48C9B0;  <!-- Change to your color -->

<!-- Link color -->
color: #48C9B0;             <!-- Change to your color -->
```

**Change Logo/Images:**
Update the logo URL:
```html
<img src="YOUR_LOGO_URL_HERE" alt="Washlee" style="height: 40px;">
```

**Change Text:**
Modify the greeting and instructions:
```html
<h1>Welcome to Washlee</h1>
<p>Confirm your email address to get started</p>
```

#### Advanced Customization (Professional)

**Template Variables Available:**
- `{{ .ConfirmationURL }}` - The verification link
- `{{ .Data.email }}` - User's email address
- `{{ .Data.firstName }}` - User's first name (if provided)

**Example Usage:**
```html
<p>Hi {{ .Data.firstName }},</p>
<p>Please confirm your email address ({{ .Data.email }}) to activate your Washlee account.</p>
```

### Step 4: Design a Professional Email Template

Here's a complete example matching Washlee branding:

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background-color: #f7fefe;
      margin: 0;
      padding: 20px;
    }
    .email-container {
      max-width: 500px;
      margin: 0 auto;
      background-color: white;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(31, 45, 43, 0.1);
    }
    .header {
      background: linear-gradient(135deg, #48C9B0 0%, #7FE3D3 100%);
      padding: 40px 20px;
      text-align: center;
      color: white;
    }
    .logo {
      height: 50px;
      margin-bottom: 20px;
    }
    .header h1 {
      margin: 0;
      font-size: 28px;
      font-weight: 600;
    }
    .header p {
      margin: 10px 0 0 0;
      font-size: 16px;
      opacity: 0.95;
    }
    .content {
      padding: 40px 30px;
      color: #1f2d2b;
    }
    .greeting {
      font-size: 18px;
      font-weight: 600;
      margin-bottom: 15px;
    }
    .message {
      font-size: 14px;
      line-height: 1.6;
      color: #6b7b78;
      margin-bottom: 30px;
    }
    .cta-button {
      display: inline-block;
      background-color: #48C9B0;
      color: white;
      padding: 14px 40px;
      text-decoration: none;
      border-radius: 6px;
      font-weight: 600;
      font-size: 16px;
      transition: background-color 0.2s;
    }
    .cta-button:hover {
      background-color: #3ba59a;
    }
    .link-notice {
      font-size: 12px;
      color: #6b7b78;
      margin-top: 20px;
      padding-top: 20px;
      border-top: 1px solid #e8fffb;
    }
    .footer {
      background-color: #f7fefe;
      padding: 30px;
      text-align: center;
      font-size: 12px;
      color: #6b7b78;
      border-top: 1px solid #e8fffb;
    }
    .footer a {
      color: #48C9B0;
      text-decoration: none;
    }
  </style>
</head>
<body>
  <div class="email-container">
    <!-- Header with Logo -->
    <div class="header">
      <!-- Replace with your logo URL -->
      <img src="https://your-domain.com/washlee-logo.png" alt="Washlee" class="logo">
      <h1>Welcome to Washlee</h1>
      <p>Your laundry, our passion</p>
    </div>

    <!-- Main Content -->
    <div class="content">
      <div class="greeting">Hi {{ .Data.firstName }},</div>
      
      <div class="message">
        <p>Thank you for joining Washlee! We're excited to have you on board.</p>
        
        <p>To get started with our laundry pickup and delivery service, please confirm your email address by clicking the button below:</p>
      </div>

      <!-- CTA Button -->
      <center>
        <a href="{{ .ConfirmationURL }}" class="cta-button">
          Confirm Email Address
        </a>
      </center>

      <!-- Link Notice -->
      <div class="link-notice">
        <p style="margin: 0;">
          If the button above doesn't work, you can also confirm your email by clicking this link:
        </p>
        <p style="margin: 10px 0 0 0; word-break: break-all;">
          <a href="{{ .ConfirmationURL }}" style="color: #48C9B0; text-decoration: none;">
            {{ .ConfirmationURL }}
          </a>
        </p>
      </div>
    </div>

    <!-- Footer -->
    <div class="footer">
      <p style="margin: 0 0 10px 0;">
        This link expires in 24 hours for security purposes.
      </p>
      <p style="margin: 0;">
        © 2024 Washlee. All rights reserved. |
        <a href="https://your-domain.com/privacy">Privacy Policy</a>
      </p>
    </div>
  </div>
</body>
</html>
```

**Subject Line Customization:**
```
Confirm your Washlee account
```

### Step 5: Save Template

1. Copy the customized HTML into the Body field
2. Update the Subject line
3. Click: **Save** button
4. Confirmation: "Template updated successfully"

## Colors to Use (Washlee Brand Palette)

- **Primary Teal**: `#48C9B0` - Main brand color
- **Accent Teal**: `#7FE3D3` - Lighter teal for accents
- **Mint Background**: `#E8FFFB` - Light mint for backgrounds
- **Dark Text**: `#1f2d2b` - Main text color
- **Gray Text**: `#6b7b78` - Secondary text
- **Light Background**: `#f7fefe` - Light backgrounds

## Template Variables

### Available in Your Email:

| Variable | Example | Description |
|----------|---------|-------------|
| `{{ .ConfirmationURL }}` | `https://yourapp.com/auth/callback#access_token=...` | The verification link user clicks |
| `{{ .Data.email }}` | `user@example.com` | User's email address |
| `{{ .Data.firstName }}` | `John` | User's first name (from signup metadata) |
| `{{ .Data.lastName }}` | `Doe` | User's last name (from signup metadata) |

## Best Practices

### ✅ Do's
- ✅ Include a clear call-to-action button
- ✅ Provide both button and link fallback
- ✅ Use your brand colors
- ✅ Keep email responsive (mobile-friendly)
- ✅ Include company footer with links
- ✅ Use professional fonts
- ✅ Test in multiple email clients
- ✅ Keep it concise and focused

### ❌ Don'ts
- ❌ Don't include password or sensitive info
- ❌ Don't use excessive graphics (slows email)
- ❌ Don't use high-contrast colors (accessibility)
- ❌ Don't forget the verification link
- ❌ Don't make text too small (hard to read)
- ❌ Don't use unoptimized images (slow delivery)
- ❌ Don't forget mobile responsiveness
- ❌ Don't remove the expiration notice

## Testing Your Template

### Step 1: Save Template in Supabase
- Create and save your custom template
- No app restart needed (takes effect immediately)

### Step 2: Test Signup
1. Go to `/auth/signup-customer`
2. Create test account
3. Wait for email to arrive
4. Verify:
   - ✓ Colors match your brand
   - ✓ Logo displays correctly
   - ✓ Text is readable
   - ✓ Button looks good
   - ✓ Layout is responsive (test on phone)
   - ✓ Link works correctly

### Step 3: Check Email Clients
Test template appearance in:
- [ ] Gmail
- [ ] Outlook
- [ ] Apple Mail
- [ ] Mobile email apps
- [ ] Yahoo Mail

## Reverting to Default

If you want to go back to Supabase's default template:

1. Go to: Authentication → Email Templates → "Confirm signup"
2. Click: **Reset to Default**
3. Confirm: You want to revert

## Troubleshooting

### Email Not Showing Custom Design
**Solutions:**
1. Clear browser cache
2. Wait a few minutes for changes to propagate
3. Create new test account
4. Check email client spam settings
5. Verify HTML syntax is correct

### Variables Not Showing
**Solutions:**
1. Verify variable syntax: `{{ .Data.fieldName }}`
2. Make sure field names are camelCase
3. Check that user provided field in signup
4. Test with fallback text if field is missing

### Images Not Displaying
**Solutions:**
1. Use full HTTPS URLs (not relative paths)
2. Verify image server allows external access
3. Test image URL in browser
4. Use base64 encoded images as fallback
5. Consider using CSS colors instead of images

## Advanced: Custom Fields

If you want to pass additional data to email:

1. Update signup form to include metadata:
```typescript
// In handleCreateAccount()
data: {
  firstName,
  lastName,
  personalUse,
  phone,  // Add custom fields
  state
}
```

2. Use in email template:
```html
<p>Phone: {{ .Data.phone }}</p>
```

## Next Steps

1. ✅ Customize email template (this guide)
2. ✅ Test with real signup flow
3. ✅ Monitor email delivery in production
4. ✅ Adjust template based on feedback
5. ✅ Consider A/B testing different designs

## Resources

- **Supabase Docs**: https://supabase.com/docs/guides/auth/custom-email
- **Email Template Best Practices**: https://litmus.com/email-template-guide
- **HTML Email Checklist**: https://www.campaignmonitor.com/dev-resources/

## Email Template Checklist

When customizing your template, ensure:

- [ ] Brand colors are correct
- [ ] Logo loads and displays properly
- [ ] Header is visually appealing
- [ ] Greeting uses user's first name
- [ ] Main message is clear
- [ ] CTA button is prominent and clickable
- [ ] Link fallback is provided
- [ ] Footer includes company info
- [ ] Responsive design works on mobile
- [ ] Expires in 24 hours notice is visible
- [ ] No technical jargon
- [ ] Professional tone
- [ ] Tested in multiple email clients
- [ ] Images are optimized
- [ ] Security notice if appropriate
- [ ] Easy unsubscribe option (if needed)

---

**Status**: Ready for customization
**Time to Customize**: 15-30 minutes
**Impact**: Immediate (no code changes needed)
