# Washlee Tomorrow Master To-Do

Use this as the memory list for tomorrow. The big order is: finish website implementation, verify mobile/backend, then start marketing properly.

## 1. Claude Design Follow-Up

- [ ] Wait for Claude Design to finish the updated Direction A handoff.
- [ ] Confirm Claude Design chose Direction A only.
- [ ] Confirm Direction B is not the main website direction.
- [ ] Confirm paid subscriptions/plans are removed from public website.
- [ ] Confirm Wash Club is free loyalty/rewards only.
- [ ] Confirm `/pricing` is per-kg laundry pricing only.
- [ ] Confirm Pro copy says independent contractor/subcontractor and commission per completed order.
- [ ] Confirm no hourly wage, wage, salary, or `$32/hr` copy exists.
- [ ] Confirm How It Works was not redone.
- [ ] Ask Claude Design for the final route-by-route report.
- [ ] Download/export the final design package if possible.
- [ ] Save the final design report somewhere in the repo.

## 2. Claude Code Website Implementation

- [ ] Give Claude Code the final Direction A handoff.
- [ ] Tell Claude Code to implement into the real Next.js website repo, not just design files.
- [ ] Tell Claude Code frontend/design only unless a build fix requires tiny wiring.
- [ ] Tell Claude Code not to change backend logic, API routes, Stripe logic, auth logic, Supabase tables, or payment handlers.
- [ ] Tell Claude Code to preserve all existing routes and handlers.
- [ ] Tell Claude Code to remove public paid subscriptions/plans.
- [ ] Tell Claude Code to hide paid subscription CTAs from nav/footer/dashboard where possible.
- [ ] Tell Claude Code to keep Wash Club free loyalty only.

## 3. Website Pages To Implement First

- [ ] Home page `/` using Direction A desktop/mobile.
- [ ] `/checkout`.
- [ ] `/payment-success`.
- [ ] `/dashboard/orders/[id]/claim`.
- [ ] `/dashboard/orders/[id]/review`.
- [ ] `/dashboard/orders`.
- [ ] `/dashboard/orders/[id]`.
- [ ] `/tracking`.
- [ ] `/tracking/[id]`.
- [ ] `/dashboard/payments`.
- [ ] `/dashboard/settings`.
- [ ] `/dashboard/security`.
- [ ] `/dashboard/support`.
- [ ] `/pro/settings` must not say coming soon.
- [ ] Remove Bay Area/LA/US copy from support/help pages.

## 4. Auth Pages To Finish

- [ ] `/auth/login`.
- [ ] `/auth/signin`.
- [ ] `/auth/employee-signin`.
- [ ] `/auth/forgot-password`.
- [ ] `/auth/complete-profile`.
- [ ] `/auth/callback`.
- [ ] `/auth/email-confirmed`.
- [ ] `/auth/phone-verification`.
- [ ] `/auth/verify-email`.
- [ ] `/auth/verify-email-code`.
- [ ] `/auth/select-usage-type`.
- [ ] `/auth/signup-customer`.
- [ ] `/auth/pro-signup-form`.

## 5. Pro Flow To Design/Implement After Customer Gaps

- [ ] Pro signup form.
- [ ] Pro onboarding.
- [ ] Pro dashboard/feed.
- [ ] Accept job screen.
- [ ] En route to pickup state.
- [ ] Arrived at pickup state.
- [ ] Pickup proof photo state.
- [ ] Picked up state.
- [ ] Washing/cleaning state.
- [ ] Out for delivery state.
- [ ] Delivered/drop-off proof state.
- [ ] Pro earnings detail.
- [ ] Pro payout history.
- [ ] Pro support/messaging.
- [ ] Make sure customer address only shows when needed for an active job.
- [ ] Make sure live location is only for pickup/delivery windows.
- [ ] Make sure Pro/customer messaging is order-scoped.

## 6. Footer/Static Pages

