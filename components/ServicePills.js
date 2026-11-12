'use client'

import { useState } from 'react'

/* Service pills — mirrors js/main.js §3 (first pill active, hover switches).
   The list comes from the HomePage global; the defaults match the original. */
const DEFAULT_SERVICES = [
  { key: 'brand-identity', icon: 'fa-solid fa-star-of-life', label: 'Brand Identity Design' },
  { key: 'ui-ux', icon: 'fa-solid fa-crosshairs', label: 'UI/UX Design' },
  { key: 'social-media', icon: 'fa-solid fa-plus', label: 'Social Media Design' },
  { key: 'website-design', icon: 'fa-solid fa-laptop-code', label: 'Website Design' },
  { key: 'marketing', icon: 'fa-solid fa-bullhorn', label: 'Marketing Creatives' },
  { key: 'digital-branding', icon: 'fa-solid fa-globe', label: 'Digital Branding' },
]

export default function ServicePills({ services }) {
  const list = services?.length
    ? services.map((service, index) => ({
        key: `service-${index}`,
        icon: service.icon || 'fa-solid fa-star-of-life',
        label: service.label,
      }))
    : DEFAULT_SERVICES

  const [active, setActive] = useState(list[0]?.key)

  return (
    <div className="services-pills">
      {list.map((service) => (
        <button
          key={service.key}
          type="button"
          className={`service-pill${active === service.key ? ' active' : ''}`}
          data-service={service.key}
          onMouseEnter={() => setActive(service.key)}
          onFocus={() => setActive(service.key)}
        >
          <i className={service.icon} /> {service.label}
        </button>
      ))}
    </div>
  )
}
