/** Reusable SEO field group — used by Posts and Pages. */
export const seoField = {
  type: 'group',
  name: 'seo',
  label: 'SEO',
  fields: [
    {
      name: 'metaTitle',
      type: 'text',
      maxLength: 70,
      admin: {
        description: 'Overrides the document title. Keep it under ~60 characters.',
      },
    },
    {
      name: 'metaDescription',
      type: 'textarea',
      maxLength: 160,
      admin: {
        description: 'Search-result description. Keep it under ~155 characters.',
      },
    },
    {
      name: 'ogImage',
      type: 'upload',
      relationTo: 'media',
      admin: {
        description: 'Social sharing image (1200×630 recommended).',
      },
    },
    {
      name: 'noIndex',
      type: 'checkbox',
      defaultValue: false,
      label: 'Hide from search engines',
    },
  ],
}
