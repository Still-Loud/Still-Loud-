'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

/* Testimonials infinite-loop carousel — mirrors js/main.js §5 exactly:
   3/2/1 slides per view, 4.5 s autoplay, hover pause, seamless clones, dots. */
const TESTIMONIALS = [
  {
    logo: '/assets/Testemonial_Logos/cardexia.jpg',
    alt: 'Cardexia logo',
    name: 'By Team Cardexia',
    company: 'Cardexia',
    text: '"StillLoud has been an incredible partner online. Their team brings amazing designs to the table, beautifully showcased and impactful. Highly professional, responsive, and always ready to push boundaries for Cardexia."',
  },
  {
    logo: '/assets/Testemonial_Logos/Kubes 1.png',
    alt: 'Kubes logo',
    name: 'Ankit Gupta',
    company: 'KUBES STAYS',
    text: '"A huge shoutout to the amazing, innovative young team at StillLoud for driving our social media. Despite working with limited raw footage, their designs and creative solutions have been vital in helping Kubes grow."',
  },
  {
    logo: '/assets/Testemonial_Logos/SIRAMANI CAMPS LOGO.jpg',
    alt: 'Siramani logo',
    name: 'Sonu Ji',
    company: 'Siramani River camps',
    text: '"StillLoud transformed our brand presence completely. Their strategic approach to design and social media has made Siramani Camps stand out in a competitive market. Truly exceptional work!"',
  },
  {
    logo: '/assets/Testemonial_Logos/Denory .jpg',
    alt: 'Denory logo',
    name: 'Denish Maniya',
    company: 'The Denory',
    text: '"Working with StillLoud was a game changer. They understood our brand vision immediately and delivered designs that perfectly matched our identity. Our online engagement has grown significantly."',
  },
  {
    logo: '/assets/Testemonial_Logos/mahakali-industries-logo.png',
    alt: 'Mahakali logo',
    name: 'Jay Panchal',
    company: 'Mahakali Industries',
    text: '"StillLoud delivered exactly what we needed — a strong industrial brand identity. Their professional approach and creative output exceeded our expectations. Proud to have them as our creative partner."',
  },
  {
    logo: '/assets/Testemonial_Logos/Wllcraft_Logo.ico',
    alt: 'Wllcraft logo',
    name: 'Wllcraft',
    company: 'By Team Wllcraft',
    text: '"The StillLoud team brought fresh energy and bold creativity to Wllcraft. Their designs are always on-brand, delivered on time, and consistently receive great feedback from our community."',
  },
]

const TOTAL = TESTIMONIALS.length
const DURATION = 520
const AUTO_DELAY = 4500

function getSlidesPerView() {
  if (typeof window === 'undefined') return 3
  const w = window.innerWidth
  if (w <= 768) return 1
  if (w <= 1024) return 2
  return 3
}

function TestimonialCard({ item }) {
  return (
    <div className="testimonial-card">
      <div className="testimonial-card-header">
        {/* Left: Logo & Author Details */}
        <div className="author-info-wrapper">
          <div className="logo-container">
            <img src={item.logo} alt={item.alt} className="t-company-logo" loading="lazy" />
          </div>
          <div className="author-details">
            <h4>{item.name}</h4>
            <p>{item.company}</p>
          </div>
        </div>

        {/* Right: Review Badge */}
        <div className="stars-badge">
          <div className="stars-row">
            <i className="fas fa-star" />
            <i className="fas fa-star" />
            <i className="fas fa-star" />
            <i className="fas fa-star" />
            <i className="fas fa-star" />
          </div>
          <span className="rating-num">5/5</span>
        </div>
      </div>
      <p className="testimonial-text">{item.text}</p>
    </div>
  )
}

