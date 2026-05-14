# Washlee Marketing Launch Audit

Date: 2026-05-14
Project audited: `Website.BUsiness`
Scope: marketing and launch checklist only. No backend/API implementation notes are required here.

## Launch Rules To Keep Fixed

- Direction A only.
- Customer pricing:
  - Standard: `$7.50/kg`
  - Express: `$12.50/kg`
  - Minimum order: `$75`
  - Pickup and delivery included inside the Melbourne service area.
- Wash Club is free loyalty only. It is not a paid subscription.
- Pros are independent contractors paid commission per completed order, not hourly.
- Context is Melbourne/Australia first.
- Admin is web-only.
- Mobile app is customer + Pro only.

## Current Website Snapshot

The website already has strong public pages for homepage, pricing, booking, Pro, Wash Club, help, FAQ, contact, about, mobile app, corporate, wholesale, protection, and legal pages.

The strongest current launch assets are:

- Homepage positioning is now Melbourne-specific and uses the correct `7.50/kg`, `12.50/kg`, and `$75 minimum` story.
- `/pricing` has the clearest customer-facing price explanation.
- `/pro` correctly says Pros are paid commission per completed order, not hourly.
- `/wash-club` presents loyalty as free.
- A first-party web analytics tracker exists at `components/analytics/WashleeAnalyticsTracker.tsx`.
- The layout has global metadata in `app/layout.tsx`.

The biggest launch gaps are:

- SEO is mostly global, not page-specific.
- No `sitemap` or `robots` file is present in `app` or `public`.
- No canonical, Open Graph, Twitter card, or JSON-LD coverage was found.
- App download and booking handoff are not yet a proper app-first funnel.
- Ad/promo/UTM passthrough is not visible in the booking/signup flow.
- Some public pages still carry older or risky claims/pricing that conflict with Direction A.
- Referral page is a placeholder.
- Local landing pages do not exist yet.

## SEO Basics Checklist

### Metadata

- Add unique metadata per major public route.
- Keep homepage title focused on Melbourne laundry pickup and delivery.
- Avoid one shared title for every route.
- Add route-specific descriptions that include intent, location, and primary CTA.
- Add `metadataBase` once the production domain is final.

Recommended title examples:

- `/`: `Washlee | Laundry Pickup and Delivery in Melbourne`
- `/pricing`: `Washlee Pricing | $7.50/kg Laundry Pickup in Melbourne`
- `/how-it-works`: `How Washlee Works | Laundry Pickup and Delivery Melbourne`
- `/pro`: `Become a Washlee Pro | Commission Laundry Jobs in Melbourne`
- `/wash-club`: `Wash Club Rewards | Free Laundry Loyalty Program`
- `/mobile-app`: `Washlee App | Book Laundry Pickup from Your Phone`
- `/corporate`: `Business Laundry Service Melbourne | Washlee`
- `/wholesale`: `Wholesale Laundry Pickup Melbourne | Washlee`

### Sitemap

- Add a sitemap that includes public marketing pages only.
- Exclude admin, employee dashboards, customer dashboards, checkout states, debug pages, and secret/test routes.
- Include local landing pages once created.

High-priority sitemap routes:

- `/`
- `/pricing`
- `/how-it-works`
- `/services`
- `/mobile-app`
- `/wash-club`
- `/pro`
- `/about`
- `/faq`
- `/help-center`
- `/contact`
- `/care-guide`
- `/damage-protection`
- `/protection-plan`
- `/corporate`
- `/wholesale`
- `/privacy-policy`
- `/terms-of-service`
- `/cookie-policy`

### Robots

- Add `robots.txt`.
- Allow normal public marketing pages.
- Disallow private, admin, employee, dashboard, checkout, debug, and test areas.
- Make sure `robots.txt` points to the sitemap.

Suggested noindex/disallow groups:

- `/admin`
- `/admin-login`
- `/admin-setup`
- `/employee`
- `/dashboard`
- `/checkout`
- `/payment-success`
- `/tracking`
- `/email-debug`
- `/test-remember-me`
- `/secret-admin`
- `/refund-payment`
- `/auth/callback`
- `/auth/verify-email`
- `/auth/verify-email-code`

### Canonical URLs

