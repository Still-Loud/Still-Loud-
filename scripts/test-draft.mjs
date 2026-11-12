import { getPayload } from 'payload'

import config from '../payload.config.js'

const payload = await getPayload({ config })

const page = await payload.create({
  collection: 'pages',
  data: {
    title: 'ZZ Test Draft',
    slug: 'zz-test-draft',
    description: 'Temporary draft used to verify drafts stay private.',
    _status: 'draft',
  },
  overrideAccess: true,
})

const { totalDocs } = await payload.find({
  collection: 'pages',
  where: { slug: { equals: 'zz-test-draft' }, _status: { equals: 'published' } },
  limit: 1,
  depth: 0,
  overrideAccess: false,
})

console.log(JSON.stringify({ id: page.id, status: page._status, publicMatches: totalDocs }))
process.exit(0)
