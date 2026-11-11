export const revalidate = 3600

const SITE = process.env.NEXT_PUBLIC_SERVER_URL || 'https://stillloud.in'

/** Escape text for XML text nodes and attributes. */
function xml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

/**
 * /blog/rss.xml — used by feed readers and by a few aggregators that still
 * pick up RSS. The Posts hooks purge this path on publish/unpublish.
 */
export async function GET() {
  let posts = []

  try {
    const { getPayloadClient } = await import('../../../../lib/payload')
    const payload = await getPayloadClient()
    const result = await payload.find({
      collection: 'posts',
      where: { _status: { equals: 'published' } },
      sort: '-publishedAt',
      limit: 50,
      depth: 0,
      overrideAccess: false,
    })
    posts = result.docs
  } catch {
    // Build-time or DB blip — serve an empty but valid feed.
  }

  const items = posts
    .map((post) => {
      const link = `${SITE}/blog/${post.slug}`
      const date = post.publishedAt || post.createdAt
      return [
        '    <item>',
        `      <title>${xml(post.title)}</title>`,
        `      <link>${xml(link)}</link>`,
        `      <guid isPermaLink="true">${xml(link)}</guid>`,
        `      <pubDate>${new Date(date).toUTCString()}</pubDate>`,
        `      <description>${xml(post.excerpt)}</description>`,
        ...(post.categories || [])
          .filter(Boolean)
          .map((category) => `      <category>${xml(category.title)}</category>`),
        '    </item>',
      ].join('\n')
    })
    .join('\n')

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>StillLoud — Branding, Design &amp; Growth Notes</title>
    <link>${SITE}/blog</link>
    <description>Practical notes on branding, logo design, social media and websites for small businesses — from the StillLoud studio.</description>
    <language>en-in</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${SITE}/blog/rss.xml" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>
`

  return new Response(body, {
    headers: {
      'content-type': 'application/rss+xml; charset=utf-8',
      'cache-control': 'public, max-age=3600, s-maxage=3600',
    },
  })
}
