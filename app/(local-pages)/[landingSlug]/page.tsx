import { notFound } from 'next/navigation'
import LocalLandingPage from '@/components/marketing/LocalLandingPage'
import { cityLandingPages, findCityLandingPage } from '@/lib/localLandingPages'
import { createPageMetadata } from '@/lib/seo'

export function generateStaticParams() {
  return cityLandingPages.map((page) => ({ landingSlug: page.slug }))
}

export const dynamicParams = false

export function generateMetadata({ params }: { params: { landingSlug: string } }) {
  const page = findCityLandingPage(params.landingSlug)
  if (!page) return {}

  return createPageMetadata({
    title: page.metaTitle,
    description: page.description,
    path: `/${page.slug}`,
  })
}

export default function CityLandingPage({ params }: { params: { landingSlug: string } }) {
  const page = findCityLandingPage(params.landingSlug)
  if (!page) notFound()

  return <LocalLandingPage page={page} />
}