- [ ] `/about`.
- [ ] `/contact`.
- [ ] `/help-center`.
- [ ] `/faq`.
- [ ] `/terms`.
- [ ] `/privacy-policy`.
- [ ] `/cookie-policy`.
- [ ] `/damage-protection`.
- [ ] `/protection-plan` if route exists.
- [ ] `/careers`.
- [ ] `/sustainability`.
- [ ] `/corporate` or `/wholesale`.
- [ ] `/care-guide`.
- [ ] `/gift-cards`.
- [ ] `/mobile-app`.
- [ ] `/notifications`.
- [ ] `/pro-support`.
- [ ] `/pro-v2`.
- [ ] `/cancel-subscription` should not market paid subscriptions.

## 7. Admin Later

- [ ] Leave admin until customer/pro website is solid.
- [ ] Later redesign `/admin`.
- [ ] Later redesign `/admin/dashboard`.
- [ ] Later redesign `/admin/orders`.
- [ ] Later redesign `/admin/users`.
- [ ] Later redesign `/admin/pro-applications`.
- [ ] Later redesign `/admin/payouts`.
- [ ] Later redesign `/admin/analytics`.
- [ ] Later redesign `/admin/security`.
- [ ] Later redesign `/admin/marketing/campaigns`.
- [ ] Later redesign `/admin/monitoring`.
- [ ] Later redesign `/admin/pricing/rules`.
- [ ] Later redesign `/admin/inquiries`.
- [ ] Later redesign `/admin/support-tickets`.
- [ ] Later redesign `/admin/wash-club`.
- [ ] Later redesign `/admin/employee-codes`.
- [ ] Later redesign `/admin-login`.
- [ ] Later redesign `/admin-setup`.

## 8. Website Validation

- [ ] Run `npm run type-check`.
- [ ] Run lint if available.
- [ ] Run build if storage/time allows.
- [ ] Open home page desktop.
- [ ] Open home page mobile viewport.
- [ ] Click every public nav link.
- [ ] Click every footer link.
- [ ] Confirm no public Plans/Subscriptions links remain.
- [ ] Confirm `/subscriptions` does not show paid plans.
- [ ] Confirm `/wash-club` is free loyalty only.
- [ ] Test `/pricing` calculator still works visually.
- [ ] Test booking flow still submits through existing handler.
- [ ] Test contact form still uses existing field names.
- [ ] Test auth pages still call existing auth handlers.
- [ ] Test order pages with empty/loading/error states.
- [ ] Test support page copy is Australia/Melbourne appropriate.
- [ ] Search repo for `Bay Area`.
- [ ] Search repo for `LA`.
- [ ] Search repo for `$32/hr`.
- [ ] Search repo for `hourly wage`.
- [ ] Search repo for `salary`.
- [ ] Search repo for public `subscription` copy.

## 9. Mobile App Verification

- [ ] Apply latest Supabase migrations.
- [ ] Confirm `.env.local` has `WASHLEE_SUPPORT_USER_IDS`.
- [ ] Confirm `RESEND_API_KEY` is present locally and in production.
- [ ] Confirm `RESEND_FROM_EMAIL` is set.
- [ ] Confirm Stripe webhook secret is set.
- [ ] Confirm mobile API base URL points to the correct backend.
- [ ] Run `flutter analyze`.
- [ ] Run `flutter test`.
- [ ] Run app on iPhone.
- [ ] Run app on Android emulator or second phone.
- [ ] Test customer login.
- [ ] Test Pro login/switch.
- [ ] Test customer booking draft save.
- [ ] Test forfeit booking dialog.
- [ ] Test order payment sheet.
- [ ] Test retry payment from order details.
- [ ] Test Pro job accept.
- [ ] Test Pro status steps.
- [ ] Test customer order tracking timeline.
- [ ] Test proof photo display if possible.
- [ ] Test support ticket creation.
- [ ] Test account deletion screen carefully with a test account only.
- [ ] Test push notification registration does not crash without APNs key.

