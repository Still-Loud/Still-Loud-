const SITE_URL = process.env.NEXT_PUBLIC_SERVER_URL || 'https://stillloud.in'

/**
 * Media URLs come back relative from Payload's local storage adapter, and
 * absolute from Vercel Blob. Resolve both, optionally picking an image size.
 * Returned as-is — use absoluteMediaUrl() for OG/schema tags.
 */
export function mediaUrl(media, size) {
  if (!media || typeof media !== 'object') return null
  const sized = size ? media.sizes?.[size] : null
  return sized?.url || media.url || null
}

/** Absolute version for meta tags, JSON-LD and sitemaps. */
export function absoluteMediaUrl(media, size) {
  const raw = mediaUrl(media, size)
  if (!raw) return null
  return /^https?:\/\//.test(raw) ? raw : `${SITE_URL}${raw}`
}

/** ISO date -> "12 Nov 2026" using a fixed locale/timezone (SSR-safe). */
export function formatDate(value) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'Asia/Kolkata',
  }).format(date)
}

/** Rough reading time from a Lexical document. */
export function readingTime(content) {
  if (!content) return null
  const text = JSON.stringify(content)
  const words = text.split(/\s+/).filter(Boolean).length
  return Math.max(1, Math.round(words / 200))
}
