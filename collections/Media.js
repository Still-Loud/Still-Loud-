import path from 'path'
import { fileURLToPath } from 'url'

import { isAdmin, isAdminOrEditor } from './access.js'

const dirname = path.dirname(fileURLToPath(import.meta.url))

/**
 * Images uploaded through the admin UI.
 *
 * Storage: local disk until a Vercel Blob token is configured. The blob plugin
 * is enabled conditionally in payload.config.js once BLOB_READ_WRITE_TOKEN is
 * present (D4); this staticDir is the dev fallback.
 *
 * Videos stay on Cloudinary — see the `videoUrl` fields on Projects.
 */
/** @type {import('payload').CollectionConfig} */
export const Media = {
  slug: 'media',
  labels: {
    singular: 'Media',
    plural: 'Media',
  },
  admin: {
    group: 'Content',
    useAsTitle: 'filename',
    defaultColumns: ['filename', 'alt', 'mimeType', 'filesize', 'updatedAt'],
  },
  access: {
    read: () => true,
    create: isAdminOrEditor,
    update: isAdminOrEditor,
    delete: isAdmin,
  },
  upload: {
    staticDir: path.resolve(dirname, '../public/media'),
    mimeTypes: ['image/*'],
    adminThumbnail: 'thumbnail',
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
      name: 'alt',
      type: 'text',
      required: true,
      admin: {
        description: 'Describe the image for screen readers and search engines.',
      },
    },
    {
      name: 'caption',
      type: 'text',
    },
    {
      name: 'credit',
      type: 'text',
      admin: {
        description: 'Photographer or source, if required.',
      },
    },
  ],
}