## 10. Real Device / Two Phone Testing

- [ ] Use one phone as customer.
- [ ] Use one phone or emulator as Pro.
- [ ] Create a customer test order.
- [ ] Pay with Stripe test card.
- [ ] Confirm order remains pending until payment succeeds.
- [ ] Confirm order releases to Pro after paid webhook.
- [ ] Accept order as Pro.
- [ ] Move through all Pro status steps.
- [ ] Confirm customer sees each timeline update.
- [ ] Confirm customer receives in-app notification.
- [ ] Confirm email update sends if Resend works.
- [ ] Confirm chat between customer and Pro.
- [ ] Confirm support ticket goes to Washlee support user.

## 11. Backend / Supabase Tasks

- [ ] Run migration `20260514110000_mobile_account_deletion_and_booking_drafts.sql`.
- [ ] Confirm `booking_drafts` table exists.
- [ ] Confirm `account_deletion_requests` table exists.
- [ ] Confirm users table has deletion columns.
- [ ] Confirm customers table has deleted_at.
- [ ] Add mum/dad Supabase UUIDs to `WASHLEE_SUPPORT_USER_IDS` after accounts exist.
- [ ] Create or confirm Pro employee row for `lukaverde3@gmail.com`.
- [ ] Confirm 6-digit Pro ID works.
- [ ] Confirm service radius/availability logic still matches website backend.
- [ ] Confirm Pro jobs expire if ignored after 10 minutes.
- [ ] Confirm paid orders only release after Stripe webhook.

## 12. Apple / Google Developer Later

- [ ] Apple Developer Program enrollment.
- [ ] Create APNs key.
- [ ] Upload APNs key to Firebase.
- [ ] Create Apple Pay merchant ID.
- [ ] Add Stripe Apple Pay merchant identifier.
- [ ] Configure Associated Domains if needed.
- [ ] Prepare App Store screenshots.
- [ ] Prepare App Privacy answers.
- [ ] Prepare account deletion explanation.
- [ ] Prepare support URL.
- [ ] Prepare privacy policy URL.
- [ ] Prepare Google Play developer account.
- [ ] Prepare Play Store Data Safety answers.

## 13. Assets Needed

- [ ] Home hero photo.
- [ ] About/team or operations photo.
- [ ] Booking/service photo.
- [ ] Sustainability/operations photo.
- [ ] Damage/protection photo.
- [ ] Real iPhone app screenshots.
- [ ] Real Android app screenshots.
- [ ] Pro headshots or clean avatar photos.
- [ ] High-res Washlee wordmark SVG.
- [ ] App icon final export.
- [ ] Google/Apple app store badges when accounts are ready.
- [ ] Careers/ATS link or fallback email.
- [ ] Mapbox or Google Maps key for live tracking map.

## 14. Marketing Foundation

- [ ] Define the simplest offer: laundry pickup/delivery, from `$7.50/kg`, Melbourne.
- [ ] Decide first launch suburb/service area.
- [ ] Decide opening promo.
- [ ] Decide referral offer.
- [ ] Decide first-time customer offer.
- [ ] Decide Pro recruitment message.
- [ ] Make Google Business Profile.
- [ ] Make Instagram.
- [ ] Make TikTok.
- [ ] Make Facebook page.
- [ ] Make LinkedIn page if needed.
- [ ] Reserve consistent handles.
- [ ] Write short bio for all channels.
- [ ] Prepare 10 launch posts.
- [ ] Prepare 5 short videos.
- [ ] Prepare flyer copy.
- [ ] Prepare QR code to booking page.
- [ ] Prepare local business outreach message.
- [ ] Prepare apartment building/concierge pitch.
- [ ] Prepare student housing pitch.
- [ ] Prepare Airbnb/short-stay host pitch.

## 15. Website Marketing Copy

