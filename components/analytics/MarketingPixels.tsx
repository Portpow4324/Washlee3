'use client'

import { useEffect, useState } from 'react'
import Script from 'next/script'

const gaId = process.env.NEXT_PUBLIC_GA_ID
const googleAdsId = process.env.NEXT_PUBLIC_GOOGLE_ADS_ID
const metaPixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID
const tikTokPixelId = process.env.NEXT_PUBLIC_TIKTOK_PIXEL_ID

function hasMarketingConsent() {
  if (typeof window === 'undefined') return false
  return window.localStorage.getItem('cookieConsent') === 'accepted'
}

export default function MarketingPixels() {
  const [enabled, setEnabled] = useState(false)
  const googleTagId = gaId || googleAdsId

  useEffect(() => {
    const syncConsent = () => setEnabled(hasMarketingConsent())
    syncConsent()

    window.addEventListener('storage', syncConsent)
    window.addEventListener('washlee-cookie-consent-changed', syncConsent)
    return () => {
      window.removeEventListener('storage', syncConsent)
      window.removeEventListener('washlee-cookie-consent-changed', syncConsent)
    }
  }, [])

  if (!enabled) return null

  return (
    <>
      {googleTagId && (
        <>
          <Script
            id="washlee-google-tag-src"
            src={`https://www.googletagmanager.com/gtag/js?id=${googleTagId}`}
            strategy="afterInteractive"
          />
          <Script
            id="washlee-google-tag"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
              __html: `
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                ${gaId ? `gtag('config', '${gaId}', { send_page_view: false });` : ''}
                ${googleAdsId ? `gtag('config', '${googleAdsId}');` : ''}
              `,
            }}
          />
        </>
      )}

      {metaPixelId && (
        <Script
          id="washlee-meta-pixel"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              !function(f,b,e,v,n,t,s)
              {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
              n.callMethod.apply(n,arguments):n.queue.push(arguments)};
              if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
              n.queue=[];t=b.createElement(e);t.async=!0;
              t.src=v;s=b.getElementsByTagName(e)[0];
              s.parentNode.insertBefore(t,s)}(window, document,'script',
              'https://connect.facebook.net/en_US/fbevents.js');
              fbq('init', '${metaPixelId}');
              fbq('track', 'PageView');
            `,
          }}
        />
      )}

      {tikTokPixelId && (
        <Script
          id="washlee-tiktok-pixel"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              !function (w, d, t) {
                w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];
                ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie"];
                ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};
                for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);
                ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e};
                ttq.load=function(e,n){var i="https://analytics.tiktok.com/i18n/pixel/events.js";
                ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=i,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};
                var o=document.createElement("script");o.type="text/javascript",o.async=!0,o.src=i+"?sdkid="+e+"&lib="+t;
                var a=document.getElementsByTagName("script")[0];a.parentNode.insertBefore(o,a)};
                ttq.load('${tikTokPixelId}');
                ttq.page();
              }(window, document, 'ttq');
            `,
          }}
        />
      )}
    </>
  )
}
