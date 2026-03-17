# 🧪 EMAIL INTEGRATION TESTING GUIDE

Quick reference for testing all email integrations.

---

## 1. Order Confirmation Email ✅

**Trigger:** Customer creates an order

**Test Command:**
```bash
curl -X POST http://localhost:3000/api/orders \
  -H "Content-Type: application/json" \
  -d '{
    "uid": "test-user-123",
    "customerName": "John Smith",
    "customerEmail": "test@example.com",
    "orderTotal": 27.50,
    "bookingData": {
      "scheduleDate": "2026-03-15",
      "scheduleTime": "10:00 AM",
      "estimatedWeight": "5.5",
      "pickupAddress": "123 Main St",
      "deliverySpeed": "standard",
      "deliveryAddressLine1": "456 Oak Ave",
      "deliveryCity": "Sydney",
      "deliveryState": "NSW",
      "deliveryPostcode": "2000",
      "detergent": "standard",
      "waterTemp": "cold"
    }
  }'
```

**Expected Email:**
- To: `test@example.com`
- Subject: `Order Confirmed #[orderId] - Pickup 2026-03-15`
- Contains: Order ID, pickup time, weight, service type, total, tracking link

---

## 2. Welcome Email ✅

**Trigger:** Customer completes signup

**How to Test:**
1. Go to http://localhost:3000/auth/signup-customer
2. Fill in all fields:
   - Email: `newtester@example.com`
   - Password: `Test@1234`
   - First Name: `Alex`
   - Last Name: `Johnson`
3. Complete all 4 steps and click "Create Account"

**Expected Email:**
- To: `newtester@example.com`
- Subject: `Welcome to Washlee! Get $10 Off Your First Order`
- Contains: Welcome message, $10 OFF code, booking link

---

## 3. Password Reset Email ✅

**Test Command:**
```bash
curl -X POST http://localhost:3000/api/auth/password-reset \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "firstName": "John"
  }'
```

**Expected Email:**
- To: `user@example.com`
- Subject: `Reset Your Washlee Password`
- Contains: 24-hour reset link, security notice

---

## 4. Order Shipped Email (Picked Up) ✅

**Trigger:** Order status changed to "picked_up"

**Test Command:**
```bash
curl -X POST http://localhost:3000/api/orders/order-abc123/status \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "order-abc123",
    "status": "picked_up",
    "proName": "Sarah Mitchell",
    "estimatedDelivery": "Tomorrow by 2:00 PM"
  }'
```

**Expected Email:**
- To: Customer email from order
- Subject: `Your order order-abc123 has been picked up!`
- Contains: Pro name, estimated delivery time, tracking link

---

## 5. Delivery Notification Email ✅

**Trigger:** Order status changed to "delivering"

**Test Command:**
```bash
curl -X POST http://localhost:3000/api/orders/order-abc123/status \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "order-abc123",
    "status": "delivering",
    "proName": "Sarah Mitchell",
    "deliveryTime": "2:00 PM"
  }'
```

**Expected Email:**
- To: Customer email from order
- Subject: `Your laundry is being delivered - Order order-abc123`
- Contains: Pro name, estimated arrival time, live tracking link

---

## 6. Rating Request Email ✅

**Trigger:** Order status changed to "delivered"

**Test Command:**
```bash
curl -X POST http://localhost:3000/api/orders/order-abc123/status \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "order-abc123",
    "status": "delivered",
    "proName": "Sarah Mitchell"
  }'
```

**Expected Email:**
- To: Customer email from order
- Subject: `How was your Washlee experience?`
- Contains: Pro name, "Earn 10 Loyalty Points!", review link

---

## 7. Pro Order Assignment Email ✅

**Trigger:** Order assigned to a pro

**Test Command:**
```bash
curl -X POST http://localhost:3000/api/pro/assign-order \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "order-abc123",
    "proId": "pro-xyz789",
    "proEmail": "pro@example.com",
    "proName": "Sarah Mitchell",
    "customerName": "John Smith",
    "pickupTime": "10:00 AM",
    "weight": "5.5kg",
    "earnings": "$15.00"
  }'
```

**Expected Email:**
- To: `pro@example.com`
- Subject: `New Order Assigned: #order-abc123`
- Contains: Customer name, pickup time, weight, earnings, order details link

---

## 8. Pro Application Approved Email ✅

**Trigger:** Admin approves pro application

**Test Command:**
```bash
curl -X POST http://localhost:3000/api/pro/application-decision \
  -H "Content-Type: application/json" \
  -d '{
    "proEmail": "newpro@example.com",
    "firstName": "Emma",
    "decision": "approved",
    "proId": "PRO-5847293",
    "dashboardLink": "http://localhost:3000/dashboard/pro"
  }'
```

**Expected Email:**
- To: `newpro@example.com`
- Subject: `🎉 Welcome to Washlee Pro!`
- Contains: Pro ID (highlighted), next steps, dashboard link

