/**
 * Reusable SEO group — used by posts, pages, projects and categories.
 *
 * Every value here is read by lib/seo.js and turned into real <head> tags, so
 * the fields change the generated HTML instead of just sitting in the database.
 */
export const seoField = {
  type: 'group',
  name: 'seo',
  label: 'SEO & social sharing',
  admin: {
    description:
      'Optional. Leave a field empty and the frontend falls back to the page title, description and default share image.',
  },
  fields: [
    {
      type: 'ui',
      name: 'seoIndicator',
      label: false,
      admin: {
        components: {
          Field: '/components/admin/SeoIndicator#SeoIndicator',
        },
      },
    },
    {
      name: 'metaTitle',
      type: 'text',
      maxLength: 70,
      label: 'SEO title',
      admin: {
        description:
          'Browser tab and search-result title. Around 50–60 characters works best. Falls back to the page title.',
      },
    },
    {
      name: 'metaDescription',
      type: 'textarea',
      maxLength: 160,
      label: 'Meta description',
      admin: {
        description:
          'The two-line summary under the title in search results. Around 150–155 characters. Falls back to the page description.',
      },
    },
    {
      name: 'canonical',
      type: 'text',
      label: 'Canonical URL',
      admin: {
        description:
          'Only set this when the page duplicates another URL. Use a path (/about-us) or a full https:// URL. Leave empty for the normal page URL.',
      },
    },
    {
      name: 'ogImage',
      type: 'upload',
      relationTo: 'media',
      label: 'Social sharing image',
      admin: {
        description:
          'Shown when the page is shared on WhatsApp, LinkedIn or X. 1200×630 works best. Falls back to the page feature image or the StillLoud card.',
      },
    },
    {
      type: 'row',
      fields: [
        {
          name: 'noIndex',
          type: 'checkbox',
          defaultValue: false,
          label: 'Hide from search engines',
          admin: {
            width: '50%',
            description: 'Adds noindex. Use for legal or thank-you pages.',
          },
        },
        {
          name: 'noFollow',
          type: 'checkbox',
          defaultValue: false,
          label: 'Do not follow links',
          admin: {
            width: '50%',
            description: 'Adds nofollow. Rarely needed.',
          },
        },
      ],
    },
  ],
}

/** Compact SEO completeness summary for the admin UI. */
export function seoScore(seo) {
  if (!seo) return 0
  const checks = [seo.metaTitle, seo.metaDescription, seo.ogImage]
  return checks.filter(Boolean).length
}
