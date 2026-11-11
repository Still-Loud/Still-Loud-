import HeroGraphic from './HeroGraphic'

export default function Hero() {
  return (
    <section id="home" className="hero-section">
      <div className="hero-grid">
        {/* Left Side: Hero Copy */}
        <div className="hero-left">
          <a href="https://wa.me/8866119607" target="_blank" rel="noreferrer" className="join-us-btn">
            <i className="fa-regular fa-handshake" /> JOIN US
          </a>
          <h1 className="hero-headline">
            <span className="highlight-red">DISTINCTIVE</span>
            <span className="highlight-dark">DESIGN</span>
            <span className="highlight-red">MEASURABLE</span>
            <span className="highlight-dark">IMPACT</span>
          </h1>
          <div className="hero-actions-pill">
            <a href="/our-work" className="btn-portfolio-pill">
              Portfolio
            </a>
            <a href="#contact" className="btn-contact-pill">
              Contact
            </a>
          </div>
        </div>

        {/* Right Side: Graphic with Grid Background */}
        <div className="hero-right">
          <div className="hero-graphic-container">
            <div className="grid-overlay"></div>
            <HeroGraphic />
          </div>
        </div>
      </div>
    </section>
  )
}
