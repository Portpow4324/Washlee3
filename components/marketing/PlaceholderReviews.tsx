'use client'

import { AlertTriangle, Quote, Star } from 'lucide-react'

type ReviewContext = 'customer' | 'pricing' | 'local'

type PlaceholderReview = {
  line: string
  who: string
  tag: string
}

const reviewsByContext: Record<ReviewContext, PlaceholderReview[]> = {
  customer: [
    {
      line: 'Sample quote: The pickup window is the difference. I do not plan my morning around laundry anymore.',
      who: 'Sample Melbourne customer A',
      tag: 'Standard wash and fold',
    },
    {
      line: 'Sample quote: Express same-day saved a weekend load. Easy reorder in the app.',
      who: 'Sample Melbourne parent B',
      tag: 'Express same-day',
    },
    {
      line: 'Sample quote: No subscription was the selling point. I pay only when I need a wash.',
      who: 'Sample renter C',
      tag: 'Free Wash Club',
    },
  ],
  pricing: [
    {
      line: 'Sample quote: The $75 minimum was clear before booking, so there were no surprises.',
      who: 'Sample pricing visitor A',
      tag: '$7.50/kg standard',
    },
    {
      line: 'Sample quote: Medium and large bag estimates made it easy to work out what my load would cost.',
      who: 'Sample pricing visitor B',
      tag: 'Bag estimate',
    },
    {
      line: 'Sample quote: I liked seeing Express and standard side by side before choosing.',
      who: 'Sample pricing visitor C',
      tag: 'Express comparison',
    },
  ],
  local: [
    {
      line: 'Sample quote: Pickup and delivery in my suburb is the whole reason this would fit my week.',
      who: 'Sample local customer A',
      tag: 'Melbourne pickup',
    },
    {
      line: 'Sample quote: The app-first booking flow makes repeat laundry feel simple.',
      who: 'Sample local customer B',
      tag: 'App booking',
    },
    {
      line: 'Sample quote: Seeing the exact service area would help me trust that Washlee covers my address.',
      who: 'Sample local customer C',
      tag: 'Service area',
    },
  ],
}

export default function PlaceholderReviews({
  context = 'customer',
  className = 'bg-white',
}: {
  context?: ReviewContext
  className?: string
}) {
  const reviews = reviewsByContext[context]

  return (
    <section className={`section ${className}`} data-placeholder-reviews="true">
      <div className="text-center mb-10">
        <span className="pill mb-4 bg-amber-50 text-amber-800 border-amber-200">
          <AlertTriangle size={14} /> Fake sample data
        </span>
        <h2 className="section-title">Placeholder reviews for layout only</h2>
        <p className="section-subtitle">
          These are fake/sample reviews, clearly marked for conversion layout planning. Replace with verified customer reviews before public launch.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {reviews.map((review) => (
          <figure
            key={`${review.who}-${review.tag}`}
            className="surface-card card-hover p-6 h-full border-amber-200 bg-amber-50/30"
            aria-label="Placeholder review, fake sample data"
            data-placeholder-review="true"
          >
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-800">
                Placeholder review
              </span>
              <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-800 ring-1 ring-amber-200">
                Fake data
              </span>
            </div>

            <Quote size={18} className="text-primary-deep mb-3" />
            <blockquote className="text-dark text-base leading-relaxed">{review.line}</blockquote>

            <div className="mt-4 flex items-center gap-1 text-amber-500" aria-label="Sample rating layout, not a real rating">
              {[0, 1, 2, 3, 4].map((star) => (
                <Star key={star} size={14} fill="currentColor" />
              ))}
              <span className="ml-2 text-[11px] font-semibold uppercase tracking-wider text-amber-800">
                sample rating
              </span>
            </div>

            <figcaption className="mt-4 text-xs text-gray">
              <span className="font-semibold text-dark">{review.who}</span>
              <span className="mx-2 text-line">-</span>
              <span>{review.tag}</span>
            </figcaption>
          </figure>
        ))}
      </div>

      <p className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-center text-xs font-medium text-amber-900">
        Do not treat these as real testimonials. Keep the labels visible, replace with verified reviews, or hide this section before launch.
      </p>
    </section>
  )
}