export default function Testimonials() {
  const trackRef = useRef(null)
  const wrapperRef = useRef(null)
  const [spv, setSpv] = useState(3)
  const [current, setCurrent] = useState(0)
  const [animate, setAnimate] = useState(true)
  const [paused, setPaused] = useState(false)
  const animatingRef = useRef(false)

  const step = useCallback(() => {
    const track = trackRef.current
    if (!track) return 0
    const card = track.querySelector('.testimonial-card')
    if (!card) return 0
    const gap = parseFloat(getComputedStyle(track).gap) || 28
    return card.getBoundingClientRect().width + gap
  }, [])

  /* Measure on mount + resize (mirrors getSlidesPerView + re-jump) */
  useEffect(() => {
    const onResize = () => setSpv(getSlidesPerView())
    setSpv(getSlidesPerView())
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  /* Seamless wrap: once a clone slide finishes, jump without transition */
  const settle = useCallback(
    (idx) => {
      if (idx >= TOTAL) {
        setAnimate(false)
        setCurrent(0)
        requestAnimationFrame(() => requestAnimationFrame(() => setAnimate(true)))
      } else if (idx < 0) {
        setAnimate(false)
        setCurrent(TOTAL - 1)
        requestAnimationFrame(() => requestAnimationFrame(() => setAnimate(true)))
      }
    },
    []
  )

  const slideTo = useCallback(
    (idx) => {
      if (animatingRef.current) return
      animatingRef.current = true
      setCurrent(idx)
      window.setTimeout(() => {
        animatingRef.current = false
        settle(idx)
      }, DURATION)
    },
    [settle]
  )

  /* Autoplay — 4500 ms, paused on hover */
  useEffect(() => {
    if (paused) return
    const timer = window.setInterval(() => {
      slideTo(current >= TOTAL ? 0 : current + 1)
    }, AUTO_DELAY)
    return () => window.clearInterval(timer)
  }, [paused, current, slideTo])

  const leading = TESTIMONIALS.slice(TOTAL - spv)
  const trailing = TESTIMONIALS.slice(0, spv)
  const offset = (current + spv) * step()

  const go = (delta) => {
    setPaused(true)
    slideTo(current + delta)
    window.setTimeout(() => setPaused(false), AUTO_DELAY)
  }

  return (
    <section id="reviews" className="testimonials-section">
      <div className="grid-overlay"></div>
      <div className="section-container">
        <div className="testimonials-header">
          <h2 className="testimonials-title">
            Testimonials that speak to <span className="highlight-red">Our Results</span>
          </h2>
          <p className="testimonials-subtitle">
            Hear from the brands we&apos;ve transformed across every industry
          </p>
        </div>

        {/* Carousel Wrapper: nav buttons + viewport */}
        <div
          className="testimonials-carousel-wrapper"
          ref={wrapperRef}
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          {/* Prev Button */}
          <button
            type="button"
            className="testimonial-nav-btn t-prev-btn"
            id="testimonial-prev"
            aria-label="Previous Testimonial"
            onClick={() => go(-1)}
          >
            <i className="fas fa-chevron-left" />
          </button>

          <div className="testimonials-viewport">
            <div
              className="testimonials-track"
              id="testimonials-track"
              ref={trackRef}
              style={{
                transform: `translateX(-${offset}px)`,
                transition: animate
                  ? `transform ${DURATION}ms cubic-bezier(0.25,0.8,0.25,1)`
                  : 'none',
              }}
            >
              {leading.map((item, i) => (
                <TestimonialCard key={`lead-${i}`} item={item} />
              ))}
              {TESTIMONIALS.map((item, i) => (
                <TestimonialCard key={`card-${i}`} item={item} />
              ))}
              {trailing.map((item, i) => (
                <TestimonialCard key={`trail-${i}`} item={item} />
              ))}
            </div>
          </div>

          {/* Next Button */}
          <button
            type="button"
            className="testimonial-nav-btn t-next-btn"
            id="testimonial-next"
            aria-label="Next Testimonial"
            onClick={() => go(1)}
          >
            <i className="fas fa-chevron-right" />
          </button>
        </div>

        {/* Dot Indicators */}
        <div className="testimonials-dots" id="testimonials-dots" role="tablist">
          {TESTIMONIALS.map((_, i) => (
            <button
              key={`dot-${i}`}
              type="button"
              className={`t-dot${((current % TOTAL) + TOTAL) % TOTAL === i ? ' active' : ''}`}
              role="tab"
              aria-label={`Go to testimonial ${i + 1}`}
              onClick={() => {
                setPaused(true)
                slideTo(i)
              }}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
