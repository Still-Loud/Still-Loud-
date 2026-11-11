const SITE = process.env.NEXT_PUBLIC_SERVER_URL || 'https://stillloud.in'

/**
 * robots.txt
 *
 * The admin UI, Payload's REST/GraphQL endpoints and the catch-all 404 are
 * noise for crawlers. Everything else is fair game.
 */
export default function robots() {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin', '/api/', '/admin/'],
      },
      {
        // AI crawlers were previously blocked by default on some hosts; the
        // site is meant to be quotable (AEO/GEO), so list them explicitly.
        userAgent: [
          'GPTBot',
          'OAI-SearchBot',
          'ChatGPT-User',
          'PerplexityBot',
          'ClaudeBot',
          'Claude-Web',
          'Google-Extended',
          'Applebot-Extended',
        ],
        allow: '/',
        disallow: ['/admin', '/api/'],
      },
    ],
    sitemap: `${SITE}/sitemap.xml`,
    host: SITE.replace(/^https?:\/\//, ''),
  }
}
