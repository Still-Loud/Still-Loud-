import { slugify } from '../lib/slugify.js'
import { isAdmin, isAdminOrEditor } from './access.js'

/**
 * Portfolio items shown on /our-work.
 *
 * Images live in Media (Vercel Blob in production); videos stay on Cloudinary
 * as remote URLs (D4). Reel cards can carry an optional poster frame (D8).
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
    defaultColumns: ['title', 'category', 'mediaType', 'featured', 'order', 'updatedAt'],
  },
  access: {
    read: () => true,
    create: isAdminOrEditor,
    update: isAdminOrEditor,
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
        description: 'Controls which filter tab the card appears under.',
      },
    },
    {
      name: 'mediaType',
      type: 'select',
      required: true,
      defaultValue: 'image',
      options: [
        { label: 'Image', value: 'image' },
        { label: 'Video (Cloudinary URL)', value: 'video' },
      ],
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'image',
      type: 'upload',
      relationTo: 'media',
      admin: {
        condition: (data) => data?.mediaType !== 'video',
      },
    },
    {
      name: 'videoUrl',
      type: 'text',
      admin: {
        condition: (data) => data?.mediaType === 'video',
        description: 'Full Cloudinary (or other CDN) video URL.',
      },
    },
    {
      name: 'poster',
      type: 'upload',
      relationTo: 'media',
      admin: {
        condition: (data) => data?.mediaType === 'video',
        description: 'Optional still frame shown before the reel plays.',
      },
    },
    {
      name: 'alt',
      type: 'text',
      admin: {
        description: 'Alt text for image cards. Falls back to the project title.',
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
      name: 'externalUrl',
      type: 'text',
      admin: {
        description: 'Optional link — e.g. the client’s Instagram.',
      },
    },
    {
      name: 'description',
      type: 'textarea',
    },
    {
      name: 'client',
      type: 'text',
    },
    {
      name: 'year',
      type: 'number',
      min: 2000,
      max: 2100,
    },
    {
      name: 'order',
      type: 'number',
      defaultValue: 0,
      admin: {
        position: 'sidebar',
        description: 'Lower numbers appear first.',
      },
    },
    {
      name: 'featured',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        position: 'sidebar',
        description: 'Featured projects can drive the case-study section.',
      },
    },
    {
      type: 'collapsible',
      label: 'Case study (featured project)',
      admin: {
        initCollapsed: true,
      },
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
  ],
}
