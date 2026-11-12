import { revalidate, projectPaths } from '../lib/revalidate.js'
import { slugify } from '../lib/slugify.js'
import { canPublish, isAdmin, publishedOrLoggedIn } from './access.js'
import { seoField } from './fields/seo.js'

/**
 * Portfolio projects.
 *
 * One record powers three things: the /our-work gallery card, the /projects
 * listing and the /projects/<slug> detail page. Drafts never reach the public
 * site (access rule + published-only queries). Featured projects can also drive
 * the homepage case-study block.
 */
/** @type {import('payload').CollectionConfig} */
export const Projects = {
  slug: 'projects',
  labels: {
    singular: 'Project',
    plural: 'Projects',
  },
  admin: {
    group: 'Portfolio',
    useAsTitle: 'title',
    defaultColumns: ['title', 'category', 'featured', 'order', '_status', 'updatedAt'],
    description:
      'Portfolio work. Published projects appear on Our Work and get their own /projects/<slug> page.',
    preview: ({ slug }) =>
      slug ? `/api/preview?collection=projects&slug=${encodeURIComponent(slug)}` : null,
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
    afterChange: [
      async ({ doc, previousDoc }) => {
        await revalidate(projectPaths(doc?.slug, previousDoc?.slug))
        return doc
      },
    ],
    afterDelete: [
      async ({ doc }) => {
        await revalidate(projectPaths(doc?.slug))
        return doc
      },
    ],
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
      label: 'Project title',
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      admin: {
        position: 'sidebar',
        description: 'Used in the public URL: /projects/<slug>',
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
            clientProps: { collection: 'projects' },
          },
        },
      },
    },
    {
      name: 'category',
      type: 'select',
      required: true,
      defaultValue: 'creative',
      options: [
        { label: 'Creative / Social Media', value: 'creative' },
        { label: 'Reels', value: 'reels' },
        { label: 'Branding', value: 'branding' },
        { label: 'Logo', value: 'logo' },
        { label: 'Printables', value: 'printables' },
      ],
      admin: {
        position: 'sidebar',
        description: 'Controls which filter tab the project appears under.',
      },
    },
    {
      name: 'mediaType',
      type: 'select',
      required: true,
      defaultValue: 'image',
      options: [
        { label: 'Image', value: 'image' },
        { label: 'Video', value: 'video' },
      ],
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'image',
      type: 'upload',
      relationTo: 'media',
      label: 'Featured image',
      admin: {
        condition: (data) => data?.mediaType !== 'video',
        description: 'Card and detail-page hero image.',
      },
    },
    {
      name: 'video',
      type: 'upload',
      relationTo: 'media',
      label: 'Uploaded video',
      admin: {
        condition: (data) => data?.mediaType === 'video',
        description: 'Upload an MP4/MOV to the Media Library, or paste an existing Cloudinary URL below.',
      },
    },
    {
      name: 'videoUrl',
      type: 'text',
      label: 'External video URL',
      admin: {
        condition: (data) => data?.mediaType === 'video',
        description: 'For videos already hosted on Cloudinary or another CDN. Overrides the upload.',
      },
    },
    {
      name: 'poster',
      type: 'upload',
      relationTo: 'media',
      label: 'Video poster frame',
      admin: {
        condition: (data) => data?.mediaType === 'video',
        description: 'Optional still frame shown before the reel plays.',
      },
    },
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Content',
          fields: [
            {
              name: 'description',
              type: 'textarea',
              label: 'Short description',
              maxLength: 400,
              admin: {
                description: 'One or two sentences used on cards and in search results.',
              },
            },
            {
              name: 'content',
              type: 'richText',
              label: 'Full description',
              admin: {
                description:
                  'The project story: brief, approach and result. Keep it in your own words.',
              },
            },
            {
              type: 'collapsible',
              label: 'Case study sections',
              admin: {
                description:
                  'Optional structured sections. They render as headings above the gallery.',
              },
              fields: [
                {
                  name: 'objective',
                  type: 'textarea',
                  label: 'Project objective',
                  admin: { description: 'What the client wanted to achieve.' },
                },
                {
                  name: 'challenge',
                  type: 'textarea',
                  label: 'Challenge',
                  admin: { description: 'The problem or constraint the work had to solve.' },
                },
                {
                  name: 'strategy',
                  type: 'textarea',
                  label: 'Strategy',
                  admin: { description: 'The thinking and plan behind the work.' },
                },
                {
                  name: 'creativeProcess',
                  type: 'textarea',
                  label: 'Creative process',
                  admin: { description: 'How the idea was explored and produced.' },
                },
                {
                  name: 'finalSolution',
                  type: 'textarea',
                  label: 'Final solution',
                  admin: { description: 'What was delivered and how it performed.' },
                },
              ],
            },
            {
              name: 'gallery',
              type: 'array',
              label: 'Gallery',
              fields: [
                {
                  name: 'image',
                  type: 'upload',
                  relationTo: 'media',
                  required: true,
                },
                {
                  name: 'caption',
                  type: 'text',
                },
              ],
              admin: {
                description: 'Additional images shown under the story. Drag to reorder.',
              },
            },
            {
              name: 'videoGallery',
              type: 'array',
              label: 'Video gallery',
              fields: [
                {
                  name: 'video',
                  type: 'upload',
                  relationTo: 'media',
                  required: true,
                },
                {
                  name: 'caption',
                  type: 'text',
                },
              ],
              admin: {
                description: 'Extra reels or clips shown with the project gallery.',
              },
            },
          ],
        },
        {
          label: 'Details',
          fields: [
            {
              type: 'row',
              fields: [
                { name: 'client', type: 'text', admin: { width: '50%' } },
                {
                  name: 'completionDate',
                  type: 'date',
                  admin: {
                    width: '50%',
                    date: { pickerAppearance: 'monthOnly', displayFormat: 'MMM yyyy' },
                    description: 'Month and year the work went live.',
                  },
                },
              ],
            },
            {
              name: 'services',
              type: 'array',
              label: 'Services provided',
              fields: [{ name: 'label', type: 'text', required: true }],
              admin: {
                description: 'e.g. Brand identity, Social media design, Website.',
              },
            },
            {
              type: 'row',
              fields: [
                {
                  name: 'externalUrl',
                  type: 'text',
                  label: 'External project URL',
                  admin: {
                    width: '50%',
                    description: 'Optional live site or client Instagram.',
                  },
                },
                {
                  name: 'alt',
                  type: 'text',
                  label: 'Image alt text',
                  admin: {
                    width: '50%',
                    description: 'Falls back to the project title.',
                  },
                },
              ],
            },
            {
              name: 'externalLinks',
              type: 'array',
              label: 'External links',
              fields: [
                { name: 'label', type: 'text', required: true },
                { name: 'url', type: 'text', required: true },
              ],
              admin: {
                description: 'Live site, social posts, press or award links.',
              },
            },
            {
              name: 'relatedProjects',
              type: 'relationship',
              relationTo: 'projects',
              hasMany: true,
              label: 'Related projects',
              filterOptions: ({ id }) => (id ? { id: { not_equals: id } } : true),
              admin: {
                description:
                  'Optional manual selection shown at the end of the page. Empty falls back to same-category work.',
              },
            },
            {
              name: 'badge',
              type: 'text',
              admin: {
                description: 'Small label on the card. Defaults to the category label.',
              },
            },
            {
              name: 'year',
              type: 'number',
              min: 2000,
              max: 2100,
              admin: {
                description: 'Legacy year field, kept for existing data. Use Completion date instead.',
              },
            },
          ],
        },
        {
          label: 'Case study',
          fields: [
            {
              type: 'group',
              name: 'caseStudy',
              label: false,
              fields: [
                { name: 'headline', type: 'text' },
                { name: 'summary', type: 'textarea' },
                {
                  name: 'stats',
                  type: 'array',
                  fields: [
                    { name: 'label', type: 'text', required: true },
                    { name: 'value', type: 'text', required: true },
                    { name: 'suffix', type: 'text' },
                  ],
                },
                {
                  name: 'deliverables',
                  type: 'array',
                  fields: [{ name: 'label', type: 'text', required: true }],
                },
                { name: 'backgroundImage', type: 'upload', relationTo: 'media' },
                { name: 'ctaLabel', type: 'text' },
                { name: 'ctaUrl', type: 'text' },
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
    {
      name: 'order',
      type: 'number',
      defaultValue: 0,
      admin: {
        position: 'sidebar',
        description: 'Lower numbers appear first on Our Work and /projects.',
      },
    },
    {
      name: 'featured',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        position: 'sidebar',
        description: 'Featured projects can drive the homepage case-study section.',
      },
    },
  ],
}
