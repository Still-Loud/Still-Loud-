import ServicePills from './ServicePills'
import { GetInTouchButton, ScheduleMeetingButton } from './CtaButtons'
import { mediaAlt, mediaUrl } from '../lib/media'

const DEFAULT_BULLETS = ['Creativity', 'Excellence', 'Reliability']

export default function Services({ content }) {
  const title = content?.servicesTitle || {}
  const bullets = content?.servicesBullets?.length
    ? content.servicesBullets.map((bullet) => bullet.label)
    : DEFAULT_BULLETS
  const image = mediaUrl(content?.servicesImage, 'hero') || '/assets/5.webp'

  return (
    <section id="services" className="services-section">
      <div className="section-container">
        <div className="services-grid">
          {/* Left Side: Header & Services Pills */}
          <div className="services-left">
            <div className="eyebrow">
              <span className="bullet-dot"></span> {content?.servicesEyebrow || 'Our Services'}
            </div>
            <h2 className="services-title">
              {title.lineOne || 'Bold'}{' '}
              <span className="highlight-red">{title.lineOneAccent || 'Creative'}</span>
              <br />
              {title.lineTwo || 'Real'}{' '}
              <span className="highlight-red">{title.lineTwoAccent || 'Impact'}</span>
            </h2>

            <ServicePills services={content?.servicePills} />

            <div className="cta-btn-group">
              <GetInTouchButton />
              <ScheduleMeetingButton />
            </div>
          </div>

          {/* Center Column: Puzzle Graphic */}
          <div className="services-center">
            <div className="puzzle-card">
              <img
                src={image}
                alt={mediaAlt(content?.servicesImage, 'StillLoud services illustration')}
                width="1080"
                height="1920"
                loading="lazy"
                decoding="async"
              />
            </div>
          </div>

          {/* Right Column: Projects & Bullets */}
          <div className="services-right">
            <div className="projects-delivered-card">
              <h3>{content?.servicesDeliveredValue || '400+'}</h3>
              <p>{content?.servicesDeliveredLabel || 'Projects Delivered'}</p>
            </div>

            <div className="services-list-card">
              <div className="services-list-header">
                <button type="button" className="services-arrow-btn" aria-label="Explore work">
                  <i className="fa-solid fa-chevron-right" />
                </button>
              </div>
              <ul className="services-bullet-list">
                {bullets.map((bullet, index) => (
                  <li key={`${bullet}-${index}`}>
                    <span className="red-bullet">✦</span> {bullet}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
