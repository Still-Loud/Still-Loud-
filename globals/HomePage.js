import { revalidate } from '../lib/revalidate.js'
import { isAdminOrEditor } from '../collections/access.js'
import { seoField } from '../collections/fields/seo.js'

/**
 * Content for the single-page homepage.
 *
 * The layout is fixed on purpose: each tab maps 1:1 to an existing section and
 * only supplies copy, media and visibility. There is no block builder here, so
 * an editor cannot change the design. Empty fields fall back to the copy in
 * components/.
 */
/** @type {import('payload').GlobalConfig} */
export const HomePage = {
  slug: 'home-page',
  label: 'Homepage',
  admin: {
    group: 'Content',
    description:
      'Copy, images and visibility for the homepage. Layout stays fixed; empty fields use the built-in defaults.',
    preview: () => '/api/preview?global=home-page',
  },
  versions: {
    drafts: true,
    maxPerDoc: 20,
  },
  access: {
    /* The homepage is public. Draft edits are stored as versions and are only
       returned when the query explicitly asks for `draft: true` (preview). */
    read: () => true,
    update: isAdminOrEditor,
  },
  hooks: {
    afterChange: [
      async ({ doc }) => {
        await revalidate(['/', '/sitemap.xml'])
        return doc
      },
    ],
  },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Sections',
          fields: [
            {
              name: 'sectionsNote',
              type: 'ui',
              admin: {
                components: {
                  Field: '/components/admin/SectionNote#SectionNote',
                },
              },
            },
            {
              type: 'row',
              fields: [
                { name: 'showHero', type: 'checkbox', defaultValue: true, admin: { width: '33%' } },
                { name: 'showAbout', type: 'checkbox', defaultValue: true, admin: { width: '33%' } },
                {
                  name: 'showServices',
                  type: 'checkbox',
                  defaultValue: true,
                  admin: { width: '33%' },
                },
              ],
            },
            {
              type: 'row',
              fields: [
                {
                  name: 'showPortfolio',
                  type: 'checkbox',
                  defaultValue: true,
                  admin: { width: '33%' },
                },
                {
                  name: 'showTestimonials',
                  type: 'checkbox',
                  defaultValue: true,
                  admin: { width: '33%' },
                },
                {
                  name: 'showPricing',
                  type: 'checkbox',
                  defaultValue: true,
                  admin: { width: '33%' },
                },
              ],
            },
            {
              name: 'showFooter',
              type: 'checkbox',
              defaultValue: true,
              label: 'Show contact / footer section',
            },
          ],
        },
        {
          label: 'Hero',
          fields: [
            {
              type: 'row',
              fields: [
                {
                  name: 'heroEyebrow',
                  type: 'text',
                  defaultValue: 'JOIN US',
                  admin: { width: '50%' },
                },
                {
                  name: 'heroEyebrowUrl',
                  type: 'text',
                  defaultValue: 'https://wa.me/8866119607',
                  admin: { width: '50%', description: 'Where the “Join us” pill links to.' },
                },
              ],
            },
            {
              name: 'heroHeadline',
              type: 'array',
              labels: { singular: 'Word', plural: 'Words' },
              fields: [
                { name: 'text', type: 'text', required: true },
                {
                  name: 'accent',
                  type: 'checkbox',
                  defaultValue: false,
                  label: 'Highlight in purple',
                },
              ],
              admin: {
                description: 'Rendered one word per line. Use four entries to match the design.',
              },
            },
            {
              type: 'row',
              fields: [
                {
                  name: 'heroPrimaryLabel',
                  type: 'text',
                  defaultValue: 'Portfolio',
                  admin: { width: '50%' },
                },
                {
                  name: 'heroPrimaryHref',
                  type: 'text',
                  defaultValue: '/our-work',
                  admin: { width: '50%' },
                },
              ],
            },
            {
              type: 'row',
              fields: [
                {
                  name: 'heroSecondaryLabel',
                  type: 'text',
                  defaultValue: 'Contact',
                  admin: { width: '50%' },
                },
                {
                  name: 'heroSecondaryHref',
                  type: 'text',
                  defaultValue: '#contact',
                  admin: { width: '50%' },
                },
              ],
            },
            { name: 'heroImage', type: 'upload', relationTo: 'media' },
          ],
        },
        {
          label: 'About',
          fields: [
            { name: 'aboutEyebrow', type: 'text', defaultValue: 'About StillLoud' },
            {
              name: 'aboutTitle',
              type: 'group',
              label: 'Heading',
              fields: [
                { name: 'lineOne', type: 'text' },
                { name: 'lineOneAccent', type: 'text' },
                { name: 'lineTwo', type: 'text' },
                { name: 'lineTwoAccent', type: 'text' },
              ],
            },
            { name: 'aboutDescription', type: 'textarea' },
            {
              name: 'aboutStats',
              type: 'array',
              maxRows: 4,
              fields: [
                { name: 'value', type: 'text', required: true },
                { name: 'label', type: 'text', required: true },
              ],
            },
            {
              name: 'aboutFeatures',
              type: 'array',
              maxRows: 4,
              fields: [
                {
                  name: 'icon',
                  type: 'text',
                  admin: { description: 'Font Awesome class, e.g. fa-solid fa-compass' },
                },
                { name: 'title', type: 'text', required: true },
                { name: 'text', type: 'textarea' },
              ],
            },
            {
              type: 'row',
              fields: [
                {
                  name: 'aboutImageOne',
                  type: 'upload',
                  relationTo: 'media',
                  admin: { width: '50%' },
                },
                {
                  name: 'aboutImageTwo',
                  type: 'upload',
                  relationTo: 'media',
                  admin: { width: '50%' },
                },
              ],
            },
          ],
        },
        {
          label: 'Services',
          fields: [
            { name: 'servicesEyebrow', type: 'text', defaultValue: 'Our Services' },
            {
              name: 'servicesTitle',
              type: 'group',
              label: 'Heading',
              fields: [
                { name: 'lineOne', type: 'text' },
                { name: 'lineOneAccent', type: 'text' },
                { name: 'lineTwo', type: 'text' },
                { name: 'lineTwoAccent', type: 'text' },
              ],
            },
            {
              name: 'servicePills',
              type: 'array',
              maxRows: 8,
              fields: [
                { name: 'label', type: 'text', required: true },
                {
                  name: 'icon',
                  type: 'text',
                  admin: { description: 'Font Awesome class, e.g. fa-solid fa-laptop-code' },
                },
              ],
            },
            {
              type: 'row',
              fields: [
                {
                  name: 'servicesDeliveredValue',
                  type: 'text',
                  defaultValue: '400+',
                  admin: { width: '50%' },
                },
                {
                  name: 'servicesDeliveredLabel',
                  type: 'text',
                  defaultValue: 'Projects Delivered',
                  admin: { width: '50%' },
                },
              ],
            },
            {
              name: 'servicesBullets',
              type: 'array',
              maxRows: 6,
              fields: [{ name: 'label', type: 'text', required: true }],
            },
            { name: 'servicesImage', type: 'upload', relationTo: 'media' },
          ],
        },
        {
          label: 'Portfolio',
          fields: [
            { name: 'portfolioEyebrow', type: 'text', defaultValue: 'Explore Our Work' },
            { name: 'portfolioSubtitle', type: 'textarea' },
            { name: 'portfolioFooterTitle', type: 'text' },
            {
              name: 'portfolioCards',
              type: 'array',
              maxRows: 2,
              fields: [
                { name: 'image', type: 'upload', relationTo: 'media' },
                { name: 'alt', type: 'text' },
              ],
              admin: {
                description: 'The two large cards on the home page teaser. Uses the built-in artwork when empty.',
              },
            },
          ],
        },
        {
          label: 'Reviews',
          fields: [
            {
              name: 'testimonialsTitle',
              type: 'text',
              defaultValue: 'Testimonials that speak to Our Results',
            },
            {
              name: 'testimonialsSubtitle',
              type: 'text',
              defaultValue: 'Hear from the brands we’ve transformed across every industry',
            },
            {
              name: 'testimonialsLimit',
              type: 'number',
              defaultValue: 6,
              min: 1,
              max: 12,
              admin: {
                description:
                  'How many published, featured testimonials to show. Manage them under Testimonials.',
              },
            },
          ],
        },
        {
          label: 'Pricing',
          fields: [
            { name: 'pricingEyebrow', type: 'text', defaultValue: 'Pricing Plans' },
            {
              name: 'pricingTitle',
              type: 'group',
              label: 'Heading',
              fields: [
                { name: 'lineOne', type: 'text' },
                { name: 'lineOneAccent', type: 'text' },
              ],
            },
            {
              name: 'pricingPlans',
              type: 'array',
              maxRows: 3,
              fields: [
                { name: 'image', type: 'upload', relationTo: 'media' },
                { name: 'alt', type: 'text' },
                {
                  name: 'featured',
                  type: 'checkbox',
                  defaultValue: false,
                  label: 'Highlight this plan',
                },
              ],
            },
          ],
        },
        {
          label: 'Contact & footer',
          fields: [
            {
              type: 'row',
              fields: [
                {
                  name: 'contactPhone',
                  type: 'text',
                  defaultValue: '+91 6351139179',
                  admin: { width: '50%' },
                },
                {
                  name: 'contactPhoneHref',
                  type: 'text',
                  defaultValue: 'tel:+916351139179',
                  admin: { width: '50%' },
                },
              ],
            },
            {
              type: 'row',
              fields: [
                {
                  name: 'contactEmail',
                  type: 'text',
                  defaultValue: 'team.stillloud@gmail.com',
                  admin: { width: '50%' },
                },
                {
                  name: 'whatsappHref',
                  type: 'text',
                  defaultValue: 'https://wa.me/6351139179',
                  admin: { width: '50%' },
                },
              ],
            },
            {
              type: 'row',
              fields: [
                {
                  name: 'instagramUrl',
                  type: 'text',
                  defaultValue: 'https://instagram.com/wearestillloud',
                  admin: { width: '33%' },
                },
                {
                  name: 'linkedinUrl',
                  type: 'text',
                  defaultValue: 'https://www.linkedin.com/company/stillloud/',
                  admin: { width: '33%' },
                },
                {
                  name: 'pinterestUrl',
                  type: 'text',
                  defaultValue: 'https://in.pinterest.com/wearestillloud/',
                  admin: { width: '33%' },
                },
              ],
            },
            {
              name: 'footerHeading',
              type: 'text',
              defaultValue: 'Let’s have a real chat.',
            },
            { name: 'footerBio', type: 'textarea' },
            {
              name: 'footerCopyright',
              type: 'text',
              defaultValue: '© 2026 StillLoud. All Rights Reserved.',
            },
          ],
        },
        {
          label: 'SEO',
          fields: [seoField],
        },
      ],
    },
  ],
}