- [ ] Home hero headline.
- [ ] Home hero subheading.
- [ ] Main CTA.
- [ ] Secondary CTA.
- [ ] Trust bullets.
- [ ] How it works short version.
- [ ] Pricing clarity section.
- [ ] Minimum order explanation.
- [ ] Damage/protection explanation.
- [ ] FAQ.
- [ ] Pro recruitment section.
- [ ] Wash Club free loyalty section.
- [ ] Contact/support section.
- [ ] Local service area copy.
- [ ] No unsupported claims.

## 16. Email Marketing

- [ ] Test welcome email.
- [ ] Test password changed email.
- [ ] Test order confirmation email.
- [ ] Test order status update email.
- [ ] Test abandoned booking draft email.
- [ ] Write better welcome email copy.
- [ ] Write first order promo email.
- [ ] Write abandoned booking reminder.
- [ ] Write referral email.
- [ ] Write post-delivery review request.
- [ ] Add unsubscribe/footer compliance where marketing.
- [ ] Keep transactional emails clear and useful.

## 17. Launch Readiness

- [ ] One full customer order test.
- [ ] One full Pro order test.
- [ ] One failed payment test.
- [ ] One refund/support ticket test.
- [ ] One account deletion test with throwaway account.
- [ ] One forgot password test.
- [ ] One mobile browser website test.
- [ ] One desktop website test.
- [ ] One slow internet/loading state test.
- [ ] Confirm no broken nav links.
- [ ] Confirm no placeholder "coming soon" on customer/pro launch paths.
- [ ] Confirm footer legal links work.
- [ ] Confirm contact form works.
- [ ] Confirm support escalation works.

## 18. Tomorrow Order Of Attack

1. Finish Claude Design handoff.
2. Give final handoff to Claude Code for website implementation.
3. Validate website.
4. Fix any broken routes/copy.
5. Apply Supabase migration.
6. Test mobile customer/pro flow.
7. Write marketing positioning.
8. Make first launch checklist.
9. Collect missing assets/screenshots.
10. Stop before doing admin unless everything customer-facing is solid.

## 19. Do Not Forget

- [ ] Direction A is the chosen direction.
- [ ] Direction B is not main.
- [ ] Wash Club is free.
- [ ] Paid subscriptions/plans are removed from public marketing.
- [ ] Pros are commission-based contractors.
- [ ] No hourly wage copy.
- [ ] Customer screens matter more than admin right now.
- [ ] The app has to work before aggressive marketing.
- [ ] Marketing should start with local trust, not massive ads.

## 20. Website Marketing + App Conversion Audit

The website can look finished but still not be finished as a marketing and app-conversion machine. After the design implementation is stable, audit and improve the site as the top-of-funnel engine for the mobile app.

### Website To App Handoff

- [ ] Make every major CTA push users into the app path.
- [ ] `/booking` should open app booking if the app is installed.
- [ ] `/booking` should fallback to App Store / Play Store / waitlist if app is not installed.
- [ ] Desktop booking CTAs should show QR code to download/open the app.
- [ ] Mobile booking CTAs should show App Store / Play Store fallback.
- [ ] Promo links like `/booking?promo=FIRSTWASH` should carry into the app.
- [ ] UTM links should carry into app signup/booking attribution.
- [ ] Decide final app-link strategy before launch:
  - universal links for iOS
  - Android app links
  - fallback web route
  - QR download route
- [ ] Confirm app package/bundle IDs before publishing app links.

### Analytics + Conversion Tracking

- [ ] Add GA4.
- [ ] Add Meta Pixel if running Facebook/Instagram ads.
- [ ] Add TikTok Pixel if running TikTok ads.
- [ ] Add conversion tracking events.
- [ ] Track click on `Book`.
- [ ] Track click on App Store.
- [ ] Track click on Play Store.
- [ ] Track signup started.
- [ ] Track signup completed.
- [ ] Track booking started.
- [ ] Track booking completed.
- [ ] Track payment started.
- [ ] Track payment success.
- [ ] Track abandoned booking.
- [ ] Track Pro signup started.
- [ ] Track Pro signup completed.
- [ ] Track contact/support submitted.
- [ ] Track promo/referral code usage.
- [ ] Set up ad audiences:
  - visited pricing
  - clicked booking
  - started booking but did not finish
  - visited Pro page
  - visited Wash Club
  - visited mobile-app page
