# Washlee marketing assets

This folder holds the marketing imagery used across the public site (home, mobile-app,
about, etc.). The pages currently reference these filenames as `<img>` `src` paths or
Next `<Image>` paths. Until the real Washlee photos are dropped in, the site falls back
to CSS gradient placeholders and in-page CSS phone mockups so nothing looks broken.

## What to drop in here

Filename, dimensions, how it’s used, and what to shoot.

### Hero / lifestyle photos (real photos preferred)

| Filename | Aspect | Where it’s used | What to shoot |
| --- | --- | --- | --- |
| `hero-laundry-pickup.jpg` | 4:5 portrait, ≥1600×2000 | Homepage hero collage, About | Modern Melbourne apartment entryway with a neat laundry bag by the front door, soft daylight, no visible logos. |
| `folded-laundry.jpg` | 1:1 square, ≥1200×1200 | Why-Washlee feature strip | Freshly folded clean laundry stacked on a light timber table, soft natural light, modern Australian laundry room. |
| `app-booking-lifestyle.jpg` | 3:2 landscape, ≥1800×1200 | Mobile-app page hero band | Person holding a smartphone booking a laundry pickup, folded clothes in the background, Melbourne apartment, no readable text on phone. |
| `pickup-handoff.jpg` | 3:2 landscape, ≥1800×1200 | How-it-works section, homepage trust strip | Friendly laundry pickup handoff at an apartment doorway, reusable laundry bag, casual modern clothing, Melbourne residential building. |
| `pro-delivery.jpg` | 3:2 landscape, ≥1800×1200 | Pro page header band | Independent delivery worker carrying a clean laundry bag near a Melbourne apartment entrance, professional but casual, natural daylight. |
| `wash-club-rewards.jpg` | 4:3 landscape, ≥1600×1200 | Wash Club teaser, Dashboard | Clean folded laundry next to a smartphone showing a rewards-style app screen, bright modern home, soft mint accents. |

### App screenshots (most valuable — replaces CSS mockups)

When real screenshots exist, drop them in as PNG. Page mockups will switch to using
them automatically (any image at the path below renders inside the phone bezel).

Customer app:
- `app-screen-home.png` — 9:19.5 portrait, ≥800×1733 — home screen
- `app-screen-booking.png` — 9:19.5 portrait — booking flow
- `app-screen-pricing.png` — 9:19.5 portrait — pricing/quote screen
- `app-screen-tracking.png` — 9:19.5 portrait — order tracking
- `app-screen-rewards.png` — 9:19.5 portrait — Wash Club rewards
- `app-screen-completed.png` — 9:19.5 portrait — completed order / review

Pro app:
- `pro-screen-jobs.png` — available jobs list
- `pro-screen-job-details.png` — job details
- `pro-screen-earnings.png` — earnings
- `pro-screen-proof.png` — proof / photo upload

### Trust / about photos
- `team-founder.jpg` — 1:1 square, ≥1200×1200 — founder portrait, About page.
- `team-pro-portrait.jpg` — 1:1 square — example Washlee Pro headshot (with consent).
- `melbourne-service-area.jpg` — 16:9 — Melbourne street/suburb service-area photo.
- `home-laundry-room.jpg` — 4:3 — customer-friendly home laundry room context.

## Until the real photos arrive

If a path is missing, the page renders a styled gradient block in its place — the
layout will not break. Pages also use **CSS phone mockups** (in
`components/marketing/PhoneMockup.tsx`) to fake app screenshots until the real ones
exist. Replace those with `<Image src="/marketing/app-screen-*.png" />` once Luka has
real screens.

## AI-generated placeholders (allowed but temporary)

If you generate placeholder photos with an AI tool, save them with the filenames
above. Do **not** label them as real Washlee operations or use AI-generated faces as
real customers. They are placeholder marketing visuals only — replace with real
photos when available.

## Avoid
- Competitor branding
- Unrealistic luxury scenes
- American-looking houses (copy says Melbourne)
- Stock-photo-smile faces that look fake
- Messy laundry piles as the main hero image
