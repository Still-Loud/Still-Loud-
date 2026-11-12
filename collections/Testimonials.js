import { revalidate, testimonialPaths } from '../lib/revalidate.js'
import { canPublish, isAdmin, publishedOrLoggedIn } from './access.js'

/**
 * Real client testimonials shown in the homepage carousel.
 *
 * Only published + featured entries reach the homepage, ordered by the `order`
 * field. Nothing here is invented by the site — an editor must paste a quote
 * the client actually gave.
 */
/** @type {import('payload').CollectionConfig} */
export const Testimonials = {
  slug: 'testimonials',
  labels: {
    singular: 'Testimonial',
    plural: 'Testimonials',
  },
  admin: {
    group: 'Portfolio',
    useAsTitle: 'name',
    defaultColumns: ['name', 'company', 'rating', 'featured', 'order', '_status'],
    description:
      'Client quotes. Add the real person and company — never invent a review. Only published + featured quotes appear on the homepage.',
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
    afterChange: [
      async ({ doc }) => {
        await revalidate(testimonialPaths)
        return doc
      },
    ],
    afterDelete: [
      async ({ doc }) => {
        await revalidate(testimonialPaths)
        return doc
      },
    ],
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      label: 'Client name',
    },
    {
      name: 'company',
      type: 'text',
      required: true,
      label: 'Company',
    },
    {
      name: 'role',
      type: 'text',
      label: 'Designation',
      admin: {
        description: 'Job title, e.g. “Founder” or “Marketing Head”.',
      },
    },
    {
      name: 'quote',
      type: 'textarea',
      required: true,
      label: 'Testimonial text',
      maxLength: 600,
      admin: {
        description: 'Paste the client’s actual words. Do not add or embellish quotes.',
      },
    },
    {
      type: 'row',
      fields: [
        {
          name: 'image',
          type: 'upload',
          relationTo: 'media',
          label: 'Client photo',
          admin: {
            width: '50%',
            description: 'Optional portrait. Shown as a small avatar when available.',
          },
        },
        {
          name: 'logo',
          type: 'upload',
          relationTo: 'media',
          label: 'Company logo',
          admin: {
            width: '50%',
            description: 'Optional. Falls back to the client photo or initials.',
          },
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'rating',
          type: 'number',
          min: 1,
          max: 5,
          defaultValue: 5,
          admin: {
            width: '50%',
            description: 'Only set a rating the client actually gave.',
          },
        },
        {
          name: 'order',
          type: 'number',
          defaultValue: 0,
          admin: {
            width: '50%',
            description: 'Lower numbers appear first.',
          },
        },
      ],
    },
    {
      name: 'featured',
      type: 'checkbox',
      defaultValue: true,
      admin: {
        position: 'sidebar',
        description: 'Featured quotes appear on the homepage.',
      },
    },
  ],
}
