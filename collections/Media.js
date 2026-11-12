import path from 'path'
import { fileURLToPath } from 'url'

import { mediaPosterUrl } from '../lib/cloudinaryAdapter.js'
import { isAdmin, isAdminOrEditor } from './access.js'

const dirname = path.dirname(fileURLToPath(import.meta.url))

/**
 * Images and videos used anywhere on the site.
 *
 * Production: uploaded to Cloudinary under stillloud/<section>/ (see
 * lib/cloudinaryAdapter.js). The adapter is enabled in payload.config.js when
 * the three CLOUDINARY_* variables exist; without them uploads stay on local
 * disk in public/media so `npm run dev` works with no cloud account.
 *
 * Videos are stored as Cloudinary `video` assets; Payload keeps their metadata
 * (duration, dimensions, format, size) on the document.
 */
/** @type {import('payload').CollectionConfig} */
export const Media = {
  slug: 'media',
  labels: {
    singular: 'Media',
    plural: 'Media Library',
  },
  admin: {
    group: 'Content',
    useAsTitle: 'filename',
    defaultColumns: ['filename', 'folder', 'alt', 'mimeType', 'filesize', 'updatedAt'],
    description: 'Images and videos. Upload once, reuse in projects, posts and pages.',
  },
  access: {
    read: () => true,
    create: isAdminOrEditor,
    update: isAdminOrEditor,
    delete: isAdmin,
  },
  upload: {
    staticDir: path.resolve(dirname, '../public/media'),
    mimeTypes: ['image/*', 'video/*'],
    adminThumbnail: ({ doc }) => {
      if (!doc) return undefined
      if (doc.mimeType?.startsWith('video/')) {
        return mediaPosterUrl(doc) || undefined
      }
      return doc.sizes?.thumbnail?.url || doc.cloudinaryUrl || doc.url || undefined
    },
    imageSizes: [
      {
        name: 'thumbnail',
        width: 400,
        height: undefined,
        position: 'centre',
      },
      {
        name: 'card',
        width: 800,
        height: undefined,
        position: 'centre',
      },
      {
        name: 'hero',
        width: 1600,
        height: undefined,
        position: 'centre',
      },
    ],
  },
  fields: [
    {
      name: 'folder',
      type: 'select',
      required: true,
      defaultValue: 'stillloud/pages',
      label: 'Cloudinary folder',
      options: [
        { label: 'Projects', value: 'stillloud/projects' },
        { label: 'Testimonials', value: 'stillloud/testimonials' },
        { label: 'Blog', value: 'stillloud/blogs' },
        { label: 'Homepage', value: 'stillloud/homepage' },
        { label: 'Pages', value: 'stillloud/pages' },
      ],
      admin: {
        position: 'sidebar',
        description: 'Where the file is stored in Cloudinary. Pick the section it belongs to.',
      },
    },
    {
      name: 'alt',
      type: 'text',
      admin: {
        description:
          'Describe images for screen readers and search engines. Required for informative images; leave empty for decorative ones.',
      },
    },
    {
      name: 'caption',
      type: 'text',
      admin: {
        description: 'Optional caption shown under the media when supported.',
      },
    },
    {
      name: 'credit',
      type: 'text',
      admin: {
        description: 'Photographer or source, if attribution is required.',
      },
    },
    {
      name: 'preview',
      type: 'ui',
      admin: {
        components: {
          Field: '/components/admin/MediaPreview#MediaPreview',
        },
      },
    },
    {
      type: 'collapsible',
      label: 'Cloudinary details',
      admin: {
        initCollapsed: true,
        description: 'Filled automatically after upload. Read-only.',
      },
      fields: [
        {
          name: 'cloudinaryPublicId',
          type: 'text',
          admin: { readOnly: true, description: 'Public ID used for transforms and deletion.' },
        },
        {
          name: 'cloudinaryUrl',
          type: 'text',
          admin: { readOnly: true, description: 'Secure delivery URL returned by Cloudinary.' },
        },
        {
          type: 'row',
          fields: [
            {
              name: 'resourceType',
              type: 'text',
              admin: { readOnly: true, width: '50%' },
            },
            {
              name: 'format',
              type: 'text',
              admin: { readOnly: true, width: '50%' },
            },
          ],
        },
        {
          type: 'row',
          fields: [
            { name: 'width', type: 'number', admin: { readOnly: true, width: '33%' } },
            { name: 'height', type: 'number', admin: { readOnly: true, width: '33%' } },
            {
              name: 'duration',
              type: 'number',
              admin: { readOnly: true, width: '33%', description: 'Seconds (video only).' },
            },
          ],
        },
        {
          name: 'bytes',
          type: 'number',
          admin: { readOnly: true, description: 'File size in bytes.' },
        },
      ],
    },
  ],
}
