'use client'

import Header from '@/components/Header'
import Footer from '@/components/Footer'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ArrowRight,
  Briefcase,
  Clock,
  ShieldCheck,
  Sparkles,
  Star,
  Truck,
  CheckCircle,
  HelpCircle,
} from 'lucide-react'

const benefits = [
  {
    icon: Briefcase,
    title: 'Commission per order',
    body: 'You&rsquo;re paid for every completed order. Bigger or further jobs pay more — no flat hourly rate.',
  },
  {
    icon: Clock,
    title: 'You set the schedule',
    body: 'Accept the jobs you want, when you want. Decline anything that doesn&rsquo;t fit your day.',
  },
  {
    icon: Star,
    title: 'Build your rating',
    body: 'Customer ratings and on-time delivery shape which orders surface in your feed first.',
  },
  {
    icon: ShieldCheck,
    title: 'Protected by default',
    body: 'Coverage during pickup, washing, and delivery. Support team in your corner if anything goes wrong.',
  },
]

const steps = [
  { title: 'Apply', body: 'Tell us about you and your vehicle. Five minutes, online.' },
  { title: 'Verify', body: 'ID + national police check + ABN confirmation. Usually 2–3 business days.' },
  { title: 'Onboard', body: 'Quick walkthrough of the Pro app, pickup standards, and care basics.' },
  { title: 'Accept jobs', body: 'New orders show up in your area. Accept what suits you and get paid weekly.' },
]

const requirements = [
  '18+ with the right to work in Australia',
  'Valid Australian driver licence and reliable vehicle',
  'Smartphone (iOS or Android) with mobile data',
  'Active ABN as an independent contractor',
  'Pass an identity and national police check',
]

const faqs = [
  {
    q: 'How does pay work?',
    a: 'You&rsquo;re paid commission per completed order — no hourly wage, no salary. Each job shows the payout up-front before you accept it. You also keep 100% of any tips.',
  },
  {
    q: 'When are payouts?',
    a: 'Weekly payouts go out every Monday for jobs completed the previous week, into the Australian bank account you set up in your profile.',
  },
  {
    q: 'Am I an employee?',
    a: 'No. Washlee Pros are independent contractors operating under their own ABN. You&rsquo;re responsible for your own super, tax (including GST if applicable), and insurance arrangements.',
  },
  {
    q: 'What does it cost to join?',
    a: 'Nothing up-front. You provide your own vehicle, fuel, and smartphone. We provide the platform, customer demand, and access to partner laundry facilities.',
  },
  {
    q: 'Where do I work?',
    a: 'Currently across Greater Melbourne. We&rsquo;ll point you to nearby orders based on your home base and availability.',
  },
  {
    q: 'Can I decline jobs?',
    a: 'Always. Declines don&rsquo;t affect your ability to see future orders.',
  },
]

