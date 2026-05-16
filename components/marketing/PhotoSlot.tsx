'use client'

import Image from 'next/image'
import { useState } from 'react'
import { ImageIcon } from 'lucide-react'

type Tone = 'mint' | 'warm' | 'cool'

const toneToFallback: Record<Tone, string> = {
  mint: 'bg-photo-fallback',
  warm: 'bg-photo-fallback-warm',
  cool: 'bg-gradient-to-br from-[#F0F7FF] via-white to-[#E8FFFB]',
}

export interface PhotoSlotProps {
  /** Path under /public — e.g. /marketing/hero-laundry-pickup.jpg */
  src: string
  /** Image alt text (real, descriptive) */
  alt: string
  /** Aspect class — provided so layout never jumps. e.g. "aspect-[4/5]", "aspect-[3/2]" */
  aspect?: string
  /** Tailwind class overrides for the wrapper */
  className?: string
  /** Whether to include responsive sizes prop */
  sizes?: string
  /** Hint shown when image is missing — describes what photo to drop in */
  placeholderHint?: string
  /** Whether the photo is above the fold */
  priority?: boolean
  /** Visual fallback gradient */
  tone?: Tone
  /** Caption (optional) */
  caption?: string
  /** Hide the placeholder hint label even on missing image (use sparingly) */
  hideHint?: boolean
  /** Rounded corners */
  rounded?: 'lg' | '2xl' | '3xl' | 'full'
  /** Object position override */
  objectPosition?: string
}

const radiusClass: Record<NonNullable<PhotoSlotProps['rounded']>, string> = {
  lg: 'rounded-lg',
  '2xl': 'rounded-2xl',
  '3xl': 'rounded-3xl',
  full: 'rounded-full',
}

/**
 * Image slot with a graceful gradient fallback if the file is missing.
 * Use this everywhere a real photo should land — the page renders cleanly
 * during the design phase and improves automatically when Luka drops the
 * real photo into /public/marketing/.
 */
export default function PhotoSlot({
  src,
  alt,
  aspect = 'aspect-[3/2]',
  className = '',
  sizes = '(min-width: 1024px) 50vw, 100vw',
  placeholderHint,
  priority = false,
  tone = 'mint',
  caption,
  hideHint = false,
  rounded = '2xl',
  objectPosition = 'center',
}: PhotoSlotProps) {
  const [errored, setErrored] = useState(false)

  return (
    <figure className={`relative overflow-hidden border border-line ${radiusClass[rounded]} ${toneToFallback[tone]} ${aspect} ${className}`}>
      {!errored && (
        <Image
          src={src}
          alt={alt}
          fill
          sizes={sizes}
          priority={priority}
          className="object-cover"
          style={{ objectPosition }}
          onError={() => setErrored(true)}
        />
      )}

      {errored && !hideHint && placeholderHint && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/80 text-primary-deep shadow-sm">
            <ImageIcon size={20} />
          </div>
          <div className="max-w-[80%]">
            <p className="text-[11px] font-bold uppercase tracking-wider text-primary-deep">Replace with real photo</p>
            <p className="mt-1 text-xs text-dark/70 leading-relaxed">{placeholderHint}</p>
            <p className="mt-2 font-mono text-[10px] text-dark/50 break-all">{src}</p>
          </div>
        </div>
      )}

      {caption && !errored && (
        <figcaption className="absolute bottom-3 left-3 right-3 rounded-xl bg-white/90 px-3 py-2 text-xs font-semibold text-dark shadow-sm backdrop-blur">
          {caption}
        </figcaption>
      )}
    </figure>
  )
}
