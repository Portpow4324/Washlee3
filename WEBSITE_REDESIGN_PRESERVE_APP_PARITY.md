# Website Redesign Guardrails: Preserve Mobile App Parity

This website can be redesigned visually, but it must keep the working backend, mobile app contracts, and business flows intact.

Use this file before any large Claude/AI redesign pass. The goal is: make the website look newer and more consistent with the mobile app, without deleting routes, breaking API payloads, changing auth behavior, or replacing real data with mock UI.

## Current Sources Of Truth

- Mobile app repo: `/Users/lukaverde/Developer/Washlee/washlee_mobile`
- Website repo: `/Users/lukaverde/Developer/Website.BUsiness`
- Live website: `https://washlee3-llqy.onrender.com`
- Live API base: `https://washlee3-llqy.onrender.com/api`
- Mobile app default API base: `lib/config/api_config.dart` in the Flutter app

## Redesign Scope

Claude can redesign:

- Public marketing pages: home, about, services, pricing, how it works, FAQ, contact, pro, mobile app, legal/education pages.
- Customer dashboard UI: dashboard, orders, addresses, payments, settings, security, support, subscriptions, Wash Club.
- Pro/employee dashboard UI: dashboard, jobs, orders, earnings, payout/settings pages.
- Booking, checkout, tracking, success and auth page layouts.
- Shared React components, Tailwind classes, spacing, typography, responsive layout, states, motion, and visual consistency.
- Animated transitions, scroll reveals, soft motion, interactive backgrounds, and lightweight 3D-style visual effects, as long as they do not slow the site down or make the flow harder to use.

## Visual Direction

The redesigned website should feel newer, calmer, and easier to use than the current version. The current site has too much information at once, especially on mobile. The new design should guide people to the next action quickly.

Mobile is the priority:

- Design mobile-first, then expand for desktop.
- Keep each mobile screen focused on one main action.
- Use short sections, clear headings, and obvious CTAs.
- Avoid long walls of text.
- Avoid crowded cards and repeated marketing blocks.
- Make booking, sign in, sign up, tracking, and pro jobs very easy to find.
- Keep buttons large enough for thumbs.
- Keep forms simple and readable.
- Keep the bottom of each mobile viewport useful, not overloaded.

Desktop can be richer:

- Desktop can use wider layouts, more visual polish, and more supporting content.
- Desktop can include immersive sections, richer motion, and larger background visuals.
- Do not make desktop so busy that the main CTA gets lost.

Animation and background rules:

- Allowed: smooth page transitions, card hover motion, fade/slide reveals, soft parallax, animated gradients, subtle floating laundry/product visuals, and lightweight 3D-style scenes.
- Allowed: generated or real background images that feel related to Washlee, laundry pickup, folded clothes, clean homes, delivery, or professional care.
- Keep animations subtle and useful. Motion should guide the user, not distract them.
- Avoid heavy WebGL/Three.js unless it is genuinely lightweight and tested on mobile.
- Avoid autoplaying motion that makes the page feel chaotic.
- Respect `prefers-reduced-motion`.
- Do not use huge image/video backgrounds on mobile unless optimized and lazy-loaded.
- No decorative effect should block a form, button, price, order status, or booking step.

Claude must not change unless explicitly requested:

- API route paths under `app/api/**`.
- Request/response payload shapes used by the mobile app.
- Supabase table/column names.
- Auth/session logic.
- Order status/stage enum strings.
- Pricing calculation behavior.
- Stripe/PayPal checkout behavior.
- Google Places proxy behavior.
- Mobile-specific endpoints under `app/api/mobile/**`.
- Pro switch endpoint behavior under `app/api/auth/pro-switch`.
- Existing environment variable names.
- Database migrations.

If a visual change needs data that does not exist yet, hide that section or leave a code TODO. Do not show fake values.

## Mobile App Features The Website Must Preserve

### Auth And Role Flow

The mobile app supports:

- Customer signup/login.
- Pro signup/signin.
- Switching from customer mode to pro mode using a 6-digit Pro ID.
- Switching from pro mode back to customer mode.
- Optional biometric gate on mobile before pro switch.
- Same email can be a customer and a pro; pros do not need an `@washlee.com` email.

Website routes/API that must keep working:

- `/auth/login`
- `/auth/signin`
- `/auth/signup`
- `/auth/signup-customer`
- `/auth/employee-signin`
- `/auth/pro-signup-form`
- `/api/auth/login`
- `/api/auth/signup`
- `/api/auth/employee-login`
- `/api/auth/pro-switch`
- `/api/auth/get-profile`

