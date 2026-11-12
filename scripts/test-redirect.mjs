import { getPayload } from 'payload'

import config from '../payload.config.js'

const payload = await getPayload({ config })

const existing = await payload.find({
  collection: 'redirects',
  where: { from: { in: ['/zz-old-page', '/zz-temp-page'] } },
  limit: 10,
  depth: 0,
  overrideAccess: true,
})
for (const doc of existing.docs) {
  await payload.delete({ collection: 'redirects', id: doc.id, overrideAccess: true })
}

if (process.argv.includes('--clean')) {
  console.log(`removed ${existing.docs.length} test redirect(s)`)
  process.exit(0)
}

const permanent = await payload.create({
  collection: 'redirects',
  data: { from: '/zz-old-page', to: '/our-work', type: '301', enabled: true },
  overrideAccess: true,
})
const temporary = await payload.create({
  collection: 'redirects',
  data: { from: '/zz-temp-page', to: '/projects', type: '302', enabled: true },
  overrideAccess: true,
})

console.log(JSON.stringify({ permanent: permanent.id, temporary: temporary.id }))
process.exit(0)
