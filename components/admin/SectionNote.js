'use client'

import React from 'react'

/**
 * Small helper panel shown at the top of the Homepage global.
 *
 * The homepage layout is fixed by design, so this explains what the toggles do
 * and reassures editors that they cannot break the visual identity.
 */
export function SectionNote() {
  return (
    <div
      style={{
        marginBottom: '24px',
        padding: '16px 18px',
        borderRadius: '12px',
        border: '1px solid var(--theme-elevation-150, #2f2f2f)',
        background: 'var(--theme-elevation-50, #1a1a1a)',
        fontSize: '13px',
        lineHeight: 1.6,
        opacity: 0.9,
      }}
    >
      <strong style={{ display: 'block', marginBottom: '6px' }}>How this page works</strong>
      The homepage keeps its existing design. Edit copy, upload images and switch sections on or
      off — the layout stays the same. Empty fields fall back to the built-in defaults, so you can
      only change what you need. Testimonials come from the{' '}
      <a href="/admin/collections/testimonials" style={{ textDecoration: 'underline' }}>
        Testimonials
      </a>{' '}
      collection, and portfolio cards come from{' '}
      <a href="/admin/collections/projects" style={{ textDecoration: 'underline' }}>
        Projects
      </a>
      .
    </div>
  )
}
