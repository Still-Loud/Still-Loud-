import { isAdmin, isAdminOrEditor } from './access.js'

/** Client testimonials shown in the home-page carousel. */
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
    defaultColumns: ['name', 'company', 'rating', 'featured', 'order'],
  },
  access: {
    read: () => true,
    create: isAdminOrEditor,
    update: isAdminOrEditor,
    delete: isAdmin,
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      label: 'Author name',
    },
    {
      name: 'company',
      type: 'text',
      required: true,
    },
    {
      name: 'role',
      type: 'text',
      admin: {
        description: 'Optional job title, e.g. “Founder”.',
      },
    },
    {
      name: 'quote',
      type: 'textarea',
      required: true,
      maxLength: 600,
    },
    {
      name: 'rating',
      type: 'number',
      min: 1,
      max: 5,
      defaultValue: 5,
    },
    {
      name: 'logo',
      type: 'upload',
      relationTo: 'media',
      admin: {
        description: 'Client logo shown on the card.',
      },
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
      defaultValue: true,
      admin: {
        position: 'sidebar',
      },
    },
  ],
}