Important: do not assume pro email domains. Use the real employee/pro record and Pro ID verification.

### Booking

The mobile app and website must preserve:

- Address autocomplete through `/api/places/autocomplete`.
- Address details/verification through `/api/places/details` and `/api/places/verify`.
- Pickup/delivery scheduling through `/api/scheduling/pickup` and `/api/scheduling/delivery`.
- Server pricing quote through `/api/mobile/pricing`.
- Order creation through existing order APIs.
- Success/checkout/tracking handoff after booking.

Do not replace server pricing with hardcoded frontend-only prices. The UI can show local estimates while loading, but final review/checkout totals must come from the canonical backend quote.

### Customer Orders And Tracking

The mobile app expects:

- Customer orders list.
- Active and past orders.
- Order details.
- Tracking by order id.
- Delivery status payload including assigned pro and current location when available.

Keep these APIs/routes stable:

- `/api/mobile/customer/orders`
- `/api/orders`
- `/api/orders/details`
- `/api/orders/[orderId]`
- `/api/orders/[orderId]/status`
- `/api/orders/user/[uid]`
- `/api/delivery/status/[orderId]`
- `/tracking`
- `/tracking/[id]`

### Pro Jobs And Orders

The mobile app expects:

- Available jobs.
- Accept/deny job.
- Active pro orders.
- Completed pro orders.
- Pro order status transition.
- Pro location update while doing jobs.
- Pro earnings.
- Pro availability/settings.

Keep these APIs/routes stable:

- `/api/mobile/pro/orders`
- `/api/mobile/pro/order-status`
- `/api/mobile/pro/location`
- `/api/employee/available-jobs`
- `/api/employee/deny-job`
- `/api/employee/orders`
- `/api/employee/earnings`
- `/api/employee/availability`
- `/api/employee/profile`
- `/api/pro/orders`
- `/api/pro/earnings`
- `/pro/dashboard`
- `/pro/jobs`
- `/pro/orders`
- `/pro/earnings`
- `/pro/settings`
- `/employee/dashboard`
- `/employee/jobs`
- `/employee/orders`
- `/employee/earnings`
- `/employee/settings`

Do not route pro screens to customer order pages unless the route is intentionally shared and preserves pro navigation.

### Device Tokens And Notifications

The mobile app has a stable register/unregister API wrapper. Firebase/APNs setup may still be pending, but the website/backend route must stay:

- `/api/mobile/device-tokens`
- `/api/notifications`
- `/api/notifications/preferences`
- `/api/notifications/send`
- `/api/notifications/user/[userId]`

### Payments, Subscriptions, Wash Club

The mobile app and website need:

- Stripe checkout/update/manage routes.
- Current subscription route.
- Wash Club membership/credits.
- Wallet balance/transactions.
- Charges/refund history.

Keep these stable:

- `/api/subscriptions/get-current`
- `/api/subscriptions/update`
- `/api/subscriptions/manage`
- `/api/subscriptions/cancel`
- `/api/subscriptions/create-checkout-session`
- `/api/wash-club/membership`
- `/api/wash-club/apply-credits`
- `/api/wash-club/complete-enrollment`
- `/api/wallet/balance`
- `/api/wallet/transactions`
- `/api/payments/stripe/intent`
- `/api/payments/stripe/webhook`
- `/api/payments/paypal/order`
- `/api/payments/paypal/capture`

If saved card data is not returned by an API, do not mock Visa/Mastercard cards.

### Admin And Operations

The website has admin/back-office surfaces that the mobile app depends on indirectly:

- Pro approvals.
- Employee/pro code management.
- Order assignment.
- Users.
- Payouts.
- Subscriptions.
- Support tickets.
- Wash Club.
- Analytics/monitoring.

Preserve:

- `/admin`
- `/admin/dashboard`
- `/admin/orders`
- `/admin/users`
- `/admin/inquiries`
- `/admin/pro-applications`
- `/admin/employee-codes`
- `/admin/payouts`
- `/admin/subscriptions`
- `/admin/support-tickets`
- `/admin/wash-club`
- `/admin/analytics`
- `/admin/monitoring`
- `/api/admin/**`

## Real Data Rules

Do:

- Render sections only when real API/provider data exists.
- Use loading, empty, and error states.
- Keep forms wired to the same submit handlers.
- Keep auth redirects intact.
- Keep route names and URL paths stable.
- Keep user-facing errors friendly.

Do not:

