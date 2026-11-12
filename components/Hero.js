import HeroGraphic from './HeroGraphic'
import { mediaAlt, mediaUrl } from '../lib/media'

const DEFAULT_HEADLINE = [
  { text: 'DISTINCTIVE', accent: true },
  { text: 'DESIGN', accent: false },
  { text: 'MEASURABLE', accent: true },
  { text: 'IMPACT', accent: false },
]

/* Hero copy comes from the HomePage global. Every value falls back to the
   original design copy, so an empty field never breaks the layout. */
export default function Hero({ content }) {
  const headline = content?.heroHeadline?.length ? content.heroHeadline : DEFAULT_HEADLINE
  const image = mediaUrl(content?.heroImage, 'hero')

  return (
    <section id="home" className="hero-section">
      <div className="hero-grid">
        {/* Left Side: Hero Copy */}
        <div className="hero-left">
          <a
            href={content?.heroEyebrowUrl || 'https://wa.me/8866119607'}
            target="_blank"
            rel="noreferrer"
            className="join-us-btn"
          >
            <i className="fa-regular fa-handshake" /> {content?.heroEyebrow || 'JOIN US'}
          </a>
          <h1 className="hero-headline">
            {headline.map((word, index) => (
              <span
                key={`${word.text}-${index}`}
                className={word.accent ? 'highlight-red' : 'highlight-dark'}
              >
                {word.text}
              </span>
            ))}
          </h1>
          <div className="hero-actions-pill">
            <a href={content?.heroPrimaryHref || '/our-work'} className="btn-portfolio-pill">
              {content?.heroPrimaryLabel || 'Portfolio'}
            </a>
            <a href={content?.heroSecondaryHref || '#contact'} className="btn-contact-pill">
              {content?.heroSecondaryLabel || 'Contact'}
            </a>
          </div>
        </div>

        {/* Right Side: Graphic with Grid Background */}
        <div className="hero-right">
          <div className="hero-graphic-container">
            <div className="grid-overlay"></div>
            {image ? (
              <img
                src={image}
                alt={mediaAlt(content?.heroImage, 'StillLoud creative work')}
                style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '18px' }}
                decoding="async"
              />
            ) : (
              <HeroGraphic />
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
