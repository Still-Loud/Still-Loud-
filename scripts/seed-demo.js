/**
 * Temporary verification content for the blog article route.
 *   node --env-file=.env scripts/seed-demo.js          -> create
 *   node --env-file=.env scripts/seed-demo.js --clean   -> delete
 */
import { getPayload } from 'payload'

import config from '../payload.config.js'

const SLUG = 'demo-branding-notes'
const CATEGORY_SLUG = 'branding-notes'

const text = (value) => ({
  type: 'text',
  text: value,
  detail: 0,
  format: 0,
  mode: 'normal',
  style: '',
  version: 1,
})

const paragraph = (value) => ({
  type: 'paragraph',
  version: 1,
  format: '',
  indent: 0,
  direction: 'ltr',
  textFormat: 0,
  children: [text(value)],
})

const heading = (tag, value) => ({
  type: 'heading',
  tag,
  version: 1,
  format: '',
  indent: 0,
  direction: 'ltr',
  children: [text(value)],
})

const list = (items) => ({
  type: 'list',
  listType: 'bullet',
  tag: 'ul',
  version: 1,
  format: '',
  indent: 0,
  direction: 'ltr',
  start: 1,
  children: items.map((item, index) => ({
    type: 'listitem',
    value: index + 1,
    version: 1,
    format: '',
    indent: 0,
    direction: 'ltr',
    children: [text(item)],
  })),
})

const payload = await getPayload({ config })

if (process.argv.includes('--clean')) {
  const { docs: posts } = await payload.find({
    collection: 'posts',
    where: { slug: { equals: SLUG } },
    limit: 10,
    overrideAccess: true,
  })
  for (const post of posts) {
    await payload.delete({ collection: 'posts', id: post.id, overrideAccess: true })
    console.log('deleted post', post.id)
  }
  const { docs: categories } = await payload.find({
    collection: 'categories',
    where: { slug: { equals: CATEGORY_SLUG } },
    limit: 10,
    overrideAccess: true,
  })
  for (const category of categories) {
    await payload.delete({ collection: 'categories', id: category.id, overrideAccess: true })
    console.log('deleted category', category.id)
  }
  process.exit(0)
}

const { docs: existing } = await payload.find({
  collection: 'categories',
  where: { slug: { equals: CATEGORY_SLUG } },
  limit: 1,
  overrideAccess: true,
})

const category =
  existing[0] ||
  (await payload.create({
    collection: 'categories',
    overrideAccess: true,
    data: {
      title: 'Branding Notes',
      slug: CATEGORY_SLUG,
      description: 'Temporary verification category.',
    },
  }))

const { docs: existingPosts } = await payload.find({
  collection: 'posts',
  where: { slug: { equals: SLUG } },
  limit: 1,
  overrideAccess: true,
})

const data = {
  title: 'Why distinctive branding beats a pretty logo',
  slug: SLUG,
  excerpt:
    'A logo is one asset. A brand is the system around it — the words, colours and rules that make every post feel like you.',
  _status: 'published',
  publishedAt: new Date().toISOString(),
  readingTime: 4,
  categories: [category.id],
  content: {
    root: {
      type: 'root',
      version: 1,
      format: '',
      indent: 0,
      direction: 'ltr',
      children: [
        paragraph(
          'Most small businesses start with a logo. It is the visible artefact, the thing you can point at. But the brands that stick are built on a system, not a single mark.'
        ),
        heading('h2', 'A brand is a set of decisions'),
        paragraph(
          'Colour, type, tone of voice, composition, the way you answer a comment — every one of those is a decision. Make them once, deliberately, and the work gets faster and more consistent.'
        ),
        list([
          'A logo that still reads at 16 pixels',
          'Two typefaces, used with discipline',
          'A colour palette with one job per colour',
          'Templates that make “on brand” the easy option',
        ]),
        heading('h2', 'Distinctive beats decorative'),
        paragraph(
          'Decorative design looks good in a portfolio. Distinctive design is recognised in a feed. Recognition is what buys you the second look, and the second look is what turns into an enquiry.'
        ),
        paragraph(
          'If you want to talk through your own brand system, book a free 30-minute call. We will tell you honestly what is working and what is not.'
        ),
      ],
    },
  },
}

if (existingPosts[0]) {
  const updated = await payload.update({
    collection: 'posts',
    id: existingPosts[0].id,
    overrideAccess: true,
    data,
  })
  console.log('updated post', updated.id, updated.slug)
} else {
  const created = await payload.create({ collection: 'posts', overrideAccess: true, data })
  console.log('created post', created.id, created.slug)
}

process.exit(0)
