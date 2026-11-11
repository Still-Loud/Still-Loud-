'use client'

import { useEffect } from 'react'

/**
 * Tawk.to live chat — D6: loaded on first user interaction instead of on load.
 * The widget is identical; only the load timing changes (INP protection).
 */
export default function TawkTo() {
  useEffect(() => {
    let loaded = false

    const load = () => {
      if (loaded) return
      loaded = true
      window.Tawk_API = window.Tawk_API || {}
      window.Tawk_LoadStart = new Date()
      const s1 = document.createElement('script')
      const s0 = document.getElementsByTagName('script')[0]
      s1.async = true
      s1.src = 'https://embed.tawk.to/6a50a992a6558f1d451fe2fa/1jt5hcpjs'
      s1.charset = 'UTF-8'
      s1.setAttribute('crossorigin', '*')
      s0.parentNode.insertBefore(s1, s0)
      cleanup()
    }

    const events = ['pointerdown', 'keydown', 'scroll', 'touchstart']
    const cleanup = () => events.forEach((e) => window.removeEventListener(e, load))

    events.forEach((e) => window.addEventListener(e, load, { once: true, passive: true }))
    return cleanup
  }, [])

  return null
}
