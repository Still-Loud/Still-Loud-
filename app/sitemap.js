import { getPayloadClient } from '../lib/payload'

const SITE = process.env.NEXT_PUBLIC_SERVER_URL || 'https://stillloud.in'

export const revalidate = 3600

export default async function sitemap() {
  const payload = await getPayloadClient()

  const { docs: posts } = await payload.find({
    collection: 'posts',
    where: { _status: { equals: 'published' } },
    limit: 1000,
    depth: 0,
    sort: '-publishedAt',
    overrideAccess: false,
  })

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
      url: `${SITE}/blog`,
      lastModified: posts[0]?.updatedAt ? new Date(posts[0].updatedAt) : new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    ...posts.map((post) => ({
      url: `${SITE}/blog/${post.slug}`,
      lastModified: post.updatedAt ? new Date(post.updatedAt) : new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    })),
  ]
}
