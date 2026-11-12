/**
 * Slugs a custom page may not use, because they would shadow a real route or
 * a system endpoint.
 */
export const RESERVED_SLUGS = new Set([
  'admin',
  'api',
  'graphql',
  'graphql-playground',
  'blog',
  'projects',
  'our-work',
  'accept-invite',
  'sitemap.xml',
  'robots.txt',
  'llms.txt',
  'favicon.ico',
  'media',
  'assets',
  'search',
  'preview',
  'exit-preview',
  'next',
  '_next',
  'home',
  'index',
  'not-found',
  '404',
  '500',
])

export function reservedSlugMessage(slug) {
  if (!slug) return true
  const value = String(slug).trim().toLowerCase()
  if (RESERVED_SLUGS.has(value)) {
    return `“${value}” is reserved by the site. Choose a different slug (for example “${value}-services”).`
  }
  if (value.includes('/')) return 'The slug cannot contain slashes.'
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value)) {
    return 'Use lowercase letters, numbers and single hyphens only (e.g. about-us).'
  }
  return true
}
