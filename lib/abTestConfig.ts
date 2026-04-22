/**
 * Full-Page Back Button Configuration
 * 
 * This file controls which pages show the full-page back button
 * that takes up the header space and goes back to home.
 */

interface BackButtonConfig {
  fullPageBackButtonPages: string[]
}

export const backButtonConfig: BackButtonConfig = {
  // Pages that use full-page back button (takes entire viewport, goes back to home)
  fullPageBackButtonPages: [
    '/tracking',
    '/booking',
  ],
}

/**
 * Check if page should use full-page back button
 */
export function isFullPageBackButton(pathname: string): boolean {
  return backButtonConfig.fullPageBackButtonPages.some((page) => pathname.startsWith(page))
}

/**
 * Analytics tracking helper
 * Use this in components to track back button interactions
 */
export function trackBackButtonClick(page: string): void {
  if (typeof window !== 'undefined') {
    // Log to analytics service (e.g., Mixpanel, Amplitude, Google Analytics)
    console.log(`[Back Button] Clicked on ${page}`)
    
    // Example: Send to analytics
    // analytics.track('back_button_click', {
    //   page,
    //   timestamp: new Date().toISOString(),
    // })
  }
}
