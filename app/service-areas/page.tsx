import Link from 'next/link'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { ArrowRight, MapPin } from 'lucide-react'
import { serviceAreaSuburbs, slugifySuburb } from '@/lib/localLandingPages'
import { createPageMetadata } from '@/lib/seo'

export const metadata = createPageMetadata({
  title: 'Washlee Service Areas | Melbourne Laundry Pickup',
  description:
    'Explore Washlee laundry pickup service areas across Greater Melbourne. Pricing is $7.50/kg standard, $12.50/kg express, with a $75 minimum order.',
  path: '/service-areas',
})

export default function ServiceAreasPage() {
  return (
    <>
      <Header />

      <section className="bg-soft-hero">
        <div className="container-page py-14 sm:py-24">
          <div className="max-w-2xl">
            <span className="pill mb-4">
              <MapPin size={14} /> Melbourne service areas
            </span>
            <h1 className="h1 text-dark text-balance mb-4">Laundry pickup across Greater Melbourne.</h1>
            <p className="text-lg text-gray leading-relaxed">
              Washlee is Melbourne-first. Start with your suburb below, then confirm availability in the booking flow before checkout.
            </p>
          </div>
        </div>
      </section>

      <section className="container-page py-14">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {serviceAreaSuburbs.map((suburb) => (
            <Link
              key={suburb}
              href={`/service-areas/${slugifySuburb(suburb)}`}
              className="surface-card p-5 hover:border-primary transition"
            >
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="font-bold text-dark">{suburb}</h2>
                  <p className="text-sm text-gray mt-1">$7.50/kg standard · $75 minimum</p>
                </div>
                <ArrowRight size={18} className="text-primary-deep" />
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="container-page pb-16">
        <div className="surface-card p-8 sm:p-10 bg-gradient-to-br from-mint to-white text-center">
          <h2 className="h3 text-dark mb-2">Not sure if we cover you?</h2>
          <p className="text-gray mb-6 max-w-xl mx-auto">
            Enter your address in booking. If no Washlee Pro is available within range, we’ll tell you before payment.
          </p>
          <Link href="/booking?landing_page=service-areas" className="btn-primary inline-flex">
            Check availability
            <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      <Footer />
    </>
  )
}
