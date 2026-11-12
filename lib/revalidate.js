/**
 * Purge cached pages after a content change.
 *
 * Payload writes can come from the Next.js server (admin UI, REST) or from CLI
 * scripts that run outside Next. `next/cache` is only importable inside the
 * server runtime, so the import is optional and the call is best-effort — a
 * failed purge just means the page updates on its next revalidate window.
 */
export async function revalidate(paths = []) {
  const targets = paths.filter(Boolean)
  if (targets.length === 0) return

  try {
    const { revalidatePath } = await import('next/cache')
    for (const path of targets) {
      revalidatePath(path)
    }
  } catch {
    /* Not running inside Next.js — nothing to purge. */
  }
}

/** Everything affected by a blog post change. */
export function blogPaths(slug, previousSlug) {
  return [
    '/blog',
    slug ? `/blog/${slug}` : null,
    previousSlug && previousSlug !== slug ? `/blog/${previousSlug}` : null,
    '/blog/rss.xml',
    '/llms.txt',
    '/sitemap.xml',
  ]
}

/** Everything affected by a category change. */
export function categoryPaths(slug, previousSlug) {
  return [
    '/blog',
    slug ? `/blog/category/${slug}` : null,
    previousSlug && previousSlug !== slug ? `/blog/category/${previousSlug}` : null,
    '/blog/rss.xml',
    '/sitemap.xml',
  ]
}

/** Everything affected by a project change. */
export function projectPaths(slug, previousSlug) {
  return [
    '/',
    '/our-work',
    '/projects',
    slug ? `/projects/${slug}` : null,
    previousSlug && previousSlug !== slug ? `/projects/${previousSlug}` : null,
    '/sitemap.xml',
  ]
}

/** Testimonials appear on the homepage only. */
export const testimonialPaths = ['/', '/sitemap.xml']

/** Custom pages and the sitemap. */
export function pagePaths(slug, previousSlug) {
  return [
    slug ? `/${slug}` : null,
    previousSlug && previousSlug !== slug ? `/${previousSlug}` : null,
    '/sitemap.xml',
  ]
}
