import { ScheduleMeetingButton, GetInTouchButton } from './CtaButtons'
import { mediaAlt, mediaUrl } from '../lib/media'

const DEFAULT_STATS = [
  { value: '20+', label: 'Happy Clients' },
  { value: '100%', label: 'Retention Rate' },
]

const DEFAULT_FEATURES = [
  {
    icon: 'fa-solid fa-star-of-life',
    title: 'Strategy-First Creativity',
    text: 'Data-driven campaigns. Measurable results. No guesswork.',
  },
  {
    icon: 'fa-solid fa-compass',
    title: 'Distinctive Design',
    text: 'Distinctive design that makes your brand unmistakable.',
  },
]

export default function About({ content }) {
  const stats = content?.aboutStats?.length ? content.aboutStats : DEFAULT_STATS
  const features = content?.aboutFeatures?.length ? content.aboutFeatures : DEFAULT_FEATURES
  const title = content?.aboutTitle || {}

  const imageOne = mediaUrl(content?.aboutImageOne, 'card') || '/assets/handshakes.webp'
  const imageTwo = mediaUrl(content?.aboutImageTwo, 'card') || '/assets/Brain.webp'

  return (
    <section id="about" className="about-section">
      <div className="section-container">
        <div className="about-grid">
          {/* Left Side: Staggered Cards Grid */}
          <div className="about-visuals">
            {/* Column 1 (Left Staggered) */}
            <div className="visuals-col col-left">
              <div className="about-img-card">
                <a href="#home" className="nav-logo-link">
                  <img
                    src={imageOne}
                    alt={mediaAlt(content?.aboutImageOne, 'StillLoud team at work')}
                    className="nav-logo"
                    width="760"
                    height="1351"
                    loading="lazy"
                    decoding="async"
                  />
                </a>
              </div>
              <div className="about-stat-card">
                <h3>{stats[0]?.value}</h3>
                <p>{stats[0]?.label}</p>
              </div>
            </div>

            {/* Column 2 (Right Staggered) */}
            <div className="visuals-col col-right">
              <div className="about-stat-card">
                <h3>{stats[1]?.value}</h3>
                <p>{stats[1]?.label}</p>
              </div>
              <div className="about-img-card">
                <img
                  src={imageTwo}
                  alt={mediaAlt(content?.aboutImageTwo, 'Creative strategy planning')}
                  className="nav-logo"
                  width="760"
                  height="1351"
                  loading="lazy"
                  decoding="async"
                />
              </div>
            </div>
          </div>

          {/* Right Side: Text & Features */}
          <div className="about-text-content">
            <div className="eyebrow">
              <span className="bullet-dot"></span> {content?.aboutEyebrow || 'About StillLoud'}
            </div>
            <h2 className="about-title">
              {title.lineOne || 'Bold'}{' '}
              <span className="highlight-red">{title.lineOneAccent || 'Creative Built'}</span>
              <br />
              {title.lineTwo || 'For Real'}{' '}
              <span className="highlight-red">{title.lineTwoAccent || 'Growth'}</span>
            </h2>
            <p className="about-description">
              {content?.aboutDescription ||
                "StillLoud is a modern creative branding studio focused on helping startups and small businesses build memorable brands and digital experiences. We design brands, campaigns, and digital experiences that drive engagement and measurable impact. Whether you're scaling a startup or elevating an established brand, we deliver results every single time."}
            </p>

            <div className="about-features">
              {features.map((feature, index) => (
                <div className="about-feature-card" key={`${feature.title}-${index}`}>
                  <div className="feature-icon-wrapper">
                    <i className={feature.icon || 'fa-solid fa-star-of-life'} />
                  </div>
                  <h3>{feature.title}</h3>
                  <p>{feature.text}</p>
                </div>
              ))}
            </div>

            <div className="cta-btn-group">
              <GetInTouchButton />
              <ScheduleMeetingButton />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
