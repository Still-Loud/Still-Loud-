const PLANS = [
  { img: '/assets/Packages/1.svg', alt: 'Starter Package', cls: 'card-starter' },
  { img: '/assets/Packages/2.svg', alt: 'Growth Pro Package', cls: 'card-growth active' },
  { img: '/assets/Packages/3.svg', alt: 'Authority Package', cls: 'card-authority' },
]

export default function Pricing() {
  return (
    <section id="pricing" className="pricing-section">
      <div className="section-container">
        <div className="pricing-header">
          <div className="eyebrow">
            <span className="bullet-dot"></span> Pricing Plans
          </div>
          <h2 className="pricing-title">
            Pick Your <span className="highlight-red">Growth Gear</span>
          </h2>
        </div>

        <div className="pricing-grid">
          {PLANS.map((plan) => (
            <a key={plan.cls} href="#contact" className={`pricing-card ${plan.cls}`}>
              <img src={plan.img} alt={plan.alt} className="pricing-svg" />
            </a>
          ))}
        </div>
      </div>
    </section>
  )
}
