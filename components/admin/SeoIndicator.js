'use client'

import React from 'react'
import { useFormFields } from '@payloadcms/ui'

/**
 * Compact SEO checklist inside the SEO tab.
 *
 * Reads the form values live, so the editor sees what is still missing without
 * saving. Nothing here is a ranking promise — it only shows whether the fields
 * that generate the <head> tags are filled in.
 */
export function SeoIndicator() {
  const seo = useFormFields(([fields]) => ({
    title: fields?.['seo.metaTitle']?.value,
    description: fields?.['seo.metaDescription']?.value,
    canonical: fields?.['seo.canonical']?.value,
    image: fields?.['seo.ogImage']?.value,
    noIndex: fields?.['seo.noIndex']?.value,
  }))

  const checks = [
    { label: 'SEO title', done: Boolean(seo.title), hint: '50–60 characters' },
    { label: 'Meta description', done: Boolean(seo.description), hint: '150–155 characters' },
    { label: 'Social share image', done: Boolean(seo.image), hint: '1200×630' },
  ]

  const done = checks.filter((check) => check.done).length

  return (
    <div
      style={{
        margin: '4px 0 20px',
        padding: '14px 16px',
        borderRadius: 10,
        border: '1px solid var(--theme-elevation-150, #3a3a3a)',
        background: 'var(--theme-elevation-50, #1a1a1a)',
        fontSize: 13,
        lineHeight: 1.6,
      }}
    >
      <strong style={{ display: 'block', marginBottom: 8 }}>
        SEO completeness — {done}/{checks.length}
      </strong>
      <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
        {checks.map((check) => (
          <li key={check.label} style={{ display: 'flex', gap: 8, alignItems: 'baseline' }}>
            <span aria-hidden="true" style={{ color: check.done ? '#22c55e' : '#eab308' }}>
              {check.done ? '✓' : '○'}
            </span>
            <span style={{ opacity: check.done ? 1 : 0.75 }}>
              {check.label}
              <span style={{ opacity: 0.55 }}> — {check.hint}</span>
            </span>
          </li>
        ))}
      </ul>
      <p style={{ margin: '10px 0 0', opacity: 0.65 }}>
        Empty fields fall back to the page title, description and default share image. Titles and
        descriptions help people decide to click; they do not guarantee rankings.
        {seo.noIndex ? ' This page is currently hidden from search engines.' : ''}
      </p>
    </div>
  )
}
