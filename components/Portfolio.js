import Link from 'next/link'

import { mediaAlt, mediaUrl } from '../lib/media'

const DEFAULT_CARDS = [
  { src: '/assets/1.webp', alt: 'Mobile branding application mockups' },
  { src: '/assets/3.webp', alt: 'Brand identity design guidelines mockup' },
]

/* Home-page portfolio teaser.
   Prefers the two cards configured in the HomePage global, then the newest
   featured projects, then the original artwork. */
export default function Portfolio({ content, projects = [] }) {
  const configured = (content?.portfolioCards || [])
    .map((card, index) => {
      const src = mediaUrl(card.image, 'card')
      return src
        ? {
            src,
            alt: card.alt || mediaAlt(card.image, `StillLoud project ${index + 1}`),
            href: null,
          }
        : null
    })
    .filter(Boolean)

  const featured = projects
    .map((project) => {
      const src = mediaUrl(project.image, 'card') || project.poster?.url
      return src
        ? {
            src,
            alt: project.alt || project.title,
            href: `/projects/${project.slug}`,
          }
        : null
    })
    .filter(Boolean)

  const cards = configured.length ? configured : featured.length ? featured : DEFAULT_CARDS

  return (
    <section id="work" className="portfolio-section">
      <div className="section-container">
        <div className="portfolio-header">
          <div className="eyebrow">
            <span className="bullet-dot"></span> {content?.portfolioEyebrow || 'Explore Our Work'}
          </div>
          <p className="portfolio-subtitle">
            {content?.portfolioSubtitle ||
              'We handle everything: brand design, social media, campaigns, and content. One bold approach for every industry.'}
          </p>
        </div>

        {/* Portfolio Cards Row */}
        <div className="portfolio-carousel-wrapper">
          <div className="portfolio-grid" id="portfolio-grid">
            {cards.slice(0, 2).map((card, index) => {
              const inner = (
                <div className="portfolio-card-img">
                  <img
                    src={card.src}
                    alt={card.alt}
                    width="1080"
                    height="1350"
                    loading="lazy"
                    decoding="async"
                  />
                </div>
              )

              return (
                <div className="portfolio-card" key={`${card.src}-${index}`}>
                  {card.href ? (
                    <Link href={card.href} aria-label={card.alt} style={{ display: 'block' }}>
                      {inner}
                    </Link>
                  ) : (
                    inner
                  )}
                </div>
              )
            })}
          </div>
        </div>

        <div className="portfolio-footer">
          <h3 className="portfolio-footer-title">
            {content?.portfolioFooterTitle ? (
              content.portfolioFooterTitle
            ) : (
              <>
                What <span className="highlight-red">Bold Creative</span> Looks Like{' '}
                <span className="red-dot">↗</span>
              </>
            )}
          </h3>
          <a href="/our-work" className="btn btn-explore-more">
            <i className="fa-solid fa-magnifying-glass" /> Explore More
          </a>
        </div>
      </div>
    </section>
  )
}
