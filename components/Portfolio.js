export default function Portfolio() {
  return (
    <section id="work" className="portfolio-section">
      <div className="section-container">
        <div className="portfolio-header">
          <div className="eyebrow">
            <span className="bullet-dot"></span> Explore Our Work
          </div>
          <p className="portfolio-subtitle">
            We handle everything: brand design, social media, campaigns, and content. One bold
            approach for every industry.
          </p>
        </div>

        {/* Portfolio Cards Row */}
        <div className="portfolio-carousel-wrapper">
          <div className="portfolio-grid" id="portfolio-grid">
            {/* Card 1 (Mobile branding) */}
            <div className="portfolio-card">
              <div className="portfolio-card-img">
                <img src="/assets/1.webp" alt="Mobile branding application mockups" width="1080" height="1350" loading="lazy" decoding="async" />
              </div>
            </div>

            {/* Card 2 (Brand Guidelines) */}
            <div className="portfolio-card">
              <div className="portfolio-card-img">
                <img src="/assets/3.webp" alt="Brand identity design guidelines mockup" width="1080" height="1350" loading="lazy" decoding="async" />
              </div>
            </div>
          </div>
        </div>

        <div className="portfolio-footer">
          <h3 className="portfolio-footer-title">
            What <span className="highlight-red">Bold Creative</span> Looks Like{' '}
            <span className="red-dot">🔴</span>
          </h3>
          <a href="/our-work" className="btn btn-explore-more">
            <i className="fa-solid fa-magnifying-glass" /> Explore More
          </a>
        </div>
      </div>
    </section>
  )
}
