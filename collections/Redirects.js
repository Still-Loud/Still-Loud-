import { isAdmin } from './access.js'

/**
 * Editable redirects for legacy URLs. Applied by middleware.js so
 * /old-page → /new-page keeps SEO equity with a real 301.
 */
/** @type {import('payload').CollectionConfig} */
export const Redirects = {
  slug: 'redirects',
  labels: {
    singular: 'Redirect',
    plural: 'Redirects',
  },
  admin: {
    group: 'Settings',
    useAsTitle: 'from',
    defaultColumns: ['from', 'to', 'type', 'enabled', 'updatedAt'],
  },
  access: {
    read: () => true,
    create: isAdmin,
    update: isAdmin,
    delete: isAdmin,
  },
  fields: [
    {
      name: 'from',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      admin: {
        description: 'Path only, starting with a slash — e.g. /old-work.html',
      },
    },
    {
      name: 'to',
      type: 'text',
      required: true,
      admin: {
        description: 'Absolute path or full URL — e.g. /our-work',
      },
    },
    {
      name: 'type',
      type: 'select',
      required: true,
      defaultValue: '301',
      options: [
        { label: '301 — Permanent', value: '301' },
        { label: '302 — Temporary', value: '302' },
      ],
    },
    {
      name: 'enabled',
      type: 'checkbox',
      defaultValue: true,
      admin: {
        position: 'sidebar',
      },
    },
  ],
}