---

## 9. Pro Application Rejected Email ✅

**Trigger:** Admin rejects pro application

**Test Command:**
```bash
curl -X POST http://localhost:3000/api/pro/application-decision \
  -H "Content-Type: application/json" \
  -d '{
    "proEmail": "applicant@example.com",
    "firstName": "Michael",
    "decision": "rejected",
    "rejectionReason": "Background check did not clear"
  }'
```

**Expected Email:**
- To: `applicant@example.com`
- Subject: `Update on Your Washlee Pro Application`
- Contains: Rejection reason, encouragement to reapply, support contact

---

## 10. Payment Failed Email ✅

**Trigger:** Stripe charge.failed webhook event

**How to Test:**
1. Create an order with a test card number: `4000 0000 0000 0002` (Stripe declined card)
2. During checkout, use that card
3. Payment will fail
4. Check for email

**Or use curl (if you have Stripe metadata in your charges):**
```bash
# This requires Stripe webhook to be configured
# Email sends automatically when charge.failed event is received
```

**Expected Email:**
- To: Customer email from charge
- Subject: `Payment Issue: Order [orderId]`
- Contains: Error reason, order total, payment update link

---

## 11. Wholesale Inquiry Admin Notification ✅

**Trigger:** Customer submits wholesale inquiry

**How to Test:**
1. Go to http://localhost:3000/wholesale
2. Fill in form with:
   - Company: "Acme Cleaning Co"
   - Contact: "Bob Smith"
   - Email: `bob@acmecleaning.com`
   - Phone: `02 1234 5678`
   - Weight: `150kg`
   - Order Type: "Weekly"
3. Click "Submit Inquiry"

**Expected Email to Admin (wholesale@washlee.com.au):**
- Subject: `New Wholesale Inquiry: Acme Cleaning Co - 150kg`
- Contains: Full inquiry details, action required notice

**Expected Email to Customer (bob@acmecleaning.com):**
- Subject: `We Received Your Wholesale Inquiry - Acme Cleaning Co`
- Contains: Confirmation, expected response time, next steps

---

## 12. Pickup Reminder Email ⏳

**Status:** Not yet implemented

**Scheduled Feature:**
- Sends 24 hours before pickup time
- Requires Firebase Cloud Functions or external scheduler
- See `EMAIL_INTEGRATIONS_COMPLETE.md` for setup

---

## ✅ Verification Checklist

After testing each email:

- [ ] Email arrived in inbox/spam
- [ ] Sender is your Gmail address (from .env.local)
- [ ] Subject line matches expected
- [ ] HTML template renders correctly
- [ ] All variables filled in (names, IDs, links, etc.)
- [ ] Links work (click-through test)
- [ ] Mobile responsive (view on phone)

---

## 🔍 Troubleshooting

### Email Not Arriving?

1. **Check logs:**
   ```
   In browser console or terminal:
   [EMAIL] Email sent to: test@example.com
   ✓ [SERVICE] Email sent successfully
   ```

2. **Check spam folder** - SendGrid emails sometimes go there initially

3. **Verify SendGrid:**
   ```
   SENDGRID_API_KEY=SG... (set in .env.local?)
   GMAIL_ADDRESS=yourname@gmail.com (set in .env.local?)
   ```

4. **Check SendGrid dashboard:**
   - https://app.sendgrid.com/mail_settings/sender_auth
   - Verify your Gmail is listed as "Verified Sender"

5. **Check API error:**
   ```bash
   curl -X GET http://localhost:3000/api/orders
   # Should return: "Orders API is running"
   ```

### Variables Not Showing?

- Check function parameters passed correctly
- Verify template variables match function parameters
- Check for typos in `sendTemplateEmail()` call

### Links Not Working?

- Verify `NEXT_PUBLIC_APP_URL` in .env.local
- Check trackingLink, resetLink, etc. format
- Test links are absolute URLs (start with http://)

---

## 📊 Quick Testing Matrix

| Email | Method | Trigger | Time |
|-------|--------|---------|------|
| Order Confirmation | API POST | Create order | Instant |
| Welcome | Manual | Complete signup | Instant |
| Password Reset | API POST | Request reset | Instant |
| Order Shipped | API POST | Set status | Instant |
| Delivery | API POST | Set status | Instant |
| Rating | API POST | Set status | Instant |
| Pro Assignment | API POST | Assign order | Instant |
| Pro Approved | API POST | Send decision | Instant |
| Pro Rejected | API POST | Send decision | Instant |
| Wholesale (Admin) | Manual | Submit form | Instant |
| Wholesale (Customer) | Manual | Submit form | Instant |
| Payment Failed | Auto | Charge fails | Instant |
| Pickup Reminder | Scheduled | 24h before | Daily |

---

**Remember:** All email functions use non-blocking error handling. If SendGrid fails, the operation continues (e.g., order created even if email fails).