- Add fake order counts.
- Add fake pro ratings.
- Add fake payment cards or last4 values.
- Add fake ABNs, phone numbers, support emails, or company identifiers.
- Add fake payout history.
- Add fake location tracking.
- Add fake status-transition buttons that do not call a real endpoint.
- Hide API errors by silently doing nothing.
- Replace real data flows with static mock arrays.

## App Store / Production Safety

Before redesign is considered safe:

- No visible TODO/dev placeholder copy.
- No raw database or Stripe IDs shown to users.
- No `error.toString()` blobs in user-facing toast/snackbar copy.
- No fake reset-password success unless a real reset email is sent.
- No Google Maps key exposed incorrectly.
- No unlicensed images in public onboarding/marketing pages.
- No dead buttons.
- No buttons that look clickable but do nothing.
- No admin-only links visible to normal customers/pros.

## Validation Commands

Run these from `/Users/lukaverde/Developer/Website.BUsiness` after redesign changes:

```bash
npm run type-check
npm run lint
npm run build
```

If lint/build exposes existing unrelated issues, document them clearly and still fix all issues caused by the redesign.

## Manual Smoke Test Checklist

After deploy, test:

1. Open `/booking`.
2. Search an address with autocomplete.
3. Complete a customer booking.
4. Confirm the order appears in customer orders/tracking.
5. Sign in as a pro.
6. Confirm the new order appears in available jobs.
7. Accept the job.
8. Confirm it moves to pro active orders.
9. Advance job status if endpoint is available.
10. Confirm customer tracking updates.
11. Open customer dashboard pages: orders, addresses, payments, subscriptions, settings, security, support.
12. Open pro pages: dashboard, jobs, orders, earnings, settings.
13. Open admin pages: orders, users, pro applications, employee codes, support tickets.
14. Run the mobile app against `https://washlee3-llqy.onrender.com/api` and confirm it still talks to the website backend.

## Paste Prompt For Claude

Use this prompt when starting the website redesign session:

```text
You are redesigning the Washlee website frontend only. The backend/API/database contracts are already working and deployed, and the Flutter mobile app depends on them.

Read and follow WEBSITE_REDESIGN_PRESERVE_APP_PARITY.md before editing.

Goal:
- Redesign the website with the newer Washlee mobile app visual system and Claude Design-level polish.
- Make pages feel modern, consistent, responsive, and production-ready.
- Make the website much easier to use on mobile. The current website has too much information at once and feels hard to direct. Simplify it.
- Mobile-first: each mobile screen should have one obvious purpose and one obvious next action.
- Desktop can be richer, but the main CTA and core flow must stay obvious.
- You may add animated transitions, scroll reveals, soft parallax, animated background imagery, and lightweight 3D-style visual effects, but keep them subtle, fast, and useful.
- Respect prefers-reduced-motion and optimize images/motion for mobile performance.
- Preserve every working business flow and mobile API contract.

Hard rules:
- Do not change app/api/** route paths or request/response payload shapes unless explicitly required and documented.
- Do not break /api/mobile/**, /api/auth/pro-switch, /api/mobile/pricing, /api/places/*, /api/scheduling/*, order APIs, pro APIs, subscription APIs, notification APIs, or admin APIs.
- Do not remove working auth, booking, checkout, tracking, customer dashboard, pro dashboard, or admin functionality.
- Do not replace real data with mock data.
- Do not add fake pro ratings, fake cards, fake payout rows, fake phone numbers, fake ABNs, fake order counts, or fake location data.
- If a design section needs backend data that does not exist, hide it or leave an internal code TODO only.
- Keep customer/pro role behavior: same email can be a customer and a pro; pro access uses the real 6-digit Pro ID, not an @washlee.com email assumption.
- Keep booking totals server-quoted. Local prices may be temporary estimates, but Review/checkout must use the backend quote.
- Do not add animations or background effects that cover, delay, or confuse booking, sign in, signup, tracking, pro jobs, or payment actions.

Prioritize redesigning:
1. Public home/marketing pages.
2. Booking and checkout.
3. Customer dashboard/account pages.
4. Orders and tracking.
5. Pro dashboard/jobs/orders/earnings/settings.
6. Auth/signin/signup/pro switch flow.
7. Admin pages only after customer/pro flows are safe.

Validation required:
- npm run type-check
- npm run lint
- npm run build
- Manual smoke test: booking -> customer order/tracking -> pro available job -> accept -> pro active order -> tracking update.

Report at the end:
- Files changed.
- What was redesigned.
- What backend/API behavior was preserved.
- Any hidden sections because real data does not exist.
- Any validation failures and whether they were pre-existing or caused by this pass.
```
