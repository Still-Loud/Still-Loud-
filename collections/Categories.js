import { categoryPaths, revalidate } from '../lib/revalidate.js'
import { slugify } from '../lib/slugify.js'
import { isAdmin, isAdminOrEditor } from './access.js'
import { seoField } from './fields/seo.js'

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
    description: 'Blog categories. Each one gets a public page at /blog/category/<slug>.',
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
    afterChange: [
      async ({ doc, previousDoc }) => {
        await revalidate(categoryPaths(doc?.slug, previousDoc?.slug))
        return doc
      },
    ],
    afterDelete: [
      async ({ doc }) => {
        await revalidate(categoryPaths(doc?.slug))
        return doc
      },
    ],
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
      label: 'Name',
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
      maxLength: 300,
      label: 'Description',
      admin: {
        description: 'A sentence or two shown at the top of the category page.',
      },
    },
    seoField,
  ],
}
