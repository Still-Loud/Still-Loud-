export default function WorkCta() {
  return (
    <section className="ow-cta-section" aria-labelledby="ow-cta-title">
      <div className="ow-cta-inner">
        <h2 id="ow-cta-title" className="ow-cta-title">
          Love what you see?
          <br />
          <span style={{ color: 'var(--color-secondary)' }}>Let&apos;s build your brand.</span>
        </h2>
        <p className="ow-cta-sub">
          From logos to full brand identities we&apos;ve got you covered.
        </p>
        <div className="ow-cta-btn-group">
          <a
            href="https://wa.me/8866119607"
            target="_blank"
            rel="noopener noreferrer"
            className="ow-cta-btn"
          >
            <i className="fa-solid fa-circle-phone" />
            Let&apos;s Talk
          </a>
          <a
            href="https://calendly.com/team-stillloud/30min?month=2026-08"
            target="_blank"
            rel="noopener noreferrer"
            className="ow-cta-btn ow-cta-btn--outline"
          >
            <i className="fas fa-calendar-alt" />
            Schedule a Meeting
          </a>
        </div>
      </div>
    </section>
  )
}
