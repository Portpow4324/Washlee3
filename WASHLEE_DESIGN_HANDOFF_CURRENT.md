# Washlee Design Handoff — Current State

**Status:** This document supersedes the May 11 brief in `CLAUDE_CODE_WEBSITE_IMPLEMENTATION_PROMPT.md` for "current product state." That file remains as historical context; this one is the truth as of the post-May-11 design migration. Guardrails in `WEBSITE_REDESIGN_PRESERVE_APP_PARITY.md` still apply.

**Last verified:** Phase 1–4 complete plus optional handoff cleanup (campaigns Edit/Delete, notification preferences, /auth/email-confirmed Direction A polish, labelled placeholder-review sections, Google OAuth, Apple OAuth pre-code).

**Validation at last build:** `npm run type-check` ✅ pass · `npm run build` ✅ pass (299 static pages).

---

## 1. Production direction

- **Direction A only.** Direction B is not used anywhere in production code and should not be reintroduced.
- The system is built on the tokens defined in [tailwind.config.ts](tailwind.config.ts) and [app/globals.css](app/globals.css).
- All polished pages share the same canonical primitives: `surface-card`, `input-field`, `label-field`, `btn-primary`, `btn-outline`, `btn-ghost`, `pill`, `bg-soft-hero`, `bg-soft-mint`, `container-page`.
- iPhone frames are not embedded anywhere in the website. Mobile screens were translated into responsive Next.js pages.

---

## 2. Canonical business rules (as of this handoff)

| Rule | Value |
|---|---|
| Standard wash & fold | **$7.50/kg** |
| Express same-day | **$12.50/kg** |
| Minimum order | **$75 AUD, GST inclusive** |
| Currency | **AUD** (everywhere customer-facing) |
| Bag sizes | **Medium ~10kg** and **Large ~15kg** only — no small bag |
| Service area | **Greater Melbourne, Australia** |
| Wash Club | **Free loyalty only** — no paid tiers, no membership fee |
| Paid subscriptions | **Removed from public marketing**; legacy admin view neutralised |
| Pro pay model | **Independent contractor / subcontractor, paid commission per completed order** — never hourly wage, salary, $32/hr, $20–35/hr, 1099, or W9 |
| Damage protection at checkout | Basic (included), Premium (+$3.50), Premium+ (+$8.50) |
| Real add-ons | Hang dry (+$16.50). No dry clean / leather / suede / comforter / scent boost / conditioning / waterproofing / stain treatment / premium packaging / wrinkle-free upsells |
| Tax language | **AU only** — ABN, GST, BAS. Never 1099 / W9 / US tax |

Forbidden copy that has been removed everywhere customer-facing:
`Bay Area`, `Los Angeles`, `San Diego`, `San Francisco`, US zip codes, US states, "ZIP code", US phone formats, 401k, "fake nationwide" claims, fake stats (50K customers, 500+ Pros, 4.9★, $70k Pro earnings), and the `Washly` typo.