- Add canonical URLs on all public pages.
- Canonicalize duplicate/legacy pages:
  - `/subscriptions` should canonical to `/wash-club`.
  - `/loyalty` should either redirect or canonical to `/wash-club`.
  - `/app-info` should either redirect or canonical to `/mobile-app`.
  - `/pro-v2` should not compete with `/pro`.
  - `/booking-demo`, `/booking-info`, and `/booking-hybrid` should not be indexed if they are not launch pages.

### Open Graph And Twitter Cards

- Add Open Graph tags for homepage and major landing pages.
- Add Twitter card tags.
- Create one strong share image for Washlee:
  - brand/logo
  - Melbourne laundry pickup message
  - app screenshot or booking preview
  - clear price cue: `$7.50/kg standard, $75 minimum`

Required fields:

- `og:title`
- `og:description`
- `og:url`
- `og:site_name`
- `og:image`
- `og:type`
- `twitter:card`
- `twitter:title`
- `twitter:description`
- `twitter:image`

### JSON-LD

Add structured data to improve search clarity:

- `Organization` on the root layout or homepage.
- `LocalBusiness` or `LaundryService` on homepage and local landing pages.
- `Service` on `/pricing`, `/services`, and local pages.
- `FAQPage` on `/faq`, `/pricing`, `/pro`, `/wash-club`, and `/help-center` where actual FAQ content appears.
- `BreadcrumbList` on deeper informational pages.

Keep JSON-LD claims conservative until reviews, service area, and business identity are fully verified.

## App Handoff Checklist

The website should push high-intent users into the app because most customers will use mobile.

### Mobile Users

- Primary CTA should detect mobile device.
- If app is installed, open the app to the right screen.
- If app is not installed, send iOS users to App Store and Android users to Google Play.
- Track every app handoff click.
- Preserve campaign data into the handoff URL.

Recommended mobile handoff targets:

- `/booking` to customer app booking flow.
- `/pricing` CTA to app booking flow with pricing context.
- `/wash-club` CTA to customer app rewards/signup flow.
- `/pro` CTA to Pro app application/sign-in flow.
- `/mobile-app` download buttons to final App Store/Play Store URLs.

### Desktop Users

- Show a QR code on app-first CTAs.
- QR destination should include UTM and promo parameters.
- Desktop `/booking` can remain available, but the page should also make app download obvious.
- Add "send app link to phone" capture once SMS/email flow is ready.

### Deep Links And Promo Links

Create one agreed pattern for app handoff URLs before launch.

Recommended link shape:

```text
/booking?utm_source=tiktok&utm_medium=paid_social&utm_campaign=launch_melbourne&promo=FIRSTWASH
```

The app should eventually receive:

- `utm_source`
- `utm_medium`
- `utm_campaign`
- `utm_content`
- `utm_term`
- `promo`
- `ref`
- `channel`
- `landing_page`

Do not launch paid ads until these parameters are stored through signup, booking, and checkout.

## Analytics And Conversion Tracking Checklist

The project already has first-party tracking through `trackWashleeEvent`. That is useful, but launch needs paid-media pixels and a consistent event taxonomy.

### Required Tools

- GA4
- Google Ads conversion tracking
- Meta Pixel
- TikTok Pixel
- First-party Washlee event tracking
- Server-side conversion events later, after payment/backend testing

### Consent

- Marketing pixels should respect cookie consent.
- Essential first-party operational events can run as needed for fraud/security/product analytics.
- Cookie policy should match the actual tools enabled at launch.

### Exact Events To Track

Track these event names consistently across web and app.

Core website:

- `page_view`
- `cta_clicked`
- `nav_clicked`
- `pricing_viewed`
- `faq_viewed`
- `contact_viewed`
- `service_area_checked`
- `app_download_clicked`
- `qr_code_viewed`
- `qr_code_scanned`

Customer funnel:

- `customer_signup_started`
- `customer_signup_step_completed`
- `customer_signup_completed`
- `login_started`
- `login_success`
- `booking_started`
- `booking_step_completed`
- `booking_quote_viewed`
- `promo_code_entered`
- `promo_code_applied`
- `promo_code_failed`
- `checkout_started`
- `payment_started`
- `payment_completed`
- `payment_failed`
- `order_created`
- `order_completed`

App handoff:

- `app_handoff_clicked`
- `app_store_clicked`
- `play_store_clicked`
- `deep_link_open_attempted`
- `deep_link_fallback_used`
- `send_app_link_requested`
- `send_app_link_submitted`

Pro funnel:

- `pro_landing_viewed`
- `pro_apply_clicked`
- `pro_signup_started`
- `pro_signup_step_completed`
- `pro_application_submitted`
- `pro_application_abandoned`
- `pro_support_viewed`

