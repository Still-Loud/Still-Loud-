import { getPayloadClient } from '../lib/payload'

const SITE = process.env.NEXT_PUBLIC_SERVER_URL || 'https://stillloud.in'

export const revalidate = 3600

/**
 * Every public, indexable URL. Drafts are excluded by `_status` and pages that
 * opt out with SEO → "Hide from search engines" are skipped.
 */
export default async function sitemap() {
  const payload = await getPayloadClient()

  const [posts, projects, pages, categories] = await Promise.all([
    payload
      .find({
        collection: 'posts',
        where: { _status: { equals: 'published' } },
        limit: 1000,
        depth: 0,
        sort: '-publishedAt',
        overrideAccess: false,
      })
      .catch(() => ({ docs: [] })),
    payload
      .find({
        collection: 'projects',
        where: { _status: { equals: 'published' } },
        limit: 1000,
        depth: 0,
        sort: 'order',
        overrideAccess: false,
      })
      .catch(() => ({ docs: [] })),
    payload
      .find({
        collection: 'pages',
        where: { _status: { equals: 'published' } },
        limit: 1000,
        depth: 0,
        overrideAccess: false,
      })
      .catch(() => ({ docs: [] })),
    payload
      .find({
        collection: 'categories',
        limit: 1000,
        depth: 0,
        sort: 'title',
        overrideAccess: false,
      })
      .catch(() => ({ docs: [] })),
  ])

  const lastPostUpdate = posts.docs[0]?.updatedAt

  const caseUrls = projects.docs.map((project) => ({
    url: `${SITE}/projects/${project.slug}`,
    lastModified: project.updatedAt ? new Date(project.updatedAt) : new Date(),
    changeFrequency: 'monthly',
    priority: 0.7,
  }))

  const pageUrls = pages.docs
    .filter((page) => !page.seo?.noIndex)
    .map((page) => ({
      url: `${SITE}/${page.slug}`,
      lastModified: page.updatedAt ? new Date(page.updatedAt) : new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    }))

  const categoryUrls = categories.docs.map((category) => ({
    url: `${SITE}/blog/category/${category.slug}`,
    lastModified: category.updatedAt ? new Date(category.updatedAt) : new Date(),
    changeFrequency: 'weekly',
    priority: 0.5,
  }))

  const postUrls = posts.docs
    .filter((post) => !post.seo?.noIndex)
    .map((post) => ({
      url: `${SITE}/blog/${post.slug}`,
      lastModified: post.updatedAt ? new Date(post.updatedAt) : new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    }))

  return [
    {
      url: `${SITE}/`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: `${SITE}/our-work`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.9,
    },
    {
      url: `${SITE}/projects`,
      lastModified: projects.docs[0]?.updatedAt
        ? new Date(projects.docs[0].updatedAt)
        : new Date(),
      changeFrequency: 'monthly',
      priority: 0.9,
    },
    {
      url: `${SITE}/blog`,
      lastModified: lastPostUpdate ? new Date(lastPostUpdate) : new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    ...caseUrls,
    ...pageUrls,
    ...categoryUrls,
    ...postUrls,
  ]
}