The only remaining mention of "United States" is a legitimate cloud-residency disclosure on [app/privacy-policy/page.tsx](app/privacy-policy/page.tsx#L96) — kept for Privacy Act compliance.

The two surviving "no hourly" / "not per hour" mentions on [app/pro/page.tsx](app/pro/page.tsx#L60) and [app/pro/page.tsx](app/pro/page.tsx#L102) are explicit negations — correct framing, kept on purpose.

---

## 3. Public marketing pages — current implementation

All migrated to Direction A. No fake stats. Australia/Melbourne context throughout.

| Route | File | Status |
|---|---|---|
| Home | [app/page.tsx](app/page.tsx) | Quick-estimate hero card with $7.50/$12.50/$75; no fake "50K customers"; free Wash Club teaser; Melbourne pill |
| Pricing | [app/pricing/page.tsx](app/pricing/page.tsx) | Medium/Large bag picker, calculator, real $75 minimum; no $3/kg, no subscription gating |
| How it works | [app/how-it-works/page.tsx](app/how-it-works/page.tsx) | "Washlee" not "Washly"; mobile-first cards |
| Wash Club | [app/wash-club/page.tsx](app/wash-club/page.tsx) | Explicit "free forever, no membership fee, ever" |
| FAQ | [app/faq/page.tsx](app/faq/page.tsx) | Real services + canonical pricing only |
| Contact | [app/contact/page.tsx](app/contact/page.tsx) | Melbourne address, AU phone format, posts to `/api/contact` (now real) |
| About | [app/about/page.tsx](app/about/page.tsx) | No fake stats / fake team |
| Mobile app | [app/mobile-app/page.tsx](app/mobile-app/page.tsx) | iOS / Android download links + service-area context |
| Notifications | [app/notifications/page.tsx](app/notifications/page.tsx) | Real Supabase realtime list + filters |
| Damage protection | [app/damage-protection/page.tsx](app/damage-protection/page.tsx) | Coverage tiers match booking ($3.50/$8.50) |
| Protection plan | [app/protection-plan/page.tsx](app/protection-plan/page.tsx) | Same |
| Care guide | [app/care-guide/page.tsx](app/care-guide/page.tsx) | Real fabric care; no fake $2/$0.50/$25 add-ons |
| Gift cards | [app/gift-cards/page.tsx](app/gift-cards/page.tsx) | $75–$500 AUD, no fake redemption math |
| Privacy policy | [app/privacy-policy/page.tsx](app/privacy-policy/page.tsx) | Australian Privacy Act 1988 + APPs |
| Terms of service | [app/terms-of-service/page.tsx](app/terms-of-service/page.tsx) | Victorian governing law, AU Consumer Law |
| Cookie policy | [app/cookie-policy/page.tsx](app/cookie-policy/page.tsx) | CCPA references removed |
| Careers | [app/careers/page.tsx](app/careers/page.tsx) | AU job listings, no $120K USD salary tiers, no 401k |
| Help centre | [app/help-center/page.tsx](app/help-center/page.tsx) | Melbourne service area, $7.50/kg |
| Pro support | [app/pro-support/page.tsx](app/pro-support/page.tsx) | AU ABN/GST/BAS guidance, in-app messages |

**Footer** ([components/Footer.tsx](components/Footer.tsx)): Melbourne context, support@washlee.com.au, no broken `/dashboard/pro` link.

**Header** ([components/Header.tsx](components/Header.tsx)): No public "Plans" / "Subscriptions" CTAs. "Wash Club" capitalisation.

**Placeholder reviews:** [components/marketing/PlaceholderReviews.tsx](components/marketing/PlaceholderReviews.tsx) is used on the home page, pricing page, and local landing-page template. These are fake/sample conversion-layout reviews by request, but every section and card is visibly marked "Fake sample data" / "Placeholder review" / "Fake data". They must be replaced with verified reviews or hidden before public launch. Do not add fake reviews to JSON-LD or any review schema.

---

## 4. Subscriptions story (everywhere)

- **Public:** Hidden. No paid subscription marketing anywhere.
- **Customer dashboard:** [app/dashboard/subscriptions/page.tsx](app/dashboard/subscriptions/page.tsx) is neutralised — always shows "Pay per order + free Wash Club rewards", regardless of what the API returns.
- **Cancellation:** [app/cancel-subscription/page.tsx](app/cancel-subscription/page.tsx) and [app/dashboard/subscription/cancel/page.tsx](app/dashboard/subscription/cancel/page.tsx) say "no subscription to cancel — Washlee is pay-per-order".
- **Backend:** [app/api/subscriptions/plans/route.ts](app/api/subscriptions/plans/route.ts) returns `{ success: true, plans: [], pricingModel: "pay_per_order", currency: "AUD", washClub: { paidMembership: false } }` for stable mobile contract compatibility.
- **Admin:** [app/admin/subscriptions/page.tsx](app/admin/subscriptions/page.tsx) labelled "Subscriptions (legacy)", read-only, no fabricated dollar amounts.
- **Wash Club is never merged with paid plans, and is never described as paid.**

---

## 5. Booking, checkout, customer flow

| Item | File | Status |
|---|---|---|
| Booking | [app/booking/page.tsx](app/booking/page.tsx) | $7.50/$12.50/$75 enforced; protection modal pricing fixed to $3.50/$8.50; >25kg Wash Club gate removed; 45kg pre-book ceiling. **Bag system is "1 bag = 10kg" (Medium-equivalent).** No Small bag. |
| Booking-hybrid (legacy) | [app/booking-hybrid/page.tsx](app/booking-hybrid/page.tsx) | Replaced with redirect to `/booking` to retire stale $3/kg copy |
| Checkout | [app/checkout/page.tsx](app/checkout/page.tsx) | Direction A polish; Stripe Elements + `/api/payments` POST + `/api/orders` PATCH preserved verbatim |
| Payment success | [app/payment-success/page.tsx](app/payment-success/page.tsx) | Polished; preserves `orderId` query, links into tracking |
| Tracking | [app/tracking/page.tsx](app/tracking/page.tsx) + [app/tracking/[id]/page.tsx](app/tracking/[id]/page.tsx) | Real Supabase order + customer/pro lookups; `LiveTracking` waits for real coordinates and does not seed fake map locations or fake Pro ratings; cancelled-order state shown clearly with red badge + 24-hour auto-removal note |
| Customer orders | [app/dashboard/orders/page.tsx](app/dashboard/orders/page.tsx) | Cancel order (with reason modal), Cancel All bulk action, Clear Cancelled, Request Refund (Stripe/PayPal handoff), Remove from List — all preserved with `window.confirm` guards. Status pills clearly differentiate cancelled. |
| Order detail | [app/dashboard/orders/[id]/page.tsx](app/dashboard/orders/[id]/page.tsx) | Redirects to `/tracking?orderId=…` (canonical) |
| Wash Club dashboard | [app/dashboard/washclub/page.tsx](app/dashboard/washclub/page.tsx) | Free loyalty status, tier preview, no paid framing |

**Order timeline / proof:** Status timeline is rendered through `LiveTracking` and the cancellation panel includes the next-steps list (refund timing, support email). Per-step photo/proof drilldown is **designed-only, backend not exposed yet** — see §13.

**Customer support:** [app/dashboard/support/page.tsx](app/dashboard/support/page.tsx) is in-app support entry. Order-scoped messaging links from tracking back to the support tab — represented in design but not yet a per-order chat thread (see §13).

**Auth pages (Direction A polished):** [/auth/login](app/auth/login/page.tsx), [/auth/signin](app/auth/signin/page.tsx) (choice screen), [/auth/employee-signin](app/auth/employee-signin/page.tsx), [/auth/verify-email-code](app/auth/verify-email-code/page.tsx), [/auth/signup-customer](app/auth/signup-customer/page.tsx), [/auth/forgot-password](app/auth/forgot-password/page.tsx) (new route), [/auth/email-confirmed](app/auth/email-confirmed/page.tsx) (now Direction A — see §10).

**Google / Apple OAuth:** [components/OAuthButtons.tsx](components/OAuthButtons.tsx) is used on customer login and customer signup. Google OAuth is wired through [lib/oauthClient.ts](lib/oauthClient.ts), [/auth/callback](app/auth/callback/page.tsx), and [app/api/auth/oauth-profile/route.ts](app/api/auth/oauth-profile/route.ts). Apple OAuth is pre-coded but intentionally disabled until Apple Developer + Supabase Apple provider setup is complete. To enable later: configure Apple in Supabase Auth, add the production and local callback URLs (`/auth/callback`) to Supabase redirect URLs, then set `NEXT_PUBLIC_ENABLE_APPLE_AUTH=true`. Existing pro/admin/employee OAuth users keep their role; the OAuth profile endpoint only creates a customer profile for customer users.

---

## 6. Pro / employee implementation

All pages migrated to Direction A. Commission language only.

| Page | File | Notes |
|---|---|---|
| /pro | [app/pro/page.tsx](app/pro/page.tsx) | "Paid per order, not per hour"; AU requirements; no $15K–$70K/year fake tiers |
| /pro-v2 | [app/pro-v2/page.tsx](app/pro-v2/page.tsx) | Redirects to `/pro` |
| /pro-support | [app/pro-support/page.tsx](app/pro-support/page.tsx) | AU ABN/GST/BAS guidance; commission language only |
| /auth/pro-signup-form | [app/auth/pro-signup-form/page.tsx](app/auth/pro-signup-form/page.tsx) | Migrated to Direction A — see §10 |
| /employee/dashboard | [app/employee/dashboard/page.tsx](app/employee/dashboard/page.tsx) | Real `pro_earnings` / `pro_jobs` / `orders` fetch. Removed fake `totalRating: 4.9`, fake "+12% / +2 new / 142 reviews / +5 nearby" deltas, fake "98% completion / 95% on-time" panel |
| /employee/jobs | [app/employee/jobs/page.tsx](app/employee/jobs/page.tsx) | Real `/api/employee/available-jobs`. Removed `$4.80/kg` fallback estimate and "Est. 2 hours" copy. Open-job placeholder when order details haven't loaded |
| /employee/orders | [app/employee/orders/page.tsx](app/employee/orders/page.tsx) | Real Supabase + customer-profile lookups. **Hardcoded 80% commission split removed.** Order total shown as-is with "your commission appears in earnings" note |
| /employee/orders/[orderId] | [app/employee/orders/[orderId]/page.tsx](app/employee/orders/[orderId]/page.tsx) | Direction A; `EmployeeOrderMap`; previously placeholder Start Pickup button now wired to `supabase.from('orders').update({ status })` for `confirmed → in-progress → completed` |
| /employee/earnings | [app/employee/earnings/page.tsx](app/employee/earnings/page.tsx) | Real `pro_earnings` + CSV export. Removed `****5678` fake bank account and fake 85%/15% paid/pending bar. AU tax (ABN/GST/BAS) replaces 1099 |
| /employee/payout | [app/employee/payout/page.tsx](app/employee/payout/page.tsx) | AU bank fields (BSB + account number); "Transaction / everyday" replaces US "Checking"; $50 minimum guard preserved |
| /employee/settings | [app/employee/settings/page.tsx](app/employee/settings/page.tsx) | Profile, availability, documents, **notification preferences (now wired — see §10)**. AU postcode label, Pros directed to `pros@washlee.com.au` for ID/ABN/insurance updates. W9 references gone |

**Pro flow concepts captured in design but partially backend-dependent:**
- Accept / deny / cancel — wired in `/employee/jobs` and `/employee/orders`.
- Status movement — wired in `/employee/orders/[orderId]`.
- Proof / photo capture — UI surfaces but no upload picker yet (see §13).
- Customer messaging — surfaced via per-order in-app message link; not yet a per-order chat thread (see §13).
- 10-minute accept warning / expiry — handled by mobile + backend; not represented in the website employee flow yet (see §13).
- Availability / radius matching — wired through `/api/employee/availability` save in settings.

---

## 7. Mobile app context (website-only sections that talk about it)

**Mobile app surface today:** customer + Pro flows only. **Admin is website-only** and not present in the mobile app.

What the mobile app supports (and what website mobile-app/help/marketing copy should reflect):
- Customer booking, payment retry, tracking, status timeline, support tickets, customer/Pro messaging, push notifications
- Booking draft recovery / forfeit
- Customer cancellation, Pro cancellation
- Pro mode for privileged accounts only
- Pro job acceptance / status flow
- Availability / radius matching
- 10-minute accept warning / expiry

[app/mobile-app/page.tsx](app/mobile-app/page.tsx) currently lists: real-time tracking, quick booking, push updates, Wash Club built-in, reschedule on the fly. **Add to next iteration** if expanding (see §13): explicit notes about draft recovery, support tickets, customer/Pro messaging, accept-warning, Pro mode visibility.

---

## 8. Admin coverage (website-only)

All 17 admin routes from the original brief are now on Direction A operational tokens.

| Route | File | Notes |
|---|---|---|
| Control center | [app/admin/page.tsx](app/admin/page.tsx) | Real `/api/admin/analytics` + `/api/analytics/summary`. Auto-refresh 60s. No fake business-health math |
| Operational dashboard | [app/admin/dashboard/page.tsx](app/admin/dashboard/page.tsx) | Real fetches. **Fake "System Health" panel removed.** Service status moved to Monitoring tab |
| Orders | [app/admin/orders/page.tsx](app/admin/orders/page.tsx) | View / search / cancel + **Danger Zone: bulk-delete-all-orders** (see §11) |
| Users | [app/admin/users/page.tsx](app/admin/users/page.tsx) | Search / filter / role badges; `/api/admin/users` |
| Pro applications | [app/admin/pro-applications/page.tsx](app/admin/pro-applications/page.tsx) | Verification checklist, employee-ID generation, approve/reject; subtitle says "commission per completed order"; DollarSign icon → Hash for ID |
| Payouts | [app/admin/payouts/page.tsx](app/admin/payouts/page.tsx) | Operational table + detail modal; approve / complete / reject all gated with `window.confirm`; AU bank detail display preserved |
| Support tickets | [app/admin/support-tickets/page.tsx](app/admin/support-tickets/page.tsx) | Direction A polish; close-ticket guarded with confirm |
| Wash Club | [app/admin/wash-club/page.tsx](app/admin/wash-club/page.tsx) | Banner: "free to join — no paid tiers"; tier names reflect cumulative spend only; unwired Actions column removed |
| Subscriptions | [app/admin/subscriptions/page.tsx](app/admin/subscriptions/page.tsx) | Labelled "(legacy)"; no fake $9.99 row defaults; no fake revenue total |
| Inquiries | [app/admin/inquiries/page.tsx](app/admin/inquiries/page.tsx) | Approve/reject with `window.confirm`; modal max-h fixed; subtitle says commission per completed order |
| Analytics | [app/admin/analytics/page.tsx](app/admin/analytics/page.tsx) | Real Supabase data; AUD totals; no fake "Top Pros" rows |
| Marketing campaigns | [app/admin/marketing/campaigns/page.tsx](app/admin/marketing/campaigns/page.tsx) | List + create; **Edit drawer + Delete modal now wired** to canonical PATCH/DELETE endpoints (see §10 / §13) |
| Monitoring | [app/admin/monitoring/page.tsx](app/admin/monitoring/page.tsx) | Real `/api/analytics/summary` + `/api/analytics/monitor` POST; funnel/alerts/uptime panels |
| Pricing rules | [app/admin/pricing/rules/page.tsx](app/admin/pricing/rules/page.tsx) | Internal what-if sandbox. Subtitle states canonical $7.50/$12.50/$75 from `lib/mobilePricing.ts`. Sandbox defaults updated to $7.50 / $75 |
| Employee codes | [app/admin/employee-codes/page.tsx](app/admin/employee-codes/page.tsx) | Hash icon (was DollarSign); "Standard Pro ID" |
| Security | [app/admin/security/page.tsx](app/admin/security/page.tsx) | Live error log + security signals (was extended by user with auth-failure / admin-activity / monitor-runs panels; preserved as-is) |
| Security detail | [app/admin/security/[id]/page.tsx](app/admin/security/[id]/page.tsx) | Resolution guides, Direction A polish |
| Admin login | [app/admin-login/page.tsx](app/admin-login/page.tsx) | Direction A; Retry-After header parsed for clearer 429 message (added by user) |
| Admin setup | [app/admin-setup/page.tsx](app/admin-setup/page.tsx) | Firebase mention removed; uses Supabase context; double-confirm guard |

---

## 9. Backend / API & infrastructure changes (since May 11)

| Area | What changed |
|---|---|
| `proxy.ts` | CORS for `/api/*` merged in (was previously a separate `middleware.ts`, now removed for Next 16 compliance). User has further refined rate-limit buckets — preserved. |
| `lib/pricing-engine.ts` | Constants updated to `BASE_PRICE_PER_KG = 7.5`, `MIN_ORDER = 75`. Header docstring marks it as admin-sandbox only; canonical engine is `lib/mobilePricing.ts`. |
| `app/api/services/route.ts` | Currency `USD → AUD`; catalogue trimmed to real services (standard, express, delicates) + hang dry add-on; includes `minimumOrder: 75`. |
| `app/api/orders/refund/route.ts` | `currency: 'USD' → 'AUD'` in invoice display object. Refund logic untouched. |
| `app/api/subscriptions/plans/route.ts` | Returns `plans: []` + `pricingModel: 'pay_per_order'` + neutral message for stable mobile contract. |
| `app/api/contact/route.ts` | **New** — POST endpoint for the contact form; sends through Resend to `support@washlee.com.au` with `replyTo: customer`; HTML-escapes input. |
| `/admin/orders` Danger Zone | Backend route at `app/api/admin/orders/bulk-delete/route.ts` exists. Frontend posts `{ confirmation: 'DELETE ALL ORDERS' }`. See §11. |

---

## 10. Optional handoff cleanup (now done)

### Marketing campaigns Edit/Delete — designed and wired

[app/admin/marketing/campaigns/page.tsx](app/admin/marketing/campaigns/page.tsx)

- **Edit:** drawer modal pre-fills from `Campaign` shape (name, type, segments, template, subject, message, ctaUrl, scheduled time). Edit disabled for `status === 'sent'`.
- **Delete:** modal requires typing the campaign name to enable; double-guarded.
- Both call `PATCH /api/marketing/campaigns?id=…` and `DELETE /api/marketing/campaigns?id=…`.
- Backend is implemented at [app/api/marketing/campaigns/route.ts](app/api/marketing/campaigns/route.ts), with admin-session protection, sent-campaign read-only protection, and soft-delete via `deleted_at`.
- Campaign list/create are backed by [app/api/marketing/campaigns/list/route.ts](app/api/marketing/campaigns/list/route.ts) and [app/api/marketing/send-campaign/route.ts](app/api/marketing/send-campaign/route.ts).
- Database support is in [supabase/migrations/20260514120000_marketing_campaigns_notification_preferences.sql](supabase/migrations/20260514120000_marketing_campaigns_notification_preferences.sql).

### Notification preferences — wired with optimistic save

[app/employee/settings/page.tsx](app/employee/settings/page.tsx)

- Loads from `GET /api/notifications/preferences?userId=…` on mount.
- Each toggle does an optimistic `PATCH /api/notifications/preferences` with `{ userId, preferences }` body and a per-row spinner.
- Backend is implemented at [app/api/notifications/preferences/route.ts](app/api/notifications/preferences/route.ts), protected by the Supabase bearer token for the signed-in user.
- 503 detection remains only for missing database migration state; toggles stay local until the table exists.
- Non-503 errors revert the toggle and show a red error.
- Marketing remains **off by default** in initial state.
- All other settings tabs (profile, availability, documents, Google Places autocomplete) preserved.

### `/auth/email-confirmed` — Direction A polish

[app/auth/email-confirmed/page.tsx](app/auth/email-confirmed/page.tsx)

- Shell: `bg-soft-hero` + `surface-card`.
- Inputs: `input-field` / `label-field` with leading icons.
- Buttons: `btn-primary` + `btn-outline`.
- AU phone placeholder; AU-only state list.
- **No emojis** in headings or buttons (👕 / 💼 / 🎉 / 👁️ removed).
- Pro option: "Apply as a Washlee Pro — Independent contractor — paid commission per completed order. We'll take you through the Pro application next."
- Inline `style={{ borderColor: '#48C9B0' }}` removed in favour of token-driven selection state.
- Preserved verbatim: `verifiedEmail`/`selectedUsageType` localStorage flow, Pro → `/auth/pro-signup-form` redirect, `supabase.auth.getUser`/`updateUser` calls, `users` upsert, `user_metadata` shape, customer/pro dashboard redirects.

---

## 11. Admin bulk-delete-all-orders — preserved as deliberate destructive action

[app/admin/orders/page.tsx](app/admin/orders/page.tsx)

The admin orders page has an admin-only Danger Zone for "delete every order in Washlee" (added by the user, intentional, preserved):

- Constant: `BULK_DELETE_CONFIRMATION = "DELETE ALL ORDERS"`
- Operator must type that exact string to enable the button.
- Then a `window.confirm("This will permanently delete every order in Washlee. This cannot be undone. Continue?")` second guard.
- POSTs to `/api/admin/orders/bulk-delete` with `{ confirmation }`.
- On success: clears local list, surfaces deleted-count + warning-count notice. On 503/error: surfaces error.
- Backend route exists at [app/api/admin/orders/bulk-delete/route.ts](app/api/admin/orders/bulk-delete/route.ts).

**Treat this as protected admin tooling. Do not soften, hide, or remove it.**

---

## 12. Tokens / system primitives

Defined in [tailwind.config.ts](tailwind.config.ts) and [app/globals.css](app/globals.css):

- Colours: `primary` `#48C9B0`, `primary-deep` `#2EAB95`, `accent` `#7FE3D3`, `mint` `#E8FFFB`, `light` `#F7FEFE`, `dark` `#14201E`, `dark-soft` `#1F2D2B`, `gray` `#6B7B78`, `gray-soft` `#9BA8A6`, `line` `#E1ECEA`.
- Type: Inter (via `next/font`), `text-balance` utility, calm body sizing.
- Motion: `slide-up`, `fade-in`, `float`. `prefers-reduced-motion` respected globally.
- Focus: visible 3-px ring with `focus-visible` on all interactive elements.
- Components: `surface-card`, `input-field`, `label-field`, `btn-primary`, `btn-outline`, `btn-ghost`, `pill`, `divider`, `bg-soft-hero`, `bg-soft-mint`.

---

## 13. Backend endpoints / data status

These formerly design-only endpoints are now implemented:

- `PATCH /api/marketing/campaigns?id={id}` — body `{ campaignName, campaignType, segments, templateKey, subject, message, ctaUrl, scheduleTime }`.
- `DELETE /api/marketing/campaigns?id={id}` — soft-deletes by setting `deleted_at`.
- `GET /api/notifications/preferences?userId={id}` → `{ preferences: { new_jobs, order_reminders, earnings_payouts, customer_messages, marketing } }`.
- `PATCH /api/notifications/preferences` — body `{ userId, preferences: {...} }`.
- `POST /api/auth/oauth-profile` — bearer-protected OAuth profile sync for Google/Apple callbacks. Upserts `users`, preserves admin/employee/pro flags, and upserts `customers` only for customer users.

Database support is in [supabase/migrations/20260514120000_marketing_campaigns_notification_preferences.sql](supabase/migrations/20260514120000_marketing_campaigns_notification_preferences.sql). Apply it before testing persistence against Supabase.

Per-order chat / per-step proof photo / 10-minute accept warning are **mobile-app concerns** today; if/when those need a website surface, the data shape should be specified before designing the UI.

---

## 14. Missing assets / screenshots

Real assets the design still needs — **named placeholders are fine in the meantime; do not substitute random stock imagery**:

- Real iOS and Android screenshots for [app/mobile-app/page.tsx](app/mobile-app/page.tsx) (the "What you get in the app" feature grid is currently icon-only).
- Real Pro headshots for any Pro-marketing context (currently no headshots used, which is fine).
- Real team photos for [app/about/page.tsx](app/about/page.tsx) (currently no team section, which is fine — but if "Meet the team" ever returns, real photos required).
- High-resolution wordmark SVG (currently using `/logo-washlee.png` raster).
- Map tile / Google Maps integration on [app/contact/page.tsx](app/contact/page.tsx) (currently text-only address).
- An ATS / careers-application landing for the [app/careers/page.tsx](app/careers/page.tsx) `careers@washlee.com.au` mailto path.
- A real damage-protection / sustainability hero photo if hero photography is ever desired (currently colour-block heroes — Direction A consistent).

---

## 15. Deliberately deferred — do not close

These items are explicitly **left open** until backend / external review confirms safety:

- **`/api/payments/paypal/order/route.ts`** — `currency_code: 'USD'`. Live PayPal call. Blocked until PayPal merchant account is confirmed AUD-enabled.
- **`/api/checkout/route.ts`** — `body.amount < 24` numeric guard + "Amount must be at least $24" error string. Blocked until it's confirmed no mobile/legacy client still calls this floor.
- **Pre-existing project-wide lint baseline** (~771 errors / 546 warnings before this design work). Mostly `@typescript-eslint/no-explicit-any` and `@typescript-eslint/no-require-imports` in pre-existing `lib/`, `scripts/`, and root `.js` files. Out of scope for the design pass — do **not** treat as a regression.

---

## 16. Confirmations (per the brief)

1. **Direction A is the only production direction.** Direction B is not present in any code path.
2. **Wash Club is free loyalty only.** Public marketing, customer dashboard, admin dashboard, and copy across the site all explicitly state no membership fee. No paid Wash Club anywhere.
3. **Pro copy is commission per completed order only.** No hourly wage, salary, $32/hr, $20–35/hr, 1099, W9, or US tax language remains in customer-facing or Pro-facing code. The two surviving "no hourly" mentions are explicit negations.
4. **Admin bulk-delete-all-orders flow is preserved** as a deliberate, double-confirmed Danger Zone (typed-string + window.confirm). Backend at `/api/admin/orders/bulk-delete` exists. See §11.

---

## 17. Files updated in this handoff cycle

- [app/admin/marketing/campaigns/page.tsx](app/admin/marketing/campaigns/page.tsx) — Edit drawer + Delete modal wired to real backend endpoints.
- [app/api/marketing/campaigns/route.ts](app/api/marketing/campaigns/route.ts) — new admin-protected PATCH/DELETE backend for campaign edit/delete.
- [app/api/marketing/campaigns/list/route.ts](app/api/marketing/campaigns/list/route.ts) — list backed by `marketing_campaigns`.
- [app/api/marketing/send-campaign/route.ts](app/api/marketing/send-campaign/route.ts) — campaign create/schedule backed by `marketing_campaigns`.
- [app/employee/settings/page.tsx](app/employee/settings/page.tsx) — Notification preferences load + optimistic save with Supabase bearer auth.
- [app/api/notifications/preferences/route.ts](app/api/notifications/preferences/route.ts) — new user-protected GET/PATCH backend for notification preferences.
- [supabase/migrations/20260514120000_marketing_campaigns_notification_preferences.sql](supabase/migrations/20260514120000_marketing_campaigns_notification_preferences.sql) — creates `marketing_campaigns` and `notification_preferences`.
- [app/auth/email-confirmed/page.tsx](app/auth/email-confirmed/page.tsx) — Direction A migration; preserved all Supabase logic.
- [components/OAuthButtons.tsx](components/OAuthButtons.tsx), [lib/oauthClient.ts](lib/oauthClient.ts), [app/auth/login/page.tsx](app/auth/login/page.tsx), [app/auth/signup-customer/page.tsx](app/auth/signup-customer/page.tsx), [app/auth/callback/page.tsx](app/auth/callback/page.tsx), [app/api/auth/oauth-profile/route.ts](app/api/auth/oauth-profile/route.ts) — Google login/signup wired through Supabase OAuth; Apple login/signup pre-coded behind `NEXT_PUBLIC_ENABLE_APPLE_AUTH=true`.
- [components/marketing/PlaceholderReviews.tsx](components/marketing/PlaceholderReviews.tsx) — reusable fake/sample review section, visibly labelled as fake data.
- [app/page.tsx](app/page.tsx), [app/pricing/page.tsx](app/pricing/page.tsx), [components/marketing/LocalLandingPage.tsx](components/marketing/LocalLandingPage.tsx) — render the labelled placeholder-review section.
- [app/pro/dashboard/page.tsx](app/pro/dashboard/page.tsx), [app/pro/dashboard/page-new.tsx](app/pro/dashboard/page-new.tsx), [app/pro/dashboard/complete.tsx](app/pro/dashboard/complete.tsx) — old duplicate Pro dashboard surfaces now redirect/re-export to the current employee dashboard path so fake `4.9` ratings and `98%` acceptance stats cannot leak.
- [app/tracking/page.tsx](app/tracking/page.tsx) and [components/LiveTracking.tsx](components/LiveTracking.tsx) — removed fake fallback Pro rating and fake/random Melbourne map seed; tracking now waits for real location data.
- [WASHLEE_DESIGN_HANDOFF_CURRENT.md](WASHLEE_DESIGN_HANDOFF_CURRENT.md) — this document.

The May-11 originals — [CLAUDE_CODE_WEBSITE_IMPLEMENTATION_PROMPT.md](CLAUDE_CODE_WEBSITE_IMPLEMENTATION_PROMPT.md) and [WEBSITE_REDESIGN_PRESERVE_APP_PARITY.md](WEBSITE_REDESIGN_PRESERVE_APP_PARITY.md) — remain in the repo as historical context but should be read alongside this document, which supersedes their "current state" claims.
