import '../../../styles/blog.css'

import BackToTop from '../../../components/BackToTop'
import Footer from '../../../components/Footer'
import Navbar from '../../../components/Navbar'
import PostCard from '../../../components/blog/PostCard'
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

export const revalidate = 60

export default async function BlogIndexPage({ searchParams }) {
  const params = (await searchParams) || {}
  const activeCategory = typeof params.category === 'string' ? params.category : null

  const payload = await getPayloadClient()

  const [{ docs: categories }, { docs: allPosts }] = await Promise.all([
    payload.find({
      collection: 'categories',
      limit: 50,
      sort: 'title',
      depth: 0,
    }),
    payload.find({
      collection: 'posts',
      where: { _status: { equals: 'published' } },
      sort: '-publishedAt',
      limit: 30,
      depth: 1,
      overrideAccess: false,
    }),
  ])

  const activeCategoryDoc = activeCategory
    ? categories.find((category) => category.slug === activeCategory)
    : null

  /* Filter in memory: the list is already capped at 30 posts and the category
     relationship comes back populated at depth 1. */
  const posts = activeCategoryDoc
    ? allPosts.filter((post) =>
        (post.categories || []).some((category) => category?.id === activeCategoryDoc.id)
      )
    : allPosts

  const blogSchema = {
    '@context': 'https://schema.org',
    '@type': 'Blog',
    name: 'StillLoud Blog',
    url: 'https://stillloud.in/blog',
    publisher: { '@type': 'Organization', name: 'StillLoud' },
    blogPost: posts.slice(0, 10).map((post) => ({
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

      <section className="blog-section" aria-label="Articles">
        <div className="blog-container">
          {categories.length > 0 && (
            <nav className="blog-filters" aria-label="Filter articles by category">
              <a href="/blog" className={`blog-filter${!activeCategory ? ' active' : ''}`}>
                All
              </a>
              {categories.map((category) => (
                <a
                  key={category.id}
                  href={`/blog?category=${encodeURIComponent(category.slug)}`}
                  className={`blog-filter${
                    activeCategory === category.slug ? ' active' : ''
                  }`}
                >
                  {category.title}
                </a>
              ))}
            </nav>
          )}

          {posts.length > 0 ? (
            <div className="blog-grid">
              {posts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          ) : (
            <div className="blog-empty">
              <div className="blog-empty-icon" aria-hidden="true">
                <i className="fas fa-pen-nib" />
              </div>
              <h2>{activeCategoryDoc ? 'Nothing here yet' : 'The first article is on its way'}</h2>
              <p>
                {activeCategoryDoc
                  ? `No articles in “${activeCategoryDoc.title}” yet. Check back soon, or browse every article.`
                  : 'We are writing up the studio playbook — branding, social media and websites that actually move the needle. Check back shortly.'}
              </p>
              {activeCategoryDoc ? (
                <a href="/blog" className="btn btn-pill-red">
                  All Articles <i className="fas fa-arrow-right" />
                </a>
              ) : (
                <a href="/our-work" className="btn btn-pill-red">
                  See Our Work <i className="fas fa-arrow-right" />
                </a>
              )}
            </div>
          )}
        </div>
      </section>

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
