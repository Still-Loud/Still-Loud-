import { ScheduleMeetingButton, GetInTouchButton } from './CtaButtons'

export default function About() {
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
                  <img src="/assets/handshakes.webp" alt="stillLoud Logo" className="nav-logo" width="760" height="1351" loading="lazy" decoding="async" />
                </a>
              </div>
              <div className="about-stat-card">
                <h3>20+</h3>
                <p>Happy Clients</p>
              </div>
            </div>

            {/* Column 2 (Right Staggered) */}
            <div className="visuals-col col-right">
              <div className="about-stat-card">
                <h3>100%</h3>
                <p>Retention Rate</p>
              </div>
              <div className="about-img-card">
                <img src="/assets/Brain.webp" alt="stillLoud Logo" className="nav-logo" width="760" height="1351" loading="lazy" decoding="async" />
              </div>
            </div>
          </div>

          {/* Right Side: Text & Features */}
          <div className="about-text-content">
            <div className="eyebrow">
              <span className="bullet-dot"></span> About StillLoud
            </div>
            <h2 className="about-title">
              Bold <span className="highlight-red">Creative</span> Built
              <br />
              For Real <span className="highlight-red">Growth</span>
            </h2>
            <p className="about-description">
              StillLoud is a modern creative branding studio focused on helping startups and small
              businesses build memorable brands and digital experiences. We design brands,
              campaigns, and digital experiences that drive engagement and measurable impact.
              Whether you&apos;re scaling a startup or elevating an established brand, we deliver
              results every single time.
            </p>

            <div className="about-features">
              <div className="about-feature-card">
                <div className="feature-icon-wrapper">
                  <i className="fa-solid fa-star-of-life" />
                </div>
                <h3>Strategy-First Creativity</h3>
                <p>Data-driven campaigns. Measurable results. No guesswork.</p>
              </div>
              <div className="about-feature-card">
                <div className="feature-icon-wrapper">
                  <i className="fa-solid fa-compass" />
                </div>
                <h3>Distinctive Design</h3>
                <p>Distinctive design that makes your brand unmistakable.</p>
              </div>
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
