import { notFound } from 'next/navigation'
import { cache } from 'react'

import '../../../../../styles/blog.css'

import BackToTop from '../../../../../components/BackToTop'
import Footer from '../../../../../components/Footer'
import Navbar from '../../../../../components/Navbar'
import BlogArchive from '../../../../../components/blog/BlogArchive'
import TawkTo from '../../../../../components/TawkTo'
import { getPayloadClient } from '../../../../../lib/payload'
import { absoluteUrl, breadcrumbSchema, buildSeoMetadata } from '../../../../../lib/seo'

export const revalidate = 300

const PAGE_SIZE = 9

const getCategory = cache(async (slug) => {
  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'categories',
    where: { slug: { equals: slug } },
    limit: 1,
    depth: 0,
    overrideAccess: false,
  })
  return docs[0] || null
})

export async function generateMetadata({ params }) {
  const { slug } = await params
  const category = await getCategory(slug)

  if (!category) {
    return {
      title: 'Category Not Found | StillLoud',
      robots: { index: false, follow: false },
    }
  }

  return buildSeoMetadata({
    seo: category.seo,
    title: `${category.title} | StillLoud Blog`,
    description:
      category.description ||
      `Articles about ${category.title} from the StillLoud studio.`,
    path: `/blog/category/${category.slug}`,
    image: category.seo?.ogImage,
  })
}

export default async function CategoryPage({ params, searchParams }) {
  const { slug } = await params
  const category = await getCategory(slug)
  if (!category) notFound()

  const queryParams = (await searchParams) || {}
  const query = typeof queryParams.q === 'string' ? queryParams.q.trim() : ''
  const page = Math.max(1, Number.parseInt(String(queryParams.page || '1'), 10) || 1)

  const payload = await getPayloadClient()

  const [{ docs: categories }, result] = await Promise.all([
    payload.find({
      collection: 'categories',
      limit: 100,
      sort: 'title',
      depth: 0,
      overrideAccess: false,
    }),
    payload.find({
      collection: 'posts',
      where: {
        _status: { equals: 'published' },
        categories: { in: [category.id] },
        ...(query
          ? {
              or: [
                { title: { contains: query } },
                { excerpt: { contains: query } },
                { 'tags.tag': { contains: query } },
              ],
            }
          : {}),
      },
      sort: '-publishedAt',
      limit: PAGE_SIZE,
      page,
      depth: 1,
      overrideAccess: false,
    }),
  ])

  const url = `/blog/category/${category.slug}`

  const breadcrumbs = breadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'Blog', url: '/blog' },
    { name: category.title, url },
  ])

  const collectionSchema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: `${category.title} articles`,
    description: category.description || undefined,
    url: absoluteUrl(url),
    isPartOf: { '@id': `${absoluteUrl('/')}#website` },
    mainEntity: {
      '@type': 'ItemList',
      itemListElement: result.docs.map((post, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        url: absoluteUrl(`/blog/${post.slug}`),
        name: post.title,
      })),
    },
  }

  return (
    <div className="blog-page">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbs) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionSchema) }}
      />

      <BackToTop />
      <Navbar variant="blog" />

      <section className="blog-hero">
        <div className="blog-hero-inner">
          <nav className="post-breadcrumb" aria-label="Breadcrumb">
            <a href="/">Home</a>
            <i className="fas fa-chevron-right" aria-hidden="true" />
            <a href="/blog">Blog</a>
            <i className="fas fa-chevron-right" aria-hidden="true" />
            <span aria-current="page">{category.title}</span>
          </nav>
          <div className="blog-eyebrow">
            <span className="bullet-dot" aria-hidden="true" />
            Category
          </div>
          <h1 className="blog-title">{category.title}</h1>
          {category.description && <p className="blog-subtitle">{category.description}</p>}
        </div>
      </section>

      <BlogArchive
        posts={result.docs}
        categories={categories}
        activeCategory={category}
        query={query}
        page={result.page || page}
        totalPages={result.totalPages || 1}
        basePath={url}
        emptyTitle={`No ${category.title.toLowerCase()} articles yet`}
        emptyText="We are working on the next one. Browse every article in the meantime."
      />

      <section className="blog-cta" aria-labelledby="category-cta-title">
        <h2 id="category-cta-title">
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