Business/wholesale:

- `business_landing_viewed`
- `corporate_cta_clicked`
- `wholesale_started`
- `wholesale_submitted`
- `business_account_requested`

Retention/referral:

- `wash_club_viewed`
- `wash_club_join_clicked`
- `wash_club_joined`
- `referral_page_viewed`
- `referral_share_clicked`
- `review_request_clicked`
- `review_submitted`

Campaign metadata to attach:

- `route`
- `cta_label`
- `device_type`
- `utm_source`
- `utm_medium`
- `utm_campaign`
- `utm_content`
- `utm_term`
- `promo`
- `ref`
- `campaign_id`
- `landing_page`
- `logged_in`
- `user_role`
- `order_id` only where appropriate

## Local Landing Pages Checklist

These are missing and should be created after the core launch pages are stable.

Highest-priority SEO pages:

- `/laundry-pickup-melbourne`
- `/wash-and-fold-melbourne`
- `/laundry-delivery-melbourne`
- `/student-laundry-melbourne`
- `/business-laundry-melbourne`
- `/same-day-laundry-melbourne`
- `/service-areas`
- `/service-areas/melbourne-cbd`
- `/service-areas/south-melbourne`
- `/service-areas/richmond`
- `/service-areas/south-yarra`
- `/service-areas/st-kilda`
- `/service-areas/carlton`
- `/service-areas/brunswick`
- `/service-areas/fitzroy`
- `/service-areas/prahran`
- `/service-areas/docklands`

Each local page should include:

- Clear H1 with service + location.
- Correct pricing: `$7.50/kg`, `$12.50/kg`, `$75 minimum`.
- Melbourne service area language.
- App-first CTA.
- FAQ block.
- JSON-LD.
- Nearby suburbs/internal links.
- Real local photos once available.
- No fake reviews or unsupported claims.

## Ad And UTM System Checklist

Before paid launch, define one campaign URL standard.

Recommended campaign examples:

```text
/?utm_source=meta&utm_medium=paid_social&utm_campaign=launch_melbourne&utm_content=hero_video
/booking?utm_source=tiktok&utm_medium=paid_social&utm_campaign=first_order&utm_content=creator_1&promo=FIRSTWASH
/pro?utm_source=meta&utm_medium=paid_social&utm_campaign=pro_recruitment&utm_content=commission_jobs
/student-laundry-melbourne?utm_source=google&utm_medium=cpc&utm_campaign=student_laundry
```

UTM rules:

- Store UTMs on first visit.
- Keep UTMs through signup, booking, checkout, and app handoff.
- Do not overwrite first-touch attribution unless storing both first-touch and last-touch.
- Attach promo/referral codes to the eventual order if the customer books.
- Keep `promo` separate from `ref`.
- Add admin reporting later, after core tracking is verified.

Promo/referral rules:

- Promo codes should be validated in booking/checkout.
- Referral codes should attribute the inviter and invitee.
- App download links should preserve `promo` and `ref`.
- QR codes should embed the same parameters as the visible CTA.

## Email And Retargeting Opportunities

These should be planned now but launched only after transactional order/payment testing is stable.

### Customer Email/SMS

- Welcome after customer signup.
- App download reminder after web signup.
- Abandoned booking reminder.
- Abandoned checkout reminder.
- Order confirmation.
- Pickup reminder.
- Pro assigned update.
- Delivery complete.
- Review request after delivery.
- Rebook reminder after 10-14 days.
- Wash Club points earned after order completion.
- Referral invite after a successful first order.

### Pro Email/SMS

- Pro application started but not submitted.
- Pro application submitted.
- Verification reminder.
- Approval email.
- First-job activation email.
- Weekly earnings summary.

### Retargeting Audiences

- Visited `/pricing` but did not start booking.
- Started `/booking` but did not complete checkout.
- Clicked App Store/Play Store but no first order yet.
- Viewed `/pro` but did not submit application.
- Viewed `/wash-club` but did not create an account.
- Viewed business pages but did not submit a lead.

## Trust And Proof Gaps

Trust is the main conversion lever for laundry because people are handing over personal clothing.

### Placeholder Review Rule

