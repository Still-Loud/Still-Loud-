/**
 * Purge cached pages after a content change.
 *
 * Payload writes can come from the Next.js server (admin UI, REST) or from CLI
 * scripts (scripts/seed-demo.js) that run outside Next. `next/cache` is only
 * importable inside the server runtime, so the import is optional and the call
 * is best-effort — a failed purge just means the page updates on its next
 * revalidate window instead.
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

/** Paths affected by any blog post change. */
export function blogPaths(slug, previousSlug) {
  return [
    '/blog',
    slug ? `/blog/${slug}` : null,
    previousSlug && previousSlug !== slug ? `/blog/${previousSlug}` : null,
    '/blog/rss.xml',
    '/sitemap.xml',
  ]
}
