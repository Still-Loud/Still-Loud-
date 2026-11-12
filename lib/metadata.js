/**
 * Shared social/SEO metadata.
 *
 * Next.js does not deep-merge `openGraph` / `twitter` objects, so a page that
 * defines its own openGraph block loses anything set in the root layout. Every
 * page therefore builds its block through these helpers - that keeps og:url,
 * og:site_name, og:image and the large Twitter card consistent everywhere.
 */

export const SITE_URL =
  process.env.NEXT_PUBLIC_SERVER_URL || 'https://stillloud.in'

export const SITE_NAME = 'StillLoud'

export const LOCALE = 'en_IN'

/**
 * Static 1200x630 share card (scripts/generate-og-image.mjs).
 * Re-run `npm run generate:og` after changing the logo or brand colours.
 */
export const OG_IMAGE = {
  url: '/og/og-default.jpg',
  width: 1200,
  height: 630,
  alt: 'StillLoud - branding, website design and social media creatives',
}

export function buildOpenGraph({
  title,
  description,
  path,
  type = 'website',
  images = [OG_IMAGE],
  ...rest
}) {
  return {
    title,
    description,
    type,
    url: path,
    siteName: SITE_NAME,
    locale: LOCALE,
    images,
    ...rest,
  }
}

export function buildTwitter({ title, description, images = [OG_IMAGE.url] }) {
  return {
    card: 'summary_large_image',
    title,
    description,
    images,
  }
}
