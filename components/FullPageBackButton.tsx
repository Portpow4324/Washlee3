'use client'

import { useRouter, usePathname } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'
import { trackBackButtonClick } from '@/lib/abTestConfig'

export function FullPageBackButton() {
  const router = useRouter()
  const pathname = usePathname()

  const handleBack = () => {
    trackBackButtonClick(pathname)
    router.push('/')
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      <div className="flex items-center h-16 px-4">
        <button
          onClick={handleBack}
          className="flex items-center gap-2 text-dark hover:text-primary transition-colors group"
          aria-label="Go back to home"
        >
          <div className="p-2 rounded-lg group-hover:bg-primary/10 transition-colors">
            <ChevronLeft size={24} className="text-dark group-hover:text-primary transition-colors" />
          </div>
          <span className="text-sm font-semibold">Back to Home</span>
        </button>
      </div>
    </div>
  )
}

export default FullPageBackButton