- [ ] Build dashboard/report for traffic → app install → signup → booking.

### SEO Basics

- [ ] Add `robots.txt`.
- [ ] Add `sitemap.xml`.
- [ ] Add canonical tags.
- [ ] Add Open Graph tags.
- [ ] Add Twitter card tags.
- [ ] Add JSON-LD structured data.
- [ ] Give every important page a unique title.
- [ ] Give every important page a unique meta description.
- [ ] Stop using the same title everywhere: `Washlee - Laundry Done for You`.
- [ ] Add local business schema.
- [ ] Add service schema for laundry pickup/wash and fold.
- [ ] Add FAQ schema where relevant.
- [ ] Add breadcrumb schema if useful.
- [ ] Check page indexability after deployment.
- [ ] Submit sitemap to Google Search Console.
- [ ] Set up Google Search Console.
- [ ] Set up Bing Webmaster Tools later if time.

### App Store / Play Store Links

- [ ] Confirm whether `https://apps.apple.com/app/washlee` is live/final.
- [ ] Confirm whether `https://play.google.com/store/apps/details?id=com.washlee` is live/final.
- [ ] If app stores are not live, replace with waitlist/SMS app link flow.
- [ ] Add "Send me the app link" form.
- [ ] Capture phone/email before users leave.
- [ ] Add QR code for desktop users.
- [ ] Add coming-soon app badges only if stores are not live.
- [ ] Update links once Apple/Google listings are approved.

### Claims + Trust Proof

- [ ] Audit all homepage claims.
- [ ] Check if `50K+ Happy Customers` is true.
- [ ] Check if `Nationwide Service` is true.
- [ ] Check if `First Pickup FREE` is true.
- [ ] Check if `100% Money Back` is true.
- [ ] If claims are not provable, soften or remove them.
- [ ] Add proof for big claims.
- [ ] Add testimonials only if real.
- [ ] Add real reviews when available.
- [ ] Add real service area instead of nationwide if local launch.
- [ ] Make guarantees legally safe.
- [ ] Add trust elements:
  - secure payment
  - vetted Pros
  - damage support process
  - photo proof
  - customer support
  - privacy around addresses/location

### Local Landing Pages

- [ ] Build `/laundry-pickup-melbourne`.
- [ ] Build `/wash-and-fold-melbourne`.
- [ ] Build `/student-laundry-service`.
- [ ] Build `/business-laundry-service`.
- [ ] Build `/airbnb-laundry-service` if targeting hosts.
- [ ] Build `/apartment-laundry-pickup` if targeting apartment buildings.
- [ ] Build suburb/service-area pages after first service area is confirmed.
- [ ] Build `/become-a-washlee-pro`.
- [ ] Make every local landing page useful, not thin SEO spam.
- [ ] Include:
  - service area
  - pricing
  - how pickup works
  - app CTA
  - FAQ
  - local trust copy
  - clear booking/app link

### Pro Side Funnel

- [ ] Make Pro page a direct funnel: `Earn with Washlee`.
- [ ] Explain commission per completed order.
- [ ] Show realistic payout examples only if verified.
- [ ] Explain requirements.
- [ ] Explain how jobs work.
- [ ] Explain service radius and availability.
- [ ] Explain safety/trust expectations.
- [ ] Explain support expectations.
- [ ] Add Pro FAQ.
- [ ] CTA into Pro signup flow/app.
- [ ] Remove all hourly wage language.
- [ ] Remove `$32/hr`.
- [ ] Add independent contractor/subcontractor language.
- [ ] Add "Apply as a Pro" CTA consistently.

### Lead Capture

