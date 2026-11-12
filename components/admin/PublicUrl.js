'use client'

import React from 'react'
import { useFormFields } from '@payloadcms/ui'

/**
 * Shows the public URL for the document being edited, plus a draft badge.
 * `collection` is injected through clientProps in the collection config.
 */
export function PublicUrl({ collection }) {
  const slug = useFormFields(([fields]) => fields?.slug?.value)
  const status = useFormFields(([fields]) => fields?._status?.value)

  const path =
    collection === 'posts'
      ? slug
        ? `/blog/${slug}`
        : null
      : collection === 'projects'
        ? slug
          ? `/projects/${slug}`
          : null
        : slug
          ? `/${slug}`
          : null

  const origin = typeof window !== 'undefined' ? window.location.origin : ''
  const url = path ? `${origin}${path}` : null
  const isDraft = status === 'draft'

  return (
    <div
      style={{
        marginBottom: 16,
        padding: '12px 14px',
        borderRadius: 8,
        border: '1px solid var(--theme-elevation-150, #3a3a3a)',
        background: 'var(--theme-elevation-50, #1a1a1a)',
        fontSize: 13,
        lineHeight: 1.5,
      }}
    >
      <strong style={{ display: 'block', marginBottom: 4 }}>Public URL</strong>
      {url ? (
        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          style={{ color: '#a78bfa', textDecoration: 'underline', wordBreak: 'break-all' }}
        >
          {path}
        </a>
      ) : (
        <span style={{ opacity: 0.65 }}>Add a slug to generate the URL.</span>
      )}
      {isDraft && (
        <span
          style={{
            display: 'inline-block',
            marginTop: 8,
            padding: '2px 8px',
            borderRadius: 999,
            background: 'rgba(234, 179, 8, 0.18)',
            border: '1px solid rgba(234, 179, 8, 0.5)',
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
          }}
        >
          Draft — not public
        </span>
      )}
    </div>
  )
}
