import { RichText } from '@payloadcms/richtext-lexical/react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { cache } from 'react'

import '../../../../styles/blog.css'

import BackToTop from '../../../../components/BackToTop'
import Footer from '../../../../components/Footer'
import Navbar from '../../../../components/Navbar'
import PostCard from '../../../../components/blog/PostCard'
import TawkTo from '../../../../components/TawkTo'
import { absoluteMediaUrl, formatDate, mediaUrl, readingTime } from '../../../../lib/media'
import { OG_IMAGE, SITE_URL, buildOpenGraph, buildTwitter } from '../../../../lib/metadata'
import { getPayloadClient } from '../../../../lib/payload'

export const revalidate = 60

const SITE = SITE_URL

const getPost = cache(async (slug) => {
  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'posts',
    where: {
      slug: { equals: slug },
      _status: { equals: 'published' },
    },
    limit: 1,
    depth: 2,
    overrideAccess: false,
  })
  return docs[0] || null
})

export async function generateMetadata({ params }) {
  const { slug } = await params
  const post = await getPost(slug)

  if (!post) {
    return {
      title: 'Article Not Found | StillLoud',
      robots: { index: false, follow: false },
    }
  }

  const title = post.seo?.metaTitle || `${post.title} | StillLoud`
  const description = post.seo?.metaDescription || post.excerpt
  const image = absoluteMediaUrl(post.seo?.ogImage || post.heroImage, 'hero')
  const ogImages = image
    ? [{ url: image, alt: post.heroImage?.alt || post.title }]
    : [OG_IMAGE]

  return {
    title,
    description,
    alternates: {
      canonical: `/blog/${post.slug}`,
    },
    openGraph: buildOpenGraph({
      title,
      description,
      path: `/blog/${post.slug}`,
      type: 'article',
      images: ogImages,
      publishedTime: post.publishedAt || undefined,
      modifiedTime: post.updatedAt || undefined,
    }),
    twitter: buildTwitter({
      title,
      description,
      images: ogImages.map((item) => item.url),
    }),
    robots: post.seo?.noIndex ? { index: false, follow: false } : undefined,
  }
}

export default async function BlogPostPage({ params }) {
  const { slug } = await params
  const post = await getPost(slug)

  if (!post) notFound()

  const payload = await getPayloadClient()

  const categories = (post.categories || []).filter(Boolean)
  const categoryIds = categories.map((category) => category.id).filter(Boolean)

  const { docs: related } = categoryIds.length
    ? await payload.find({
        collection: 'posts',
        where: {
          _status: { equals: 'published' },
          id: { not_equals: post.id },
          categories: { in: categoryIds },
        },
        sort: '-publishedAt',
        limit: 3,
        depth: 1,
        overrideAccess: false,
      })
    : { docs: [] }

  const hero = mediaUrl(post.heroImage, 'hero')
  const date = formatDate(post.publishedAt || post.createdAt)
  const minutes = post.readingTime || readingTime(post.content)
  const updated = formatDate(post.updatedAt)
  const shareUrl = `${SITE}/blog/${post.slug}`

  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.seo?.metaDescription || post.excerpt,
    image: absoluteMediaUrl(post.seo?.ogImage || post.heroImage, 'hero') || undefined,
    datePublished: post.publishedAt || post.createdAt,
    dateModified: post.updatedAt,
    author: {
      '@type': 'Person',
      name: post.author?.name || 'StillLoud',
    },
    publisher: {
      '@type': 'Organization',
      name: 'StillLoud',
      logo: {
        '@type': 'ImageObject',
        url: `${SITE}/assets/logo.svg`,
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': shareUrl,
    },
  }

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE}/` },
      { '@type': 'ListItem', position: 2, name: 'Blog', item: `${SITE}/blog` },
      { '@type': 'ListItem', position: 3, name: post.title, item: shareUrl },
    ],
  }

  return (
    <div className="blog-page">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      <BackToTop />
      <Navbar variant="blog" />

      <article>
        <header className="post-hero">
          <div className="post-hero-inner">
            <nav className="post-breadcrumb" aria-label="Breadcrumb">
              <Link href="/">Home</Link>
              <i className="fas fa-chevron-right" aria-hidden="true" />
              <Link href="/blog">Blog</Link>
              <i className="fas fa-chevron-right" aria-hidden="true" />
              <span aria-current="page">{post.title}</span>
            </nav>

            {categories.length > 0 && (
              <div className="post-cats">
                {categories.map((category) => (
                  <Link
                    key={category.id}
                    href={`/blog?category=${encodeURIComponent(category.slug)}`}
                    className="blog-cat-pill"
                  >
                    {category.title}
                  </Link>
                ))}
              </div>
            )}

            <h1 className="post-title">{post.title}</h1>

            <div className="post-meta">
              {post.author?.name && <span>{post.author.name}</span>}
              {post.author?.name && date ? <span className="dot" /> : null}
              {date && (
                <time dateTime={post.publishedAt || post.createdAt}>{date}</time>
              )}
              {minutes ? <span className="dot" /> : null}
              {minutes ? <span>{minutes} min read</span> : null}
            </div>
          </div>

          {hero && (
            <div className="post-hero-image">
              <img
                src={hero}
                alt={post.heroImage?.alt || post.title}
                width={post.heroImage?.width || undefined}
                height={post.heroImage?.height || undefined}
                decoding="async"
              />
            </div>
          )}
        </header>

        <div className="post-body">
          <div className="post-content">
            <RichText data={post.content} />
          </div>

          {categories.length > 0 && (
            <div className="post-tags" aria-label="Categories">
              {categories.map((category) => (
                <Link
                  key={category.id}
                  href={`/blog?category=${encodeURIComponent(category.slug)}`}
                >
                  {category.title}
                </Link>
              ))}
            </div>
          )}

          <div className="post-share">
            <span>Share</span>
            <a
              href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(post.title)}&url=${encodeURIComponent(shareUrl)}`}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Share on X"
            >
              <i className="fab fa-twitter" />
            </a>
            <a
              href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Share on LinkedIn"
            >
              <i className="fab fa-linkedin-in" />
            </a>
            <a
              href={`https://wa.me/?text=${encodeURIComponent(`${post.title} ${shareUrl}`)}`}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Share on WhatsApp"
            >
              <i className="fab fa-whatsapp" />
            </a>
          </div>

          {updated && updated !== date && (
            <p className="post-updated">Last updated {updated}.</p>
          )}
        </div>
      </article>

      {related.length > 0 && (
        <section className="post-related blog-container" aria-labelledby="related-title">
          <h2 id="related-title" className="post-related-title">
            Keep reading
          </h2>
          <div className="blog-grid">
            {related.map((item) => (
              <PostCard key={item.id} post={item} />
            ))}
          </div>
        </section>
      )}

      <section className="blog-cta" aria-labelledby="post-cta-title">
        <h2 id="post-cta-title">
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