- [ ] Add "Send me the app link" capture on desktop.
- [ ] Add waitlist fallback if app store links are not ready.
- [ ] Capture phone.
- [ ] Capture email.
- [ ] Capture source/UTM.
- [ ] Send app link by SMS/email when ready.
- [ ] Add follow-up email for people who clicked but did not book.
- [ ] Add abandoned booking recovery email.
- [ ] Add first-order promo email.

### Retargeting

- [ ] Retarget visitors to pricing.
- [ ] Retarget visitors to booking.
- [ ] Retarget visitors who started booking but did not pay.
- [ ] Retarget Pro page visitors.
- [ ] Retarget Wash Club visitors.
- [ ] Retarget mobile-app page visitors.
- [ ] Exclude people who already booked.
- [ ] Exclude people who already applied as Pro from Pro ads.
- [ ] Make audiences from GA4/Meta/TikTok after tracking is installed.

### UTM + Promo System

- [ ] Standardise campaign links:
  - `/booking?utm_source=tiktok&utm_campaign=firstwash&promo=FIRSTWASH`
  - `/booking?utm_source=instagram&utm_campaign=launch&promo=FIRSTWASH`
  - `/booking?utm_source=flyer&utm_campaign=local-launch&promo=LOCAL10`
- [ ] Ensure website preserves UTM params.
- [ ] Ensure app receives UTM params through deep link.
- [ ] Ensure promo code auto-applies inside app booking.
- [ ] Store attribution on signup.
- [ ] Store attribution on booking.
- [ ] Report campaign → booking conversion.

### Weekly Marketing Priority

- [ ] Add analytics/conversion tracking first.
- [ ] Add `robots.txt`, `sitemap.xml`, metadata, and social preview tags.
- [ ] Fix app download/deep-link flow.
- [ ] Build local/service landing pages.
- [ ] Connect website promo links into app booking/referral system.
- [ ] Then start ads/content once traffic can be measured.

### Core Marketing Principle

- [ ] Remember: the website is not the main product.
- [ ] The website should sell trust.
- [ ] The website should answer doubts.
- [ ] The website should track visitors.
- [ ] The website should push people into the app.
- [ ] The app should handle the actual booking/customer experience.

## 21. Claude Design Final Handoff Corrections

- [ ] Use the final Claude Design handoff as the visual source.
- [ ] Use Direction A as production direction.
- [ ] Do not implement Direction B as main.
- [ ] Do not embed iPhone frames in real website pages.
- [ ] Translate mobile Direction A screens into responsive web pages.
- [ ] Use desktop Direction A for desktop layouts.
- [ ] Confirm canonical pricing before implementation.
- [ ] Use canonical pricing: Standard `$7.50/kg`.
- [ ] Use canonical pricing: Express `$12.50/kg`.
- [ ] Use canonical minimum order: `$75`.
- [ ] Remove old `$3.00/kg` copy.
- [ ] Remove old `$24 minimum` copy.
- [ ] Booking bag choices should be Medium `~10kg` and Large `~15kg`.
- [ ] Remove Small bag option from booking.
- [ ] Remove public paid subscription/Plans marketing.
- [ ] Keep `/dashboard/subscriptions` neutral if route must stay.
- [ ] Keep `/cancel-subscription` neutral if route must stay.
- [ ] Keep Wash Club free loyalty only.
- [ ] Do not add paid tiers to Wash Club.
- [ ] Confirm `/pricing` is per-kg laundry pricing only.
- [ ] Confirm Pro copy is independent contractor/subcontractor, commission per completed order.
- [ ] Search for and remove `$32/hr`.
- [ ] Search for and remove `hourly wage`.
- [ ] Search for and remove unsupported `salary` copy.
- [ ] Remove Bay Area/LA/US service-area copy.
- [ ] Keep Australia/Melbourne context.
- [ ] Save/use the Claude Code implementation prompt:
  - `CLAUDE_CODE_WEBSITE_IMPLEMENTATION_PROMPT.md`
