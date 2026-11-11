'use client'

import { useEffect, useRef } from 'react'

/* Client logo ticker — mirrors js/main.js §6 (hover pause) */
const CLIENTS = [
  'CARDEXIA',
  'PUNE FOOD TRUCK',
  'THE DENORY STORE',
  'GLOW FRAMZY',
  'THE HUNGRY NOMADS',
  'KUBES BY THE RAASTA',
  'WLLCRAFT',
  'SIRAMANI CAMPS & COTTAGES',
  'MAHAKALI INDUSTRIES',
]

function Track({ hidden = false }) {
  return (
    <div className="marquee-content" aria-hidden={hidden || undefined}>
      {CLIENTS.map((client, i) => (
        <ClientItem key={`${client}-${i}`} name={client} />
      ))}
    </div>
  )
}

function ClientItem({ name }) {
  return (
    <>
      <span className="marquee-item">{name}</span>
      <span className="marquee-dot">•</span>
    </>
  )
}

export default function Marquee() {
  const wrapRef = useRef(null)

  useEffect(() => {
    const contents = wrapRef.current?.querySelectorAll('.marquee-content')
    if (!contents) return
    const enter = (e) => {
      e.currentTarget.style.animationPlayState = 'paused'
    }
    const leave = (e) => {
      e.currentTarget.style.animationPlayState = 'running'
    }
    contents.forEach((c) => {
      c.addEventListener('mouseenter', enter)
      c.addEventListener('mouseleave', leave)
    })
    return () => {
      contents.forEach((c) => {
        c.removeEventListener('mouseenter', enter)
        c.removeEventListener('mouseleave', leave)
      })
    }
  }, [])

  return (
    <section className="marquee-section">
      <div className="marquee-wrapper" ref={wrapRef}>
        <Track />
        {/* Duplicate content to ensure smooth infinite loop scroll */}
        <Track hidden />
      </div>
    </section>
  )
}
