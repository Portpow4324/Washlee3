import type { Metadata } from 'next'

type PageSeoInput = {
  title: string
  description: string
  path: string
  image?: string
}

const siteName = 'Washlee'
const defaultImage = '/logo-washlee.png'

export function createPageMetadata({
  title,
  description,
  path,
  image = defaultImage,
}: PageSeoInput): Metadata {
  return {
    title,
    description,
    alternates: {
      canonical: path,
    },
    openGraph: {
      type: 'website',
      siteName,
      title,
      description,
      url: path,
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [image],
    },
  }
}
