import { notFound } from 'next/navigation'
import { cache } from 'react'

import '../../../styles/blog.css'
import '../../../styles/pages.css'

import BackToTop from '../../../components/BackToTop'
import Footer from '../../../components/Footer'
import Navbar from '../../../components/Navbar'
import PageBlocks, { faqItemsFromBlocks } from '../../../components/pages/PageBlocks'
import TawkTo from '../../../components/TawkTo'
import { isPreview } from '../../../lib/draft'
import { mediaAlt, mediaUrl } from '../../../lib/media'
import { getPayloadClient } from '../../../lib/payload'
import { absoluteUrl, breadcrumbSchema, buildSeoMetadata, faqSchema } from '../../../lib/seo'

export const revalidate = 300

const getPage = cache(async (slug) => {
  const preview = await isPreview()
  const payload = await getPayloadClient()

  const { docs } = await payload.find({
    collection: 'pages',
    where: preview
      ? { slug: { equals: slug } }
      : { slug: { equals: slug }, _status: { equals: 'published' } },
    limit: 1,
    depth: 2,
    draft: preview,
    overrideAccess: preview,
  })

  return docs[0] || null
})

export async function generateMetadata({ params }) {
  const { slug } = await params
  const page = await getPage(slug)

  if (!page) {
    return {
      title: 'Page Not Found | StillLoud',
      robots: { index: false, follow: false },
    }
  }

  return buildSeoMetadata({
    seo: page.seo,
    title: `${page.title} | StillLoud`,
    description: page.description || `${page.title} — StillLoud.`,
    path: `/${page.slug}`,
    image: page.seo?.ogImage || page.featuredImage,
  })
}

export default async function CustomPage({ params }) {
  const { slug } = await params
  const page = await getPage(slug)
  if (!page) notFound()

  const preview = await isPreview()
  const blocks = page.layout || []
  const faqs = faqItemsFromBlocks(blocks)
  const url = `/${page.slug}`
  const hero = mediaUrl(page.featuredImage, 'hero')

  const webPageSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: page.title,
    description: page.seo?.metaDescription || page.description || undefined,
    url: absoluteUrl(url),
    isPartOf: { '@id': `${absoluteUrl('/')}#website` },
    dateModified: page.updatedAt,
    inLanguage: 'en-IN',
  }

  const breadcrumbs = breadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: page.title, url },
  ])

  const faq = faqSchema(faqs)

  return (
    <div className="pg-page">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbs) }}
      />
      {faq && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faq) }} />
      )}

      <BackToTop />
      <Navbar variant="work" />

      {preview && (
        <div className="preview-banner" role="status">
          Draft preview — this page is not public.{' '}
          <a href={`/api/exit-preview?path=${encodeURIComponent(url)}`}>Exit preview</a>
        </div>
      )}

      <main>
        <header className="pg-hero">
          <div className="pg-container">
            <nav className="post-breadcrumb" aria-label="Breadcrumb">
              <a href="/">Home</a>
              <i className="fas fa-chevron-right" aria-hidden="true" />
              <span aria-current="page">{page.title}</span>
            </nav>
            <div className="eyebrow">
              <span className="bullet-dot" /> StillLoud
            </div>
            <h1>{page.title}</h1>
            {page.description && <p>{page.description}</p>}
            {hero && (
              <div className="pg-hero-image">
                <img
                  src={hero}
                  alt={mediaAlt(page.featuredImage, page.title)}
                  width={page.featuredImage?.width || undefined}
                  height={page.featuredImage?.height || undefined}
                  decoding="async"
                />
              </div>
            )}
          </div>
        </header>

        <PageBlocks blocks={blocks} />
      </main>

      <Footer variant="work" />
      <TawkTo />
    </div>
  )
}
