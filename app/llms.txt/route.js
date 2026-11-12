import { getPayloadClient } from '../../lib/payload'

export const revalidate = 3600

const SITE = process.env.NEXT_PUBLIC_SERVER_URL || 'https://stillloud.in'

/**
 * /llms.txt — a short, plain-text map of the site for LLM-based search and
 * answer engines (AEO/GEO). Follows the llms.txt convention: an H1 name, a
 * one-line summary, a blockquote of context, then linked sections.
 *
 * Regenerated hourly, and purged by content hooks when something changes.
 */
async function loadContent() {
  try {
    const payload = await getPayloadClient()
    const [posts, projects, pages] = await Promise.all([
      payload
        .find({
          collection: 'posts',
          where: { _status: { equals: 'published' } },
          sort: '-publishedAt',
          limit: 20,
          depth: 0,
          overrideAccess: false,
        })
        .catch(() => ({ docs: [] })),
      payload
        .find({
          collection: 'projects',
          where: { _status: { equals: 'published' } },
          sort: 'order',
          limit: 50,
          depth: 0,
          overrideAccess: false,
        })
        .catch(() => ({ docs: [] })),
      payload
        .find({
          collection: 'pages',
          where: { _status: { equals: 'published' } },
          limit: 50,
          depth: 0,
          overrideAccess: false,
        })
        .catch(() => ({ docs: [] })),
    ])
    return { posts: posts.docs, projects: projects.docs, pages: pages.docs }
  } catch {
    // Build-time or DB blip: ship the static part of the file.
    return { posts: [], projects: [], pages: [] }
  }
}

export async function GET() {
  const { posts, projects, pages } = await loadContent()

  const lines = [
    '# StillLoud',
    '',
    '> StillLoud is a branding and creative design studio in India helping small businesses grow through strategic brand identity, logo design, social media creatives, website design and UI/UX.',
    '',
    'StillLoud works with founder-led businesses that need to look established: resorts and',
    'hospitality brands, cafés and restaurants, real estate, D2C product brands and local',
    'service businesses. Engagements typically start with a brand identity or a social media',
    'design retainer and expand into a website.',
    '',
    '## Core pages',
    '',
    `- [Home](${SITE}/): services, process, pricing, client testimonials and contact details.`,
    `- [Our Work](${SITE}/our-work): portfolio of social media creatives, reels, logos, brand identities and printables.`,
    `- [Projects](${SITE}/projects): written case studies with the brief, approach and result for selected clients.`,
    `- [Blog](${SITE}/blog): practical notes on branding, design and growth for small businesses.`,
    ...(pages.length
      ? pages.map(
          (page) =>
            `- [${page.title}](${SITE}/${page.slug})${page.description ? `: ${page.description}` : ''}`
        )
      : []),
    '',
    '## Services',
    '',
    `- Brand strategy and identity — naming support, logo systems, colour and type, brand guidelines (${SITE}/#services)`,
    `- Social media design — monthly creative retainers, reels, campaign graphics (${SITE}/#services)`,
    `- Website design and build — marketing sites and landing pages (${SITE}/#services)`,
    `- UI/UX design — product and app interfaces (${SITE}/#services)`,
    `- Logo design — standalone marks and full identity systems (${SITE}/#services)`,
    '',
    '## Featured case study',
    '',
    `- Kubes by the Raasta — luxury resort in Jispa, Himachal Pradesh. Full branding plus social`,
    `  media management; Instagram drives ~90% of their bookings. (${SITE}/our-work)`,
    '',
    '## Contact',
    '',
    '- Email: team.stillloud@gmail.com',
    '- Phone / WhatsApp: +91 63511 39179',
    `- Instagram: https://instagram.com/wearestillloud`,
    `- LinkedIn: https://www.linkedin.com/company/stillloud/`,
    `- Pinterest: https://in.pinterest.com/wearestillloud/`,
    `- Book a 30-minute call: https://calendly.com/team-stillloud/30min`,
    '',
    '## Optional',
    '',
    ...(projects.length
      ? [
          '### Recent projects',
          '',
          ...projects.map(
            (project) =>
              `- [${project.title}](${SITE}/projects/${project.slug})${project.description ? `: ${project.description}` : ''}`
          ),
          '',
        ]
      : []),
    ...(posts.length
      ? [
          '### Recent articles',
          '',
          ...posts.map(
            (post) =>
              `- [${post.title}](${SITE}/blog/${post.slug})${post.excerpt ? `: ${post.excerpt}` : ''}`
          ),
        ]
      : ['No articles published yet.']),
    '',
  ]

  return new Response(lines.join('\n'), {
    headers: {
      'content-type': 'text/plain; charset=utf-8',
      'cache-control': 'public, max-age=3600, s-maxage=3600',
    },
  })
}
