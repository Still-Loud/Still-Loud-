import { blogPaths, revalidate } from '../lib/revalidate.js'
import { slugify } from '../lib/slugify.js'
import { canPublish, isAdmin, publishedOrLoggedIn } from './access.js'
import { seoField } from './fields/seo.js'

/** @type {import('payload').CollectionConfig} */
export const Posts = {
  slug: 'posts',
  labels: {
    singular: 'Post',
    plural: 'Posts',
  },
  admin: {
    group: 'Blog',
    useAsTitle: 'title',
    defaultColumns: ['title', 'slug', 'publishedAt', '_status', 'updatedAt'],
    description: 'Blog articles. Drafts stay hidden from the public site until published.',
    preview: (doc) =>
      doc?.slug ? `/api/preview?collection=posts&slug=${encodeURIComponent(doc.slug)}` : null,
  },
  versions: {
    drafts: true,
    maxPerDoc: 20,
  },
  access: {
    read: publishedOrLoggedIn,
    create: canPublish,
    update: canPublish,
    delete: isAdmin,
  },
  hooks: {
    beforeValidate: [
      ({ data }) => {
        if (data && !data.slug && data.title) {
          return { ...data, slug: slugify(data.title) }
        }
        return data
      },
    ],
    beforeChange: [
      ({ data }) => {
        // Stamp the first publish date; later edits keep the original.
        if (data?._status === 'published' && !data.publishedAt) {
          return { ...data, publishedAt: new Date().toISOString() }
        }
        return data
      },
    ],
    /* Purge the cached blog pages when an article is published, edited or
       unpublished, so the change is visible immediately instead of after the
       ISR window. */
    afterChange: [
      async ({ doc, previousDoc }) => {
        await revalidate(blogPaths(doc?.slug, previousDoc?.slug))
        return doc
      },
    ],
    afterDelete: [
      async ({ doc }) => {
        await revalidate(blogPaths(doc?.slug))
        return doc
      },
    ],
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      admin: {
        position: 'sidebar',
        description: 'Used in the URL: /blog/<slug>',
      },
    },
    {
      type: 'ui',
      name: 'publicUrl',
      admin: {
        position: 'sidebar',
        components: {
          Field: {
            path: '/components/admin/PublicUrl#PublicUrl',
            clientProps: { collection: 'posts' },
          },
        },
      },
    },
    {
      name: 'excerpt',
      type: 'textarea',
      required: true,
      maxLength: 320,
      label: 'Description',
      admin: {
        description: 'Shown in the blog list, search results and social cards.',
      },
    },
    {
      name: 'heroImage',
      type: 'upload',
      relationTo: 'media',
      label: 'Featured image',
      admin: {
        description: 'Optional cover image. Used for the article header and OG image.',
      },
    },
    {
      name: 'content',
      type: 'richText',
      required: true,
    },
    {
      name: 'categories',
      type: 'relationship',
      relationTo: 'categories',
      hasMany: true,
      label: 'Categories',
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'tags',
      type: 'array',
      label: 'Tags',
      fields: [{ name: 'tag', type: 'text', required: true }],
      admin: {
        description: 'Free-form keywords used for internal linking and related posts. e.g. branding, packaging.',
      },
    },
    {
      name: 'author',
      type: 'relationship',
      relationTo: 'users',
      admin: {
        position: 'sidebar',
        description: 'Shown on the article and in structured data.',
      },
      defaultValue: ({ user }) => user?.id,
    },
    {
      name: 'publishedAt',
      type: 'date',
      label: 'Publication date',
      admin: {
        position: 'sidebar',
        date: {
          pickerAppearance: 'dayAndTime',
        },
        description: 'Set automatically on first publish. You can backdate it.',
      },
    },
    {
      name: 'readingTime',
      type: 'number',
      min: 1,
      max: 120,
      admin: {
        position: 'sidebar',
        description: 'Estimated minutes. Optional — the blog list can compute it.',
      },
    },
    {
      name: 'featured',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        position: 'sidebar',
        description: 'Pin to the top of the blog index.',
      },
    },
    seoField,
  ],
}
