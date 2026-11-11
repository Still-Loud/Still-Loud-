import { revalidate } from '../lib/revalidate.js'
import { slugify } from '../lib/slugify.js'
import { canPublish, isAdmin, publishedOrLoggedIn } from './access.js'
import { seoField } from './fields/seo.js'

/**
 * Fixed, hand-built page content (D5) — no block builder.
 *
 * Each tab maps 1:1 to a section of the existing home page, so editors can
 * change copy without touching layout. Every field is optional: when empty the
 * frontend falls back to the copy currently in components/.
 */
/** @type {import('payload').CollectionConfig} */
export const Pages = {
  slug: 'pages',
  labels: {
    singular: 'Page',
    plural: 'Pages',
  },
  admin: {
    group: 'Content',
    useAsTitle: 'title',
    defaultColumns: ['title', 'slug', '_status', 'updatedAt'],
    description: 'Home page section copy. Layout stays fixed.',
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
    /* Home copy is cached; purge it (and the sitemap) on save. */
    afterChange: [
      async ({ doc }) => {
        await revalidate(['/', '/sitemap.xml'])
        return doc
      },
    ],
    afterDelete: [
      async ({ doc }) => {
        await revalidate(['/', '/sitemap.xml'])
        return doc
      },
    ],
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
      admin: {
        description: 'Internal name, e.g. “Home”.',
      },
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      admin: {
        position: 'sidebar',
        description: 'Use “home” for the single-page site.',
      },
    },
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Hero',
          fields: [
            {
              type: 'row',
              fields: [
                { name: 'heroEyebrow', type: 'text', admin: { width: '50%' } },
                { name: 'heroEyebrowUrl', type: 'text', admin: { width: '50%' } },
              ],
            },
            {
              name: 'heroHeadline',
              type: 'array',
              labels: { singular: 'Word', plural: 'Words' },
              fields: [
                { name: 'text', type: 'text', required: true },
                {
                  name: 'accent',
                  type: 'checkbox',
                  defaultValue: false,
                  label: 'Highlight in purple',
                },
              ],
              admin: {
                description: 'Rendered one word per line, alternating colour.',
              },
            },
            {
              type: 'row',
              fields: [
                { name: 'heroPrimaryLabel', type: 'text', admin: { width: '50%' } },
                { name: 'heroPrimaryHref', type: 'text', admin: { width: '50%' } },
              ],
            },
            {
              type: 'row',
              fields: [
                { name: 'heroSecondaryLabel', type: 'text', admin: { width: '50%' } },
                { name: 'heroSecondaryHref', type: 'text', admin: { width: '50%' } },
              ],
            },
            { name: 'heroImage', type: 'upload', relationTo: 'media' },
          ],
        },
        {
          label: 'About',
          fields: [
            { name: 'aboutEyebrow', type: 'text' },
            {
              name: 'aboutTitle',
              type: 'group',
              label: 'Heading',
              fields: [
                { name: 'lineOne', type: 'text' },
                { name: 'lineOneAccent', type: 'text' },
                { name: 'lineTwo', type: 'text' },
                { name: 'lineTwoAccent', type: 'text' },
              ],
            },
            { name: 'aboutDescription', type: 'textarea' },
            {
              name: 'aboutStats',
              type: 'array',
              fields: [
                { name: 'value', type: 'text', required: true },
                { name: 'label', type: 'text', required: true },
              ],
            },
            {
              name: 'aboutFeatures',
              type: 'array',
              fields: [
                {
                  name: 'icon',
                  type: 'text',
                  admin: {
                    description: 'Font Awesome class, e.g. fa-solid fa-compass',
                  },
                },
                { name: 'title', type: 'text', required: true },
                { name: 'text', type: 'textarea' },
              ],
            },
            {
              type: 'row',
              fields: [
                { name: 'aboutImageOne', type: 'upload', relationTo: 'media', admin: { width: '50%' } },
                { name: 'aboutImageTwo', type: 'upload', relationTo: 'media', admin: { width: '50%' } },
              ],
            },
          ],
        },
        {
          label: 'Services',
          fields: [
            { name: 'servicesEyebrow', type: 'text' },
            {
              name: 'servicesTitle',
              type: 'group',
              label: 'Heading',
              fields: [
                { name: 'lineOne', type: 'text' },
                { name: 'lineOneAccent', type: 'text' },
                { name: 'lineTwo', type: 'text' },
                { name: 'lineTwoAccent', type: 'text' },
              ],
            },
            {
              name: 'servicePills',
              type: 'array',
              fields: [
                { name: 'label', type: 'text', required: true },
                {
                  name: 'icon',
                  type: 'text',
                  admin: {
                    description: 'Font Awesome class, e.g. fa-solid fa-laptop-code',
                  },
                },
              ],
            },
            {
              type: 'row',
              fields: [
                { name: 'servicesDeliveredValue', type: 'text', admin: { width: '50%' } },
                { name: 'servicesDeliveredLabel', type: 'text', admin: { width: '50%' } },
              ],
            },
            {
              name: 'servicesBullets',
              type: 'array',
              fields: [{ name: 'label', type: 'text', required: true }],
            },
            { name: 'servicesImage', type: 'upload', relationTo: 'media' },
          ],
        },
        {
          label: 'Portfolio',
          fields: [
            { name: 'portfolioEyebrow', type: 'text' },
            { name: 'portfolioSubtitle', type: 'textarea' },
            { name: 'portfolioFooterTitle', type: 'text' },
            {
              name: 'portfolioCards',
              type: 'array',
              maxRows: 2,
              fields: [
                { name: 'image', type: 'upload', relationTo: 'media' },
                { name: 'alt', type: 'text' },
              ],
              admin: {
                description: 'The two large cards on the home page teaser.',
              },
            },
          ],
        },
        {
          label: 'Pricing',
          fields: [
            { name: 'pricingEyebrow', type: 'text' },
            {
              name: 'pricingTitle',
              type: 'group',
              label: 'Heading',
              fields: [
                { name: 'lineOne', type: 'text' },
                { name: 'lineOneAccent', type: 'text' },
              ],
            },
            {
              name: 'pricingPlans',
              type: 'array',
              maxRows: 3,
              fields: [
                { name: 'image', type: 'upload', relationTo: 'media' },
                { name: 'alt', type: 'text' },
                {
                  name: 'featured',
                  type: 'checkbox',
                  defaultValue: false,
                  label: 'Highlight this plan',
                },
              ],
            },
          ],
        },
        {
          label: 'SEO',
          fields: [seoField],
        },
      ],
    },
  ],
}
