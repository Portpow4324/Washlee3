'use client'

import Header from '@/components/Header'
import Footer from '@/components/Footer'
import Link from 'next/link'
import {
  Check,
  AlertCircle,
  Droplets,
  Wind,
  Zap,
  Shirt,
  ArrowRight,
  Thermometer,
  CheckCircle,
  Leaf,
} from 'lucide-react'
import PhotoSlot from '@/components/marketing/PhotoSlot'
import Reveal from '@/components/marketing/Reveal'

const standards = [
  { icon: Thermometer, title: 'Right temperature', body: 'Cold for darks and delicates, warm for everyday loads, hot only when fabrics call for it.' },
  { icon: Wind, title: 'Right cycle', body: 'Gentle, normal, or heavy chosen by load — never the same dial for everything.' },
  { icon: Droplets, title: 'Eco detergent', body: 'pH-neutral, dye-safe, low-fragrance detergent by default. Tell us if you have a preference.' },
  { icon: Zap, title: 'Smart drying', body: 'Tumble at low or medium heat, with hang dry available for delicates and stretchy fabrics.' },
]

const fabrics = [
  {
    fabric: 'Cotton',
    blurb: 'Most-used fabric we handle.',
    care: ['Warm wash, normal cycle', 'Standard detergent', 'Tumble dry medium', 'Light shrinkage possible (1–2%)'],
  },
  {
    fabric: 'Polyester &amp; blends',
    blurb: 'Durable and colour-fast.',
    care: ['Warm wash, gentle cycle', 'Standard detergent', 'Tumble dry low', 'Resistant to shrinking'],
  },
  {
    fabric: 'Wool &amp; cashmere',
    blurb: 'Treated as delicates.',
    care: ['Cold wash, wool-specific detergent', 'Hang dry — no machine', 'Reshape while damp', 'Notes welcome'],
  },
  {
    fabric: 'Activewear',
    blurb: 'Stretch + moisture-wick.',
    care: ['Cold wash, gentle', 'No fabric softener', 'Tumble dry low or hang', 'Skip dryer sheets'],
  },
  {
    fabric: 'Denim',
    blurb: 'Loved by us, kept dark.',
    care: ['Cold wash inside-out', 'Colour-safe detergent', 'Tumble dry low', 'Some fade is normal'],
  },
  {
    fabric: 'Linen',
    blurb: 'Crisp and breezy.',
    care: ['Warm wash, gentle', 'Mild detergent', 'Hang dry', 'Iron damp for best finish'],
  },
]

const dontAccept = [
  'Items with hazardous materials or contents',
  'Flammable materials or garments',
  'Items with sharp metal hardware that could damage other items',
  'Leather or suede garments',
  'Fur coats or fur-trimmed items',
  'Items visibly damaged or falling apart',
]

const specialNotes = [
  'Embellished items (sequins, beads) — we may need to hand wash',
  'Swimwear &amp; lingerie — flag in booking notes',
  'Vintage pieces — message us first if you&rsquo;re unsure',
  'Visible stains — call them out so we can pre-treat',
]

