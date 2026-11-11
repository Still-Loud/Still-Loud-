export default function WorkHero() {
  return (
    <section className="ow-hero" aria-labelledby="ow-hero-title">
      <div className="grid-overlay" aria-hidden="true" />
      <div className="ow-hero-inner">
        <div className="ow-eyebrow" aria-label="Portfolio section">
          <span className="bullet-dot" aria-hidden="true" />
          Explore Our Portfolio
        </div>

        <h1 id="ow-hero-title" className="ow-hero-title">
          Our <span className="ow-title-accent">Work</span>
        </h1>

        <p className="ow-hero-tagline">
          Designs that help brands stand out bold, strategic, and built to last.
        </p>

        <div className="ow-hero-tags" role="list" aria-label="Work categories">
          <span className="ow-tag" role="listitem">
            Creative
          </span>
          <span className="ow-tag-sep" aria-hidden="true">
            •
          </span>
          <span className="ow-tag" role="listitem">
            Branding
          </span>
          <span className="ow-tag-sep" aria-hidden="true">
            •
          </span>
          <span className="ow-tag" role="listitem">
            Logos
          </span>
          <span className="ow-tag-sep" aria-hidden="true">
            •
          </span>
          <span className="ow-tag" role="listitem">
            Printables
          </span>
        </div>
      </div>
    </section>
  )
}
