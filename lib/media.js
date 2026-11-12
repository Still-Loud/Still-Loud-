const SITE_URL = process.env.NEXT_PUBLIC_SERVER_URL || 'https://stillloud.in'

/**
 * Resolve a media document to a delivery URL.
 *
 * Payload's Cloudinary plugin rewrites `url` (and every size URL) through the
 * adapter's generateURL, so most values already point at res.cloudinary.com.
 * `cloudinaryUrl` is kept as a fallback for documents saved before the plugin
 * populated `url`, and relative local-disk paths still work in development.
 */
export function mediaUrl(media, size) {
  if (!media || typeof media !== 'object') return null
  const sized = size ? media.sizes?.[size] : null
  return sized?.url || media.cloudinaryUrl || media.url || null
}

/** Absolute version for meta tags, JSON-LD and sitemaps. */
export function absoluteMediaUrl(media, size) {
  const raw = mediaUrl(media, size)
  if (!raw) return null
  return /^https?:\/\//.test(raw) ? raw : `${SITE_URL}${raw}`
}

export function mediaAlt(media, fallback = '') {
  if (!media || typeof media !== 'object') return fallback
  return media.alt || fallback
}

export function isVideoMedia(media) {
  return Boolean(media && typeof media === 'object' && String(media.mimeType || '').startsWith('video/'))
}

/** Cloudinary can generate a poster frame for an uploaded video. */
export function mediaPosterUrl(media) {
  if (!media || typeof media !== 'object') return null
  const source = mediaUrl(media)
  if (!source) return null
  return source
    .replace('/video/upload/', '/video/upload/so_0,w_720,q_auto/')
    .replace(/\.[a-z0-9]+(\?.*)?$/i, '.jpg$1')
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

/** ISO date -> "2026-11" for compact UI labels. */
export function formatMonth(value) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return new Intl.DateTimeFormat('en-GB', {
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
