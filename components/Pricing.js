import { mediaAlt, mediaUrl } from '../lib/media'

const DEFAULT_PLANS = [
  { img: '/assets/Packages/1.webp', alt: 'Starter Package', cls: 'card-starter' },
  { img: '/assets/Packages/2.webp', alt: 'Growth Pro Package', cls: 'card-growth active' },
  { img: '/assets/Packages/3.webp', alt: 'Authority Package', cls: 'card-authority' },
]

const CLASSES = ['card-starter', 'card-growth active', 'card-authority']

export default function Pricing({ content }) {
  const configured = (content?.pricingPlans || [])
    .map((plan, index) => {
      const img = mediaUrl(plan.image, 'card')
      return img
        ? {
            img,
            alt: plan.alt || mediaAlt(plan.image, `Pricing plan ${index + 1}`),
            cls: plan.featured ? 'card-growth active' : CLASSES[index] || 'card-starter',
          }
        : null
    })
    .filter(Boolean)

  const plans = configured.length ? configured : DEFAULT_PLANS
  const title = content?.pricingTitle || {}

  return (
    <section id="pricing" className="pricing-section">
      <div className="section-container">
        <div className="pricing-header">
          <div className="eyebrow">
            <span className="bullet-dot"></span> {content?.pricingEyebrow || 'Pricing Plans'}
          </div>
          <h2 className="pricing-title">
            {title.lineOne || 'Pick Your'}{' '}
            <span className="highlight-red">{title.lineOneAccent || 'Growth Gear'}</span>
          </h2>
        </div>

        <div className="pricing-grid">
          {plans.map((plan, index) => (
            <a
              key={`${plan.cls}-${index}`}
              href="#contact"
              className={`pricing-card ${plan.cls}`}
            >
              <img
                src={plan.img}
                alt={plan.alt}
                className="pricing-svg"
                width="700"
                height="1244"
                loading="lazy"
                decoding="async"
              />
            </a>
          ))}
        </div>
      </div>
    </section>
  )
}
