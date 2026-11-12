import ServicePills from './ServicePills'
import { GetInTouchButton, ScheduleMeetingButton } from './CtaButtons'

export default function Services() {
  return (
    <section id="services" className="services-section">
      <div className="section-container">
        <div className="services-grid">
          {/* Left Side: Header & Services Pills */}
          <div className="services-left">
            <div className="eyebrow">
              <span className="bullet-dot"></span> Our Services
            </div>
            <h2 className="services-title">
              Bold <span className="highlight-red">Creative</span>
              <br />
              Real <span className="highlight-red">Impact</span>
            </h2>

            <ServicePills />

            <div className="cta-btn-group">
              <GetInTouchButton />
              <ScheduleMeetingButton />
            </div>
          </div>

          {/* Center Column: Puzzle Graphic */}
          <div className="services-center">
            <div className="puzzle-card">
              <img src="/assets/5.webp" alt="StillLoud services puzzle integration illustration" width="1080" height="1920" loading="lazy" decoding="async" />
            </div>
          </div>

          {/* Right Column: Projects & Bullets */}
          <div className="services-right">
            <div className="projects-delivered-card">
              <h3>400+</h3>
              <p>Projects Delivered</p>
            </div>

            <div className="services-list-card">
              <div className="services-list-header">
                <button type="button" className="services-arrow-btn" aria-label="Explore work">
                  <i className="fa-solid fa-chevron-right" />
                </button>
              </div>
              <ul className="services-bullet-list">
                <li>
                  <span className="red-bullet">✦</span> Creativity
                </li>
                <li>
                  <span className="red-bullet">✦</span> Excellence
                </li>
                <li>
                  <span className="red-bullet">✦</span> Reliability
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