export default function ProPage() {
  const router = useRouter()

  return (
    <>
      <Header />

      {/* Hero */}
      <section className="bg-soft-hero">
        <div className="container-page py-14 sm:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-7 animate-slide-up">
              <span className="pill mb-4">
                <Briefcase size={14} /> Become a Washlee Pro
              </span>
              <h1 className="h1 text-dark text-balance mb-4">
                Independent work in Melbourne.
                <br />
                <span className="text-primary">Paid per order, not per hour.</span>
              </h1>
              <p className="text-lg text-gray leading-relaxed mb-8 max-w-xl">
                Set your own schedule, accept the orders you want, and get paid weekly. You&rsquo;re an
                independent contractor — work as much or as little as suits you.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={() => router.push('/auth/pro-signup-form')}
                  className="btn-primary shadow-glow"
                >
                  Apply to drive
                  <ArrowRight size={16} />
                </button>
                <a href="#how-it-works" className="btn-outline">
                  How it works
                </a>
              </div>
            </div>

            <div className="lg:col-span-5">
              <div className="surface-card p-6 sm:p-8 bg-gradient-to-br from-mint to-white">
                <p className="text-xs uppercase tracking-wider font-bold text-primary-deep mb-4">
                  At a glance
                </p>
                <ul className="space-y-3 text-sm">
                  <li className="flex items-center justify-between">
                    <span className="text-gray">Pay model</span>
                    <span className="font-bold text-dark">Commission per order</span>
                  </li>
                  <li className="flex items-center justify-between">
                    <span className="text-gray">Payout</span>
                    <span className="font-bold text-dark">Weekly, to your bank</span>
                  </li>
                  <li className="flex items-center justify-between">
                    <span className="text-gray">Schedule</span>
                    <span className="font-bold text-dark">100% flexible</span>
                  </li>
                  <li className="flex items-center justify-between">
                    <span className="text-gray">Service area</span>
                    <span className="font-bold text-dark">Greater Melbourne</span>
                  </li>
                  <li className="flex items-center justify-between">
                    <span className="text-gray">Cost to join</span>
                    <span className="font-bold text-dark">$0</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="container-page py-14 sm:py-20">
        <div className="text-center mb-10">
          <h2 className="section-title">Why drive for Washlee</h2>
          <p className="section-subtitle">Independent work, real demand, simple payouts.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {benefits.map((b) => (
            <div key={b.title} className="surface-card p-6">
              <div className="w-10 h-10 rounded-xl bg-mint flex items-center justify-center mb-4">
                <b.icon size={18} className="text-primary-deep" />
              </div>
              <h3 className="font-bold text-dark mb-1.5">{b.title}</h3>
              <p
                className="text-sm text-gray leading-relaxed"
                dangerouslySetInnerHTML={{ __html: b.body }}
              />
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="bg-soft-mint">
        <div className="container-page py-14 sm:py-20">
          <div className="text-center mb-10">
            <h2 className="section-title">How it works</h2>
            <p className="section-subtitle">Four steps from application to your first payout.</p>
          </div>
          <ol className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {steps.map((s, i) => (
              <li key={s.title} className="surface-card p-6">
                <div className="w-9 h-9 rounded-full bg-primary text-white font-bold flex items-center justify-center mb-3">
                  {i + 1}
                </div>
                <h3 className="font-bold text-dark mb-1.5">{s.title}</h3>
                <p className="text-sm text-gray leading-relaxed">{s.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Pay model */}
      <section className="container-page py-14">
        <div className="surface-card p-6 sm:p-10 max-w-4xl mx-auto bg-gradient-to-br from-mint to-white">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
            <div className="md:col-span-7">
              <span className="pill mb-3">
                <Sparkles size={14} /> Independent contractor
              </span>
              <h2 className="h3 text-dark mb-3">Paid for every completed order</h2>
              <p className="text-gray text-base leading-relaxed mb-4">
                Each order shows you the payout before you accept. Larger loads, longer distances, and
                Express jobs pay more. There&rsquo;s no hourly rate, salary, or wage — you decide how much
                you want to earn by choosing the jobs you accept.
              </p>
              <ul className="space-y-2 text-sm text-dark">
                <li className="flex items-start gap-2"><CheckCircle size={16} className="text-primary-deep mt-0.5" /> 100% of customer tips</li>
                <li className="flex items-start gap-2"><CheckCircle size={16} className="text-primary-deep mt-0.5" /> Weekly payouts to your AU bank account</li>
                <li className="flex items-start gap-2"><CheckCircle size={16} className="text-primary-deep mt-0.5" /> Real-time earnings in the Pro app</li>
              </ul>
            </div>
            <div className="md:col-span-5">
              <div className="surface-card p-5 bg-white">
                <p className="text-xs uppercase tracking-wider font-bold text-gray-soft mb-2">
                  Payout cadence
                </p>
                <ul className="space-y-2 text-sm text-dark">
                  <li className="flex items-center justify-between"><span className="text-gray">Earnings cycle</span><span className="font-semibold">Mon–Sun</span></li>
                  <li className="flex items-center justify-between"><span className="text-gray">Payout day</span><span className="font-semibold">Every Monday</span></li>
                  <li className="flex items-center justify-between"><span className="text-gray">Method</span><span className="font-semibold">AU bank transfer</span></li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Requirements */}
      <section className="container-page py-14">
        <div className="text-center mb-8">
          <h2 className="section-title">What you&rsquo;ll need</h2>
        </div>
        <div className="surface-card p-6 sm:p-8 max-w-2xl mx-auto">
          <ul className="space-y-3">
            {requirements.map((r) => (
              <li key={r} className="flex items-start gap-3 text-sm text-dark">
                <CheckCircle size={18} className="text-primary-deep flex-shrink-0 mt-0.5" />
                <span>{r}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-soft-mint">
        <div className="container-page py-14">
          <div className="text-center mb-10">
            <h2 className="section-title">Pro FAQ</h2>
            <p className="section-subtitle">The basics, answered.</p>
          </div>
          <div className="max-w-2xl mx-auto space-y-3">
            {faqs.map((faq) => (
              <details key={faq.q} className="group surface-card p-5">
                <summary className="flex items-center justify-between cursor-pointer list-none">
                  <span className="font-semibold text-dark pr-4 flex items-center gap-2">
                    <HelpCircle size={16} className="text-primary-deep flex-shrink-0" />
                    {faq.q}
                  </span>
                  <span className="text-primary-deep transition group-open:rotate-180" aria-hidden>
                    ⌄
                  </span>
                </summary>
                <p className="text-sm text-gray leading-relaxed mt-3">{faq.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="container-page py-16">
        <div className="surface-card p-8 sm:p-12 bg-gradient-to-br from-primary to-accent text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-3">Ready to drive?</h2>
          <p className="text-white/90 mb-6 max-w-xl mx-auto">
            Apply in five minutes. We&rsquo;ll review your details and reach out within a couple of business days.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              type="button"
              onClick={() => router.push('/auth/pro-signup-form')}
              className="inline-flex items-center justify-center gap-2 bg-white text-primary-deep font-bold px-8 py-3 rounded-full hover:shadow-lg transition min-h-[48px]"
            >
              <Truck size={16} />
              Apply now
            </button>
            <Link
              href="/auth/employee-signin"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full font-semibold text-white border border-white/30 hover:bg-white/10 transition min-h-[48px]"
            >
              I&rsquo;m already a Pro
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </>
  )
}