- Fake/sample review cards are allowed for layout and conversion planning only if they are visibly labelled as fake data.
- Current implementation uses `components/marketing/PlaceholderReviews.tsx` on home, pricing, and local landing pages.
- Every card is marked with "Placeholder review" and "Fake data", and the section includes a warning not to treat the quotes as real testimonials.
- Before public launch, either replace those cards with verified reviews where Washlee has permission to publish the name/quote, or hide the section entirely.
- Do not include fake reviews in JSON-LD, ad pixels, Open Graph images, or any schema that search engines could read as real review data.

### Claims That Need Proof Or Safer Wording

Review these pages before launch:

- `/services` has older pricing like `$5.00/kg`, `$10.00/kg`, and "First Pickup FREE". This conflicts with Direction A and should be corrected before public traffic.
- `/corporate` includes large trust claims like "500+ Companies Trust Us", "95% Employee Satisfaction", and "10+ Years Experience". These need proof or should be removed/softened.
- `/dashboard/support` references premium subscribers and recurring pickups. That conflicts with free Wash Club/pay-per-order positioning and should be cleaned before customer launch if this route is customer-visible.
- Any "100% money-back" or full replacement guarantee wording should match the real protection policy and legal terms.
- Any "nationwide" or non-Melbourne language should be removed unless the service is actually live outside Melbourne.

### Proof To Add

- Real app screenshots.
- Real booking screenshots.
- Real laundry pickup/delivery photos.
- Founder/team/about photo.
- Pro profile/headshot examples.
- Service area map.
- Real customer testimonials after orders exist.
- Real review snippets after review collection exists.
- Clear support email and response-time promise.
- Clear protection/guarantee wording.

## Assets Needed Before Launch

Must-have:

- App Store badge with final iOS URL.
- Google Play badge with final Android URL.
- QR code destination for app download/booking.
- 4-6 customer app screenshots:
  - home
  - booking
  - order tracking
  - Wash Club
  - account/preferences
  - order complete/review
- 3-5 Pro app screenshots:
  - available jobs
  - job details
  - earnings
  - proof/photo workflow
  - profile/settings
- Real laundry bag/pickup photo.
- Real folded laundry photo.
- Real Melbourne/service-area visual.
- Open Graph share image.
- Logo optimized for web, favicon, and social preview.

Nice-to-have:

- Founder/team photos.
- Pro headshots.
- Before/after laundry photo set.
- Short booking demo video.
- Short Pro recruitment video.
- Service area map graphic.

## What Should Wait Until After Backend/Payment Testing

Do not prioritize these until order creation, payment, booking drafts, notifications, and mobile handoff are tested end to end:

- Paid ad scaling.
- Large promo/referral launch.
- Server-side conversion API.
- Complex referral rewards.
- Abandoned checkout automation that depends on payment state.
- Public review/testimonial automation.
- Corporate account self-serve billing.
- Advanced Pro bonus campaigns.
- Dynamic suburb availability promises.
- Automated service-area checker tied to live capacity.
- Heavy admin marketing dashboards.

## Highest Priority Before Launch

1. Fix public-facing contradictions.
   - Correct `/services` pricing to Direction A.
   - Remove or prove unsupported corporate/trust claims.
   - Clean visible subscription language so Wash Club is free loyalty only.

2. Add SEO foundations.
   - `robots.txt`
   - `sitemap`
   - unique titles/descriptions
   - canonicals
   - Open Graph/Twitter tags
   - basic JSON-LD

3. Finish app-first handoff.
   - Mobile users to App Store/Play Store or app deep link.
   - Desktop users to QR code.
   - Booking, Wash Club, and Pro CTAs should route with campaign context.

4. Lock analytics event names.
   - Use the exact event list in this document.
   - Make sure GA4/Meta/TikTok conversions map to the same funnel stages.

5. Preserve UTM/promo/referral context.
   - Website to app.
   - Website to signup.
   - Website to booking.
   - Booking to checkout.

## Nice-To-Have After Launch

- Local SEO pages for Melbourne suburbs.
- App demo video.
- Customer testimonial blocks.
- Pro story/testimonial blocks.
- Email/SMS reactivation campaigns.
- Referral program page beyond placeholder.
- Review collection and public review snippets.
- Service area checker.
- Blog/care guide SEO content.
- A/B tests for homepage CTA and pricing page CTA.

## Things Not To Do Yet

