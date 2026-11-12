import { OG_IMAGE, SITE_NAME, SITE_URL, buildOpenGraph, buildTwitter } from './metadata.js'
import { absoluteMediaUrl } from './media.js'

/**
 * Turn a document's `seo` group into real Next.js metadata.
 *
 * Used by every public route so the admin fields actually change the <head>:
 * title, description, canonical, Open Graph, Twitter card and robots.
 */
export function buildSeoMetadata({
  seo,
  title,
  description,
  path,
  image,
  type = 'website',
  publishedTime,
  modifiedTime,
}) {
  const metaTitle = seo?.metaTitle || title
  const metaDescription = seo?.metaDescription || description
  const canonical = seo?.canonical || path
  const ogUrl = absoluteUrl(canonical)

  const ogImageUrl = absoluteMediaUrl(image || seo?.ogImage)
  const images = ogImageUrl
    ? [{ url: ogImageUrl, alt: image?.alt || seo?.ogImage?.alt || metaTitle }]
    : [OG_IMAGE]

  return {
    title: metaTitle,
    description: metaDescription,
    alternates: {
      canonical: canonical || path,
    },
    openGraph: buildOpenGraph({
      title: metaTitle,
      description: metaDescription,
      path: ogUrl,
      type,
      images,
      ...(publishedTime ? { publishedTime } : {}),
      ...(modifiedTime ? { modifiedTime } : {}),
    }),
    twitter: buildTwitter({
      title: metaTitle,
      description: metaDescription,
      images: images.map((item) => item.url),
    }),
    robots: {
      index: !seo?.noIndex,
      follow: !seo?.noFollow,
    },
  }
}

export function absoluteUrl(pathOrUrl = '/') {
  if (!pathOrUrl) return SITE_URL
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl
  return `${SITE_URL}${pathOrUrl.startsWith('/') ? '' : '/'}${pathOrUrl}`
}

/** Home › Section › Page trail used on detail pages. */
export function breadcrumbSchema(items) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.url),
    })),
  }
}

/** FAQPage structured data for the FAQ content block. */
export function faqSchema(faqs = []) {
  const entries = (faqs || []).filter((item) => item?.question && item?.answer)
  if (entries.length === 0) return null

  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: entries.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  }
}

export function articleSchema({ post, url, imageUrl, authorName }) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.seo?.metaDescription || post.excerpt,
    image: imageUrl || undefined,
    datePublished: post.publishedAt || post.createdAt,
    dateModified: post.updatedAt,
    author: {
      '@type': 'Person',
      name: authorName || 'StillLoud',
    },
    publisher: {
      '@type': 'Organization',
      name: SITE_NAME,
      logo: {
        '@type': 'ImageObject',
        url: `${SITE_URL}/assets/logo.svg`,
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': absoluteUrl(url),
    },
  }
}
