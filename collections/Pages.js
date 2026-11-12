import { pagePaths, revalidate } from '../lib/revalidate.js'
import { reservedSlugMessage } from '../lib/reserved-slugs.js'
import { slugify } from '../lib/slugify.js'
import { canPublish, isAdmin, publishedOrLoggedIn } from './access.js'
import { seoField } from './fields/seo.js'

const anchorField = {
  name: 'anchor',
  type: 'text',
  label: 'Anchor (optional)',
  admin: {
    description: 'Lets you link to this block directly, e.g. /about-us#team.',
  },
}

/**
 * Custom, server-rendered pages.
 *
 * The page body is a short list of controlled blocks rather than a free-form
 * builder: every block maps to a component in components/pages/ and reuses the
 * existing StillLoud styling, so editors can add sections without changing the
 * design system.
 *
 * The legacy home-copy fields live in hidden tabs at the bottom. They are no
 * longer displayed (the homepage is managed by the HomePage global) but the
 * columns stay in place so the existing `hello` record is not destroyed.
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
    description:
      'Extra pages such as About us or Our process. Published pages get a real URL: /<slug>.',
    preview: (doc) =>
      doc?.slug ? `/api/preview?collection=pages&slug=${encodeURIComponent(doc.slug)}` : null,
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
        if (data?._status === 'published' && !data.publishedAt) {
          return { ...data, publishedAt: new Date().toISOString() }
        }
        return data
      },
    ],
    afterChange: [
      async ({ doc, previousDoc }) => {
        await revalidate(pagePaths(doc?.slug, previousDoc?.slug))
        return doc
      },
    ],
    afterDelete: [
      async ({ doc }) => {
        await revalidate(pagePaths(doc?.slug))
        return doc
      },
    ],
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
      label: 'Page title',
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      admin: {
        position: 'sidebar',
        description: 'The page address. /about-us → slug “about-us”.',
      },
      validate: (value) => reservedSlugMessage(value),
    },
    {
      type: 'ui',
      name: 'publicUrl',
      admin: {
        position: 'sidebar',
        components: {
          Field: {
            path: '/components/admin/PublicUrl#PublicUrl',
            clientProps: { collection: 'pages' },
          },
        },
      },
    },
    {
      name: 'description',
      type: 'textarea',
      label: 'Page description',
      maxLength: 300,
      admin: {
        description: 'One or two sentences. Used in search results and social cards when SEO fields are empty.',
      },
    },
    {
      name: 'featuredImage',
      type: 'upload',
      relationTo: 'media',
      label: 'Featured image',
      admin: {
        description: 'Optional header image and fallback social image.',
      },
    },
    {
      name: 'publishedAt',
      type: 'date',
      admin: {
        position: 'sidebar',
        readOnly: true,
        date: { pickerAppearance: 'dayAndTime' },
        description: 'Set automatically on first publish.',
      },
    },
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Page content',
          description: 'Add one section at a time. Drag to reorder.',
          fields: [
            {
              name: 'layout',
              type: 'blocks',
              labels: { singular: 'Section', plural: 'Sections' },
              blocks: [
                {
                  slug: 'text',
                  labels: { singular: 'Text section', plural: 'Text sections' },
                  fields: [
                    anchorField,
                    { name: 'eyebrow', type: 'text', label: 'Small label above the heading' },
                    { name: 'heading', type: 'text', label: 'Heading' },
                    { name: 'content', type: 'richText', label: 'Body' },
                  ],
                },
                {
                  slug: 'imageText',
                  labels: { singular: 'Image and text', plural: 'Image and text sections' },
                  fields: [
                    anchorField,
                    { name: 'eyebrow', type: 'text' },
                    { name: 'heading', type: 'text', label: 'Heading' },
                    { name: 'content', type: 'richText', label: 'Body' },
                    { name: 'image', type: 'upload', relationTo: 'media', required: true },
                    { name: 'imageAlt', type: 'text', label: 'Image description (alt text)' },
                    {
                      name: 'imagePosition',
                      type: 'select',
                      defaultValue: 'right',
                      options: [
                        { label: 'Image on the right', value: 'right' },
                        { label: 'Image on the left', value: 'left' },
                      ],
                    },
                  ],
                },
                {
                  slug: 'gallery',
                  labels: { singular: 'Gallery', plural: 'Galleries' },
                  fields: [
                    anchorField,
                    { name: 'eyebrow', type: 'text' },
                    { name: 'heading', type: 'text', label: 'Heading' },
                    {
                      name: 'images',
                      type: 'array',
                      label: 'Images',
                      minRows: 1,
                      fields: [
                        { name: 'image', type: 'upload', relationTo: 'media', required: true },
                        { name: 'caption', type: 'text' },
                      ],
                    },
                    {
                      name: 'columns',
                      type: 'select',
                      defaultValue: '3',
                      options: [
                        { label: 'Two columns', value: '2' },
                        { label: 'Three columns', value: '3' },
                      ],
                    },
                  ],
                },
                {
                  slug: 'video',
                  labels: { singular: 'Video section', plural: 'Video sections' },
                  fields: [
                    anchorField,
                    { name: 'heading', type: 'text', label: 'Heading' },
                    { name: 'text', type: 'textarea', label: 'Supporting text' },
                    {
                      name: 'video',
                      type: 'upload',
                      relationTo: 'media',
                      label: 'Uploaded video',
                      admin: { description: 'Upload an MP4/MOV to the Media Library.' },
                    },
                    {
                      name: 'videoUrl',
                      type: 'text',
                      label: 'External video URL',
                      admin: { description: 'Alternative to uploading. Overrides the upload.' },
                    },
                    { name: 'poster', type: 'upload', relationTo: 'media', label: 'Poster frame' },
                  ],
                },
                {
                  slug: 'faq',
                  labels: { singular: 'FAQ', plural: 'FAQs' },
                  fields: [
                    anchorField,
                    { name: 'heading', type: 'text', label: 'Heading', defaultValue: 'Frequently asked questions' },
                    { name: 'text', type: 'textarea', label: 'Supporting text' },
                    {
                      name: 'items',
                      type: 'array',
                      label: 'Questions',
                      minRows: 1,
                      fields: [
                        { name: 'question', type: 'text', required: true },
                        { name: 'answer', type: 'textarea', required: true },
                      ],
                    },
                  ],
                },
                {
                  slug: 'cta',
                  labels: { singular: 'Call to action', plural: 'Calls to action' },
                  fields: [
                    anchorField,
                    { name: 'heading', type: 'text', label: 'Heading', required: true },
                    { name: 'text', type: 'textarea', label: 'Supporting text' },
                    { name: 'buttonLabel', type: 'text', label: 'Button label', defaultValue: 'Get in touch' },
                    { name: 'buttonUrl', type: 'text', label: 'Button link', defaultValue: '/#contact' },
                    {
                      name: 'style',
                      type: 'select',
                      defaultValue: 'red',
                      options: [
                        { label: 'Red', value: 'red' },
                        { label: 'Dark', value: 'dark' },
                      ],
                    },
                  ],
                },
              ],
              admin: {
                description:
                  'Sections appear in this order. Each one uses the existing StillLoud style.',
              },
            },
          ],
        },
        {
          label: 'SEO',
          fields: [seoField],
        },

        /* ---------------------------------------------------------------
           Legacy home copy. Hidden from editors; kept so the original
           `hello` document keeps all of its data. New content lives in the
           HomePage global.
           --------------------------------------------------------------- */
        {
          label: 'Hero (legacy)',
          admin: { condition: () => false },
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
                { name: 'accent', type: 'checkbox', defaultValue: false },
              ],
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
          label: 'About (legacy)',
          admin: { condition: () => false },
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
                { name: 'icon', type: 'text' },
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
          label: 'Services (legacy)',
          admin: { condition: () => false },
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
                { name: 'icon', type: 'text' },
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
          label: 'Portfolio (legacy)',
          admin: { condition: () => false },
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
            },
          ],
        },
        {
          label: 'Pricing (legacy)',
          admin: { condition: () => false },
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
                { name: 'featured', type: 'checkbox', defaultValue: false },
              ],
            },
          ],
        },
      ],
    },
  ],
}