export default function CareGuidePage() {
  return (
    <>
      <Header />

      <section className="relative overflow-hidden bg-soft-hero">
        <div aria-hidden className="pointer-events-none absolute -top-20 -left-24 h-72 w-72 rounded-full bg-primary/15 blur-3xl animate-blob" />
        <div aria-hidden className="pointer-events-none absolute top-1/3 right-0 h-80 w-80 rounded-full bg-accent/20 blur-3xl animate-blob" style={{ animationDelay: '2s' }} />

        <div className="relative container-page py-14 sm:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-7 animate-slide-up">
              <span className="pill mb-4">
                <Shirt size={14} /> Care guide
              </span>
              <h1 className="h1 text-dark text-balance mb-4">How we care for your clothes.</h1>
              <p className="text-lg text-gray leading-relaxed mb-6 max-w-xl">
                Every fabric is different. Here&rsquo;s how Washlee Pros sort, wash, dry, and fold so your wardrobe lasts longer.
              </p>
              <ul className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-dark mb-8">
                <li className="inline-flex items-center gap-2"><CheckCircle size={16} className="text-primary" /> Eco detergent default</li>
                <li className="inline-flex items-center gap-2"><CheckCircle size={16} className="text-primary" /> Hang dry on request</li>
                <li className="inline-flex items-center gap-2"><Leaf size={16} className="text-primary" /> Low-temperature cycles</li>
              </ul>
              <Link href="/booking" className="btn-primary shadow-glow">
                Book a pickup with care notes
                <ArrowRight size={16} />
              </Link>
            </div>

            <div className="lg:col-span-5">
              <Reveal as="fade" delay={0.05}>
                <PhotoSlot
                  src="/marketing/care-fabric-detail.jpg"
                  alt="Close-up of folded fabric with visible texture"
                  aspect="aspect-[4/5]"
                  placeholderHint="Close-up of folded shirt or cashmere texture, soft natural light."
                  priority
                  caption="Sorted, washed, folded — the way you asked"
                />
              </Reveal>
            </div>
          </div>
        </div>
      </section>

      <section className="container-page py-14">
        <div className="text-center mb-10">
          <Reveal>
            <h2 className="section-title">Our care standards</h2>
            <p className="section-subtitle">The defaults we apply to every order.</p>
          </Reveal>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {standards.map((s, i) => (
            <Reveal key={s.title} delay={i * 0.05}>
              <div className="surface-card card-hover p-6 h-full">
                <div className="w-10 h-10 rounded-xl bg-mint flex items-center justify-center mb-4">
                  <s.icon size={18} className="text-primary-deep" />
                </div>
                <h3 className="font-bold text-dark mb-1.5">{s.title}</h3>
                <p className="text-sm text-gray leading-relaxed">{s.body}</p>
              </div>
            </Reveal>
          ))}
        </div>

        {/* Detail strip — eco detergent + folded laundry */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-10 max-w-5xl mx-auto">
          <Reveal>
            <PhotoSlot
              src="/marketing/care-detergent.jpg"
              alt="Eco detergent on a stack of folded laundry"
              aspect="aspect-[3/2]"
              placeholderHint="Eco detergent bottle on a stack of folded laundry, bright kitchen light."
              caption="Eco detergent · low fragrance · pH-neutral"
              tone="mint"
            />
          </Reveal>
          <Reveal delay={0.05}>
            <PhotoSlot
              src="/marketing/folded-laundry.jpg"
              alt="Freshly folded laundry"
              aspect="aspect-[3/2]"
              placeholderHint="Freshly folded clean laundry on a light timber surface."
              caption="Quality-checked before it&apos;s packaged"
              tone="warm"
            />
          </Reveal>
        </div>
      </section>

      <section className="bg-soft-mint">
        <div className="container-page py-14">
          <div className="text-center mb-10">
            <h2 className="section-title">Fabric-by-fabric</h2>
            <p className="section-subtitle">A quick guide to what we do with each material.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl mx-auto">
            {fabrics.map((f) => (
              <div key={f.fabric} className="surface-card p-6">
                <h3
                  className="font-bold text-dark mb-1"
                  dangerouslySetInnerHTML={{ __html: f.fabric }}
                />
                <p className="text-xs text-gray-soft mb-3">{f.blurb}</p>
                <ul className="space-y-1.5 text-sm text-gray">
                  {f.care.map((c) => (
                    <li key={c} className="flex items-start gap-1.5">
                      <Check size={14} className="text-primary-deep flex-shrink-0 mt-0.5" />
                      <span>{c}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="container-page py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto">
          <div className="surface-card p-6 border-red-200 bg-red-50">
            <h3 className="font-bold text-dark mb-3 flex items-center gap-2">
              <AlertCircle size={18} className="text-red-600" /> What we can&rsquo;t accept
            </h3>
            <ul className="space-y-1.5 text-sm text-dark">
              {dontAccept.map((item) => (
                <li key={item}>• {item}</li>
              ))}
            </ul>
          </div>
          <div className="surface-card p-6 border-amber-200 bg-amber-50">
            <h3 className="font-bold text-dark mb-3 flex items-center gap-2">
              <AlertCircle size={18} className="text-amber-700" /> Flag at booking
            </h3>
            <ul className="space-y-1.5 text-sm text-dark">
              {specialNotes.map((item) => (
                <li key={item} dangerouslySetInnerHTML={{ __html: `• ${item}` }} />
              ))}
            </ul>
          </div>
        </div>

        <div className="surface-card mt-6 p-6 max-w-4xl mx-auto bg-mint/40 border-primary/15">
          <p className="text-sm text-dark">
            <strong>Always check labels.</strong> If a label says &ldquo;hand wash&rdquo; or &ldquo;dry clean only&rdquo;, mention it in your booking notes and we&rsquo;ll handle it appropriately.
          </p>
        </div>
      </section>

      <section className="container-page pb-16">
        <div className="surface-card p-8 sm:p-10 bg-gradient-to-br from-mint to-white text-center">
          <h2 className="h3 text-dark mb-2">Ready to send a load?</h2>
          <p className="text-gray mb-6 max-w-xl mx-auto">$7.50/kg standard, $12.50/kg express, $75 minimum. Care notes welcome.</p>
          <Link href="/booking" className="btn-primary inline-flex">
            Book a pickup
            <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      <Footer />
    </>
  )
}
