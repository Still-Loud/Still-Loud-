'use client'

import { useEffect, useState } from 'react'

/* Floating back-to-top pill — mirrors js/main.js §7 */
export default function BackToTop() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 800)
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <button
      id="back-to-top"
      className={`back-to-top${show ? ' show' : ''}`}
      aria-label="Back to top"
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
    >
      <i className="fas fa-arrow-up" />
    </button>
  )
}
