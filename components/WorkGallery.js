'use client'

import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { GALLERY } from './work-gallery-data'

/* Portfolio filters, reveal animation, lightbox and reel playback.
   Behaviour mirrors js/our-work.js §4–§8. */

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'creative', label: 'Social Media' },
  { key: 'reels', label: 'Reels' },
  { key: 'branding', label: 'Branding' },
  { key: 'logo', label: 'Logo' },
  { key: 'printables', label: 'Print' },
]

function matches(category, filter) {
  if (filter === 'all') return true
  if (filter === 'branding') return category === 'branding' || category === 'logo'
  return category === filter
}

export default function WorkGallery({ cards = [] }) {
  const router = useRouter()
  const allCards = useMemo(() => [...cards, ...GALLERY], [cards])
  const [filter, setFilter] = useState('all')
  const [revealed, setRevealed] = useState(() => new Set())
  const [lightbox, setLightbox] = useState({ open: false, index: 0 })
  const [filterEpoch, setFilterEpoch] = useState(0)
  const [revealMode, setRevealMode] = useState('initial')

  const cardRefs = useRef([])
  const videoRefs = useRef([])
  const touchStartX = useRef(0)
  const lastFilter = useRef(filter)

  const visible = useMemo(
    () => allCards.map((card, i) => ({ card, i })).filter(({ card }) => matches(card.category, filter)),
    [filter, allCards]
  )

  /* Image list for the lightbox — visible images only, in gallery order */
  const imageList = useMemo(
    () => visible.filter(({ card }) => card.type === 'image'),
    [visible]
  )

  /* Initial reveal on scroll — mirrors IntersectionObserver in js/our-work.js §5 */
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return
          const idx = Number(entry.target.dataset.index)
          setRevealed((prev) => {
            if (prev.has(idx)) return prev
            const next = new Set(prev)
            next.add(idx)
            return next
          })
          observer.unobserve(entry.target)
        })
      },
      { threshold: 0.08, rootMargin: '0px 0px -40px 0px' }
    )

    cardRefs.current.forEach((el) => el && observer.observe(el))
    return () => observer.disconnect()
  }, [filterEpoch])

  /* On filter change: reset then reveal the visible set with a stagger.
     Mirrors applyFilter() in js/our-work.js §4. Skips the initial mount so
     cards below the fold still wait for the scroll observer. */
  useEffect(() => {
    if (lastFilter.current === filter) return
    lastFilter.current = filter
    setRevealMode('filtered')
    setRevealed(new Set())
    setFilterEpoch((n) => n + 1)
    const raf = requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        setRevealed(new Set(visible.map(({ i }) => i)))
      })
    )
    return () => cancelAnimationFrame(raf)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter])

  /* Close lightbox when the filter changes */
  useEffect(() => {
    setLightbox({ open: false, index: 0 })
  }, [filter])

  const showImage = useCallback(
    (idx) => {
      if (imageList.length === 0) return
      const wrapped = ((idx % imageList.length) + imageList.length) % imageList.length
      setLightbox({ open: true, index: wrapped })
    },
    [imageList.length]
  )

  const closeLightbox = useCallback(() => setLightbox({ open: false, index: 0 }), [])

  /* Keyboard navigation — mirrors js/our-work.js §6 */
  useEffect(() => {
    if (!lightbox.open) return
    const onKey = (e) => {
      if (e.key === 'Escape') closeLightbox()
      if (e.key === 'ArrowLeft') showImage(lightbox.index - 1)
      if (e.key === 'ArrowRight') showImage(lightbox.index + 1)
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = 'auto'
    }
  }, [lightbox.open, lightbox.index, showImage, closeLightbox])

  /* Reels: click to play/pause, pause others, pause when scrolled away */
  const toggleReel = (i) => {
    const vid = videoRefs.current[i]
    if (!vid) return
    if (vid.paused) {
      videoRefs.current.forEach((other, j) => {
        if (other && j !== i && !other.paused) {
          other.pause()
          other.closest('.gallery-card')?.classList.remove('playing')
        }
      })
      vid.play().catch(() => {})
      vid.closest('.gallery-card')?.classList.add('playing')
    } else {
      vid.pause()
      vid.closest('.gallery-card')?.classList.remove('playing')
    }
  }

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) return
          const vid = entry.target.querySelector('video')
          if (vid && !vid.paused) {
            vid.pause()
            entry.target.classList.remove('playing')
          }
        })
      },
      { threshold: 0.2 }
    )
    videoRefs.current.forEach((vid) => vid && observer.observe(vid.closest('.gallery-card')))
    return () => observer.disconnect()
  }, [filterEpoch])

  const activeCard = imageList[lightbox.index]

  return (
    <>
      {/* ── Explore header & category filter tabs ── */}
      <section className="ow-explore-section" id="explore-work" aria-label="Explore Portfolio by Category">
        <div className="ow-explore-container">
          <div className="ow-explore-header-row">
            {/* Left: Diverse. Creative. Impactful */}
            <div className="ow-explore-left">
              <span className="ow-explore-eyebrow">EXPLORE OUR WORK</span>
              <h2 className="ow-explore-title">
                Diverse. Creative.
                <br />
                <span className="ow-explore-purple">Impactful</span>
                <span className="ow-explore-arrow-circle" aria-hidden="true">
                  <i className="fas fa-arrow-right" />
                </span>
              </h2>
            </div>

            {/* Right: Modern Category Filter Pills */}
            <div className="ow-explore-right">
              <div className="ow-filter-tabs" role="tablist" aria-label="Filter portfolio by category">
                {FILTERS.map((f) => (
                  <button
                    key={f.key}
                    type="button"
                    className={`ow-filter-btn${filter === f.key ? ' active' : ''}`}
                    data-filter={f.key}
                    role="tab"
                    aria-selected={filter === f.key}
                    aria-controls="ow-gallery"
                    onClick={() => setFilter(f.key)}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Hidden counter for stats accessibility */}
      <span id="ow-visible-count" className="visually-hidden" aria-hidden="true">
        {visible.length}
      </span>

      {/* ── Masonry grid ── */}
      <div className="ow-masonry" id="ow-gallery" role="list">
        {allCards.map((card, i) => {
          const isVisible = matches(card.category, filter)
          const isRevealed = revealed.has(i)

          return (
            <div
              key={i}
              ref={(el) => {
                cardRefs.current[i] = el
              }}
              data-index={i}
              className={[
                'gallery-card',
                card.type === 'video' ? 'gallery-card--reel' : '',
                isVisible ? '' : 'hidden',
                isRevealed ? 'revealed' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              data-category={card.category}
              data-category-label={card.categoryLabel}
              data-no-lightbox={card.type === 'video' ? '' : undefined}
              role="listitem"
              style={{
                '--reveal-delay': `${Math.min(
                  i * (revealMode === 'filtered' ? 0.04 : 0.05),
                  revealMode === 'filtered' ? 0.6 : 0.8
                )}s`,
              }}
              onClick={() => {
                if (card.href) {
                  router.push(card.href)
                  return
                }
                if (card.type === 'video') {
                  toggleReel(i)
                  return
                }
                const idx = imageList.findIndex(({ i: orig }) => orig === i)
                showImage(idx === -1 ? 0 : idx)
              }}
            >
              {card.type === 'video' ? (
                <div className="gallery-reel-wrap">
                  <video
                    ref={(el) => {
                      videoRefs.current[i] = el
                    }}
                    src={card.src}
                    poster={card.poster || undefined}
                    className="gallery-reel-video"
                    loop
                    muted
                    playsInline
                    preload="none"
                    title={card.title || undefined}
                    aria-label={card.ariaLabel || undefined}
                  />
                  <div className="reel-play-btn" aria-hidden="true">
                    <i className="fas fa-play" />
                  </div>
                </div>
              ) : (
                <>
                  <img
                    src={card.src}
                    alt={card.alt}
                    className="gallery-img"
                    loading="lazy"
                    decoding="async"
                  />
                  <div className="gallery-overlay" aria-hidden="true">
                    <span className="view-label">View Project</span>
                  </div>
                </>
              )}
              <span className="gallery-cat-badge">{card.badge}</span>
            </div>
          )
        })}
      </div>

      {/* Empty state (hidden by default) */}
      <div
        id="ow-empty-state"
        className={`ow-empty-state${visible.length === 0 ? ' visible' : ''}`}
        aria-live="polite"
      >
        <div className="ow-empty-icon">
          <i className="fas fa-search" />
        </div>
        <p>No projects found in this category.</p>
      </div>

      {/* ── Lightbox ── */}
      <div
        id="ow-lightbox"
        className={`ow-lightbox${lightbox.open ? ' open' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label="Image lightbox viewer"
        onTouchStart={(e) => {
          touchStartX.current = e.changedTouches[0].clientX
        }}
        onTouchEnd={(e) => {
          const delta = touchStartX.current - e.changedTouches[0].clientX
          if (Math.abs(delta) > 50) {
            showImage(delta > 0 ? lightbox.index + 1 : lightbox.index - 1)
          }
        }}
      >
        {/* Backdrop */}
        <div
          id="ow-lb-backdrop"
          className="ow-lb-backdrop"
          aria-hidden="true"
          onClick={closeLightbox}
        />

        {/* Category label */}
        <div id="ow-lb-label" className="ow-lb-label" aria-live="polite">
          {activeCard ? activeCard.card.categoryLabel : 'Creative'}
        </div>

        {/* Content */}
        <div className="ow-lb-content">
          <img
            id="ow-lb-img"
            className="ow-lb-img"
            src={activeCard ? activeCard.card.src : ''}
            alt="Portfolio project fullscreen view"
            draggable="false"
          />
        </div>

        {/* Close button */}
        <button
          type="button"
          id="ow-lb-close"
          className="ow-lb-close"
          aria-label="Close lightbox"
          onClick={closeLightbox}
        >
          <i className="fas fa-times" />
        </button>

        {/* Previous */}
        <button
          type="button"
          id="ow-lb-prev"
          className="ow-lb-prev"
          aria-label="Previous image"
          onClick={(e) => {
            e.stopPropagation()
            showImage(lightbox.index - 1)
          }}
        >
          <i className="fas fa-chevron-left" />
        </button>

        {/* Next */}
        <button
          type="button"
          id="ow-lb-next"
          className="ow-lb-next"
          aria-label="Next image"
          onClick={(e) => {
            e.stopPropagation()
            showImage(lightbox.index + 1)
          }}
        >
          <i className="fas fa-chevron-right" />
        </button>

        {/* Counter */}
        <div id="ow-lb-counter" className="ow-lb-counter" aria-live="polite">
          {lightbox.index + 1} / {imageList.length}
        </div>
      </div>
    </>
  )
}
