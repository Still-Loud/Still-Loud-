import '../../../styles/blog.css'

import BackToTop from '../../../components/BackToTop'
import Footer from '../../../components/Footer'
import Navbar from '../../../components/Navbar'
import BlogArchive from '../../../components/blog/BlogArchive'
import TawkTo from '../../../components/TawkTo'
import { getPayloadClient } from '../../../lib/payload'
import { buildOpenGraph, buildTwitter } from '../../../lib/metadata'

const TITLE = 'Blog | StillLoud — Branding, Design & Growth Notes'
const DESCRIPTION =
  'Practical notes on branding, logo design, social media and websites for small businesses — from the StillLoud studio.'
const OG_TITLE = 'Blog | StillLoud'
const OG_DESCRIPTION =
  'Practical notes on branding, design and growth for small businesses — from the StillLoud studio.'

export const metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: {
    canonical: '/blog',
    types: {
      'application/rss+xml': '/blog/rss.xml',
    },
  },
  openGraph: buildOpenGraph({
    title: OG_TITLE,
    description: OG_DESCRIPTION,
    path: '/blog',
  }),
  twitter: buildTwitter({ title: OG_TITLE, description: OG_DESCRIPTION }),
}

export const revalidate = 300

const PAGE_SIZE = 9

export default async function BlogIndexPage({ searchParams }) {
  const params = (await searchParams) || {}
  const query = typeof params.q === 'string' ? params.q.trim() : ''
  const legacyCategory = typeof params.category === 'string' ? params.category : null
  const page = Math.max(1, Number.parseInt(String(params.page || '1'), 10) || 1)

  const payload = await getPayloadClient()

  const { docs: categories } = await payload.find({
    collection: 'categories',
    limit: 100,
    sort: 'title',
    depth: 0,
    overrideAccess: false,
  })

  const activeCategory = legacyCategory
    ? categories.find((category) => category.slug === legacyCategory) || null
    : null

  const where = {
    _status: { equals: 'published' },
    ...(activeCategory ? { categories: { in: [activeCategory.id] } } : {}),
    ...(query
      ? {
          or: [
            { title: { contains: query } },
            { excerpt: { contains: query } },
            { 'tags.tag': { contains: query } },
          ],
        }
      : {}),
  }

  const result = await payload.find({
    collection: 'posts',
    where,
    sort: '-publishedAt',
    limit: PAGE_SIZE,
    page,
    depth: 1,
    overrideAccess: false,
  })

  const blogSchema = {
    '@context': 'https://schema.org',
    '@type': 'Blog',
    name: 'StillLoud Blog',
    url: 'https://stillloud.in/blog',
    publisher: { '@type': 'Organization', name: 'StillLoud' },
    blogPost: result.docs.slice(0, 10).map((post) => ({
      '@type': 'BlogPosting',
      headline: post.title,
      url: `https://stillloud.in/blog/${post.slug}`,
      datePublished: post.publishedAt,
    })),
  }

  return (
    <div className="blog-page">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(blogSchema) }}
      />

      <BackToTop />
      <Navbar variant="blog" />

      <section className="blog-hero">
        <div className="blog-hero-inner">
          <div className="blog-eyebrow">
            <span className="bullet-dot" aria-hidden="true" />
            The StillLoud Journal
          </div>
          <h1 className="blog-title">
            Notes on <span className="highlight-red">brand</span>, design &amp; growth
          </h1>
          <p className="blog-subtitle">
            Straight-talking lessons from the studio — what makes a brand memorable, how design
            drives bookings, and where small businesses should spend their creative budget.
          </p>
        </div>
      </section>

      <BlogArchive
        posts={result.docs}
        categories={categories}
        activeCategory={activeCategory}
        query={query}
        page={result.page || page}
        totalPages={result.totalPages || 1}
        basePath="/blog"
      />

      <section className="blog-cta" aria-labelledby="blog-cta-title">
        <h2 id="blog-cta-title">
          Want this thinking applied to <span className="highlight-red">your brand?</span>
        </h2>
        <p>Book a free 30-minute strategy call. No pitch deck, just straight answers.</p>
        <div className="blog-cta-actions">
          <a
            href="https://calendly.com/team-stillloud/30min?month=2026-08"
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-pill-red"
          >
            <i className="fas fa-calendar-alt" /> Schedule a Meeting
          </a>
          <a href="/#contact" className="btn btn-schedule">
            <i className="fa-solid fa-circle-phone" /> Get in Touch
          </a>
        </div>
      </section>

      <Footer variant="work" />
      <TawkTo />
    </div>
  )
}