- Do not run paid ads at scale before conversion tracking and payment testing are reliable.
- Do not advertise promo codes until promo passthrough and validation are tested.
- Do not promise suburbs that are not operationally ready.
- Do not publish fake testimonials or unsupported customer counts.
- Do not position Wash Club as a paid membership.
- Do not describe Pros as hourly staff.
- Do not send customers to admin/employee web flows from marketing CTAs.
- Do not index admin, employee, dashboard, checkout, tracking, debug, or test routes.
- Do not build more broad generic pages before fixing the core funnel.

## Exact Pages And Routes That Need Marketing Improvement

Priority 1:

- `/` - add full social metadata, JSON-LD, app handoff CTA, proof assets, and analytics labels.
- `/pricing` - add page metadata, FAQ JSON-LD, app-first booking CTA, campaign tracking.
- `/booking` - add UTM/promo/referral awareness, app handoff logic, and detailed funnel events.
- `/checkout` - track checkout/payment funnel events after payment testing is stable.
- `/mobile-app` - replace placeholder store links if needed, add QR code, app screenshots, and app download events.
- `/pro` - add Pro campaign tracking, stronger proof, and Pro application funnel events.
- `/auth/pro-signup-form` - track Pro application steps and attribution.
- `/auth/signup-customer` - track customer signup steps and attribution.
- `/wash-club` - keep free-loyalty language, add structured FAQ, app handoff, and conversion events.
- `/services` - fix outdated pricing/claims before launch.

Priority 2:

- `/how-it-works` - add metadata, FAQ schema, proof assets, and app CTA.
- `/about` - add real founder/team proof and Melbourne trust story.
- `/faq` - add FAQPage JSON-LD and clean duplicate/old answers.
- `/help-center` - add metadata and noindex internal account-only articles if needed.
- `/contact` - add support trust cues and contact conversion tracking.
- `/care-guide` - use as SEO content, add internal links to booking.
- `/damage-protection` - align guarantee wording with real policy.
- `/protection-plan` - align guarantee wording with real policy.
- `/corporate` - remove unsupported proof claims, add business lead tracking.
- `/wholesale` - clarify business-only flow and track lead submission.
- `/referrals` - replace placeholder after referral rules are ready.

Priority 3:

- `/loyalty` - redirect/canonical to `/wash-club`.
- `/subscriptions` - already redirects to `/wash-club`; add canonical/noindex strategy.
- `/app-info` - redirect/canonical to `/mobile-app`.
- `/pro-v2` - remove, noindex, or consolidate into `/pro`.
- `/booking-demo` - noindex or remove from public sitemap.
- `/booking-info` - noindex or consolidate.
- `/booking-hybrid` - noindex if not the launch booking route.
- `/gift-cards` - wait until backend/payment support exists.
- `/cancel-subscription` - only keep if needed for old users; avoid sending new customers there.

Routes to keep out of SEO:

- `/admin`
- `/admin-login`
- `/admin-setup`
- `/employee`
- `/dashboard`
- `/checkout`
- `/tracking`
- `/notifications`
- `/email-debug`
- `/test-remember-me`
- `/secret-admin`
- `/refund-payment`
- `/auth/callback`
- `/auth/verify-email`
- `/auth/verify-email-code`

## Exact Events We Should Track

Use this as the launch event contract.

```text
page_view
cta_clicked
nav_clicked
pricing_viewed
faq_viewed
contact_viewed
service_area_checked
app_download_clicked
qr_code_viewed
qr_code_scanned
app_handoff_clicked
app_store_clicked
play_store_clicked
deep_link_open_attempted
deep_link_fallback_used
send_app_link_requested
send_app_link_submitted
customer_signup_started
customer_signup_step_completed
customer_signup_completed
login_started
login_success
booking_started
booking_step_completed
booking_quote_viewed
promo_code_entered
promo_code_applied
promo_code_failed
checkout_started
payment_started
payment_completed
payment_failed
order_created
order_completed
pro_landing_viewed
pro_apply_clicked
pro_signup_started
pro_signup_step_completed
pro_application_submitted
pro_application_abandoned
pro_support_viewed
business_landing_viewed
corporate_cta_clicked
wholesale_started
wholesale_submitted
business_account_requested
wash_club_viewed
wash_club_join_clicked
wash_club_joined
referral_page_viewed
referral_share_clicked
review_request_clicked
review_submitted
```

Every conversion event should include:

```text
route
cta_label
device_type
utm_source
utm_medium
utm_campaign
utm_content
utm_term
promo
ref
campaign_id
landing_page
logged_in
user_role
```

Attach `order_id` only after an order exists. Do not attach sensitive customer details to ad pixels.
