# Claude Code Prompt — Implement Final Washlee Website Handoff

Use this prompt for Claude Code when implementing the final Claude Design handoff into the real Next.js website repo.

```text
Implement the final Washlee Business website design handoff into the real Next.js repo.

Fetch this design file, read its README, and implement the relevant aspects of the design:
https://api.anthropic.com/v1/design/h/2IHbPCHNEbMj7aCEZrnp2g?open_file=index.html

Implement: index.html

The Claude Design handoff is now final.

Use Direction A only.

The design package now includes:
- Complete public website
- Complete customer dashboard
- Complete auth pages
- Complete Pro funnel
- Complete Admin side
- AdminApp with 15 views and detail drawers
- Admin login
- Admin setup
- Pro funnel with 11 artboards

Important corrections from this prompt are the source of truth:
- Standard wash & fold: $7.50/kg
- Express same-day: $12.50/kg
- Minimum order: $75
- Medium ~10kg and Large ~15kg only
- Remove $3/kg and $24 minimum everywhere
- Remove paid subscriptions/plans from public marketing
- Wash Club is free loyalty only
- Pro copy is commission per completed order, not hourly
- Direction A only
- Preserve backend/auth/payment/API logic

Start with Phase 1 customer ship-critical pages first.
Do not start admin first, even though admin design is done.
Run type-check after implementation.

Use Direction A as the production direction.

Do not use Direction B as the main website. Direction B is only editorial inspiration and should not be implemented unless explicitly requested later.

Important implementation rule:
Do not embed iPhone frames in the real website. Translate the mobile Direction A screens into responsive Next.js pages:
- mobile: close to Direction A phone screens
- desktop: wider layouts using the same cards, spacing, typography, colors, and components

Critical business corrections before implementation:
1. Canonical pricing is:
   - Standard wash & fold: $7.50/kg
   - Express same-day: $12.50/kg
   - Delicates / special care: same wash rate, no dry-clean promise
   - Minimum order: $75
   - Booking bag choices: Medium ~10kg and Large ~15kg only. No small option.
2. Remove all old `$3.00/kg` and `$24 minimum` copy.
3. Remove paid subscription/Plans marketing from the public website.
4. Wash Club is free loyalty/rewards only.
5. Do not make Wash Club paid.
6. Do not describe Wash Club as a paid membership.
7. Hide public Plans/Subscriptions CTAs.
8. `/pricing` is per-kg laundry pricing only.
9. If subscription routes must stay for compatibility, make them neutral:
   - no paid tiers
   - no paid plan marketing
   - explain Washlee is pay-per-order and offers free Wash Club rewards
10. Pro copy must say independent contractor/subcontractor and commission per completed order.
11. No hourly wage, wage, salary, or `$32/hr`.

Backend preservation:
- Frontend/design implementation only unless a tiny change is needed to keep the build passing.
- Do not change API route contracts.
- Do not change auth logic.
- Do not change payment/Stripe logic.
- Do not change Supabase table names.
- Do not change existing handlers.
- Keep existing data fetching and form submit handlers where they already exist.
- Do not invent fake backend data.
- Use polished loading, empty, and error states where data is missing.

Primary design package reference:
- `index.html`
- `screens/dir-a-extras.jsx`
- `screens/dir-a.jsx`
- `screens/dir-a-marketing.jsx`
- `screens/dir-a-subpages.jsx`
- `screens/dir-a-account.jsx`
- `screens/dir-a-static.jsx`
- `screens/desktop.jsx`
- `styles/tokens.css`
- `styles/redesign.css`
- `assets/washlee-logo.svg`
- `assets/washlee-mark.svg`

Implementation priority:

Phase 1 — Customer ship-critical:
1. Home page `/`
2. `/checkout`
3. `/payment-success`
4. `/booking`
5. `/dashboard/orders`
6. `/dashboard/orders/[id]`
7. `/tracking`
8. `/tracking/[id]`
9. `/auth/login`
10. `/auth/signin`
11. `/auth/signup-customer`
12. `/auth/verify-email-code`
13. `/auth/forgot-password`
14. `/dashboard/washclub`
15. Public marketing pages:
    - `/how-it-works`
    - `/pricing`
    - `/wash-club`
    - `/faq`
    - `/contact`

Phase 2 — Customer support:
16. `/dashboard/orders/[id]/claim`
17. `/dashboard/orders/[id]/review`
18. `/dashboard/support`
19. `/dashboard/payments`
20. `/dashboard/settings`
21. `/dashboard/security`
22. Footer/static pages:
    - `/about`
    - `/help-center`
    - `/terms`
    - `/privacy-policy`
    - `/cookie-policy`
    - `/damage-protection`
    - `/protection-plan`
    - `/careers`
    - `/sustainability`
    - `/corporate` or `/wholesale`
    - `/care-guide`
    - `/gift-cards`
    - `/mobile-app`
    - `/notifications`
    - `/pro-support`
    - `/pro-v2`
    - `/cancel-subscription`

Phase 3 — Pro funnel:
23. `/auth/employee-signin`
24. `/auth/pro-signup-form`
25. Pro job flow:
    - feed
    - accept
    - en-route
    - arrived
    - picked up
    - washing
    - dropping off
    - delivered
26. Pro earnings
27. Pro payouts
28. Pro order-scoped messages/support

Phase 4 — Admin later:
29. Minimal admin shell only after customer/pro pages are solid.
30. Admin is internal. Ugly v1 is acceptable if time is tight.

Important copy cleanup:
- Remove Bay Area / LA / US service-area copy.
- Keep Melbourne/Australia service context.
- Search and fix:
  - `Bay Area`
  - `LA`
  - `$32/hr`
  - `hourly wage`
  - `salary`
  - `$3.00/kg`
  - `$24`
  - public `Plans`
  - public `Subscriptions`

Routes from the handoff that are intentionally neutral/superseded:
- `/dashboard/subscriptions` should not sell paid subscriptions.
- `/dashboard/subscription/cancel`, `/dashboard/subscription/success`, `/cancel-subscription` should be neutral compatibility states only.
- `/dashboard/customer`, `/dashboard/mobile`, `/dashboard/loyalty` are legacy variants; use `/dashboard` and `/dashboard/washclub` unless routes must stay.

Forms:
Wire existing handlers where already present. If the endpoint does not exist, keep the form visual but mark it clearly in the final report as engineering follow-up.

Critical forms to wire first:
- login
- signup customer
- verify email code
- forgot password
- booking to checkout
- contact
- claim
- review

Assets:
Use named placeholders where real assets are missing. Do not use random dark/blurred stock imagery.
Missing assets to report:
- home hero photo
- about/team photo
- booking/service photo
- sustainability photo
- damage/protection photo
- real iOS/Android screenshots
- Pro headshots
- high-res wordmark SVG
- ATS/careers link
- map tile/integration

Validation:
After implementation run:
- `npm run type-check`
- lint if available
- build if practical

Final report must include:
1. Routes implemented
2. Files changed
3. Validation results
4. Remaining incomplete routes
5. Any backend/API/auth/payment logic touched, if any
6. Confirmation canonical pricing is `$7.50/kg`, express `$12.50/kg`, minimum `$75`
7. Confirmation no `$3/kg` or `$24 minimum` copy remains
8. Confirmation Wash Club is free loyalty only
9. Confirmation paid subscriptions/plans are removed from public marketing
10. Confirmation Pro copy is commission-based and not hourly
11. Confirmation How It Works was not unnecessarily redone
12. Remaining assets needed from me
13. Accessibility notes and any known gaps
```
