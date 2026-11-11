import { slugify } from '../lib/slugify.js'
import { isAdmin, isAdminOrEditor } from './access.js'

/** @type {import('payload').CollectionConfig} */
export const Categories = {
  slug: 'categories',
  labels: {
    singular: 'Category',
    plural: 'Categories',
  },
  admin: {
    group: 'Blog',
    useAsTitle: 'title',
    defaultColumns: ['title', 'slug', 'updatedAt'],
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
        description: 'Used in the URL: /blog/category/<slug>',
      },
    },
    {
      name: 'description',
      type: 'textarea',
      maxLength: 200,
    },
  ],
}
