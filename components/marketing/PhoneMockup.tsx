'use client'

import { ReactNode } from 'react'

type Tone = 'mint' | 'dark' | 'cream'

const toneToBezel: Record<Tone, string> = {
  mint: 'bg-gradient-to-b from-[#1a2624] to-[#0c1413]',
  dark: 'bg-gradient-to-b from-[#0c1413] to-black',
  cream: 'bg-gradient-to-b from-[#26302E] to-[#0F1716]',
}

export interface PhoneMockupProps {
  children: ReactNode
  tone?: Tone
  /** Tailwind classes that control the outer wrapper — width / rotate / shadow */
  className?: string
  /** Hide the floating notch (e.g. when faking a fullscreen splash) */
  hideNotch?: boolean
  /** Aria label for screen-readers */
  label?: string
}

/**
 * CSS phone mockup. Renders a rounded device frame with notch + safe inner area.
 * Drop any inner JSX (or a real <Image src="/marketing/app-screen-*.png" />) to
 * preview a screen. Used until real Washlee app screenshots are available.
 */
export default function PhoneMockup({
  children,
  tone = 'mint',
  className = '',
  hideNotch = false,
  label = 'Washlee app preview',
}: PhoneMockupProps) {
  return (
    <div
      role="img"
      aria-label={label}
      className={`relative aspect-[9/19.5] w-full max-w-[280px] rounded-[2.5rem] p-[10px] shadow-[0_30px_70px_-20px_rgba(20,32,30,0.45)] ring-1 ring-white/5 ${toneToBezel[tone]} ${className}`}
    >
      <div className="relative h-full w-full overflow-hidden rounded-[2rem] bg-white">
        {!hideNotch && (
          <div className="pointer-events-none absolute left-1/2 top-2 z-20 h-5 w-24 -translate-x-1/2 rounded-full bg-black/95" />
        )}
        <div className="relative h-full w-full">
          {children}
        </div>
      </div>
      {/* Side button hints for realism */}
      <span className="pointer-events-none absolute -left-[2px] top-24 h-10 w-[3px] rounded-r-sm bg-black/40" />
      <span className="pointer-events-none absolute -left-[2px] top-40 h-14 w-[3px] rounded-r-sm bg-black/40" />
      <span className="pointer-events-none absolute -right-[2px] top-32 h-16 w-[3px] rounded-l-sm bg-black/40" />
    </div>
  )
}
