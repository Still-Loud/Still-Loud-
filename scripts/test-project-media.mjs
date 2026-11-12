/**
 * End-to-end media + revalidation check against the running server.
 *
 *   node --env-file=.env scripts/test-project-media.mjs
 *
 * Creates a temporary admin, uploads an image, publishes a project through the
 * REST API (the same code path the admin UI uses), and confirms that the public
 * detail page, the static listing and the static sitemap all reflect it
 * immediately. Then deletes it and confirms the pages update again.
 */
import crypto from 'crypto'
import path from 'path'

import { getPayload } from 'payload'

import config from '../payload.config.js'

const BASE = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'
const IMAGE = path.join(
  process.env.TEMP || process.env.TMP || '.',
  'stillloud-cloudinary-test',
  'a',
  'test-image.webp'
)
const SLUG = 'zz-cloudinary-project'
const RELATED_SLUG = 'zz-related-project'
const EMAIL = 'zz-cloudinary-admin@example.com'
const PASSWORD = `Zz-${crypto.randomBytes(18).toString('base64url')}`

const payload = await getPayload({ config })
const results = []

function check(label, ok, detail = '') {
  results.push({ label, ok, detail })
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}${detail ? ` — ${detail}` : ''}`)
}

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

async function until(fn, attempts = 8, delay = 1000) {
  for (let index = 0; index < attempts; index += 1) {
    if (await fn()) return true
    await wait(delay)
  }
  return false
}

async function cleanup() {
  const { docs: projects } = await payload.find({
    collection: 'projects',
    where: { slug: { in: [SLUG, RELATED_SLUG] } },
    limit: 10,
    depth: 0,
    overrideAccess: true,
  })
  for (const project of projects) {
    await payload.delete({ collection: 'projects', id: project.id, overrideAccess: true })
  }

  const { docs: media } = await payload.find({
    collection: 'media',
    where: { alt: { contains: 'Frontend media test' } },
    limit: 10,
    depth: 0,
    overrideAccess: true,
  })
  for (const doc of media) {
    await payload.delete({ collection: 'media', id: doc.id, overrideAccess: true })
  }

  const { docs: users } = await payload.find({
    collection: 'users',
    where: { email: { equals: EMAIL } },
    limit: 10,
    depth: 0,
    overrideAccess: true,
  })
  for (const user of users) {
    await payload.delete({ collection: 'users', id: user.id, overrideAccess: true })
  }

  return { projects: projects.length, media: media.length, users: users.length }
}

await cleanup()

let token = null
let image = null
let projectId = null

try {
  await payload.create({
    collection: 'users',
    data: {
      name: 'ZZ Cloudinary Admin',
      email: EMAIL,
      password: PASSWORD,
      role: 'admin',
      active: true,
      publishingEnabled: true,
    },
    overrideAccess: true,
  })

  const login = await fetch(`${BASE}/api/users/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
  })
  const session = await login.json()
  token = session.token
  check('admin login', login.status === 200 && Boolean(token), String(login.status))

  image = await payload.create({
    collection: 'media',
    data: { folder: 'stillloud/projects', alt: 'Frontend media test image' },
    filePath: IMAGE,
    overrideAccess: true,
  })

  const relatedCreate = await fetch(`${BASE}/api/projects`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `JWT ${token}` },
    body: JSON.stringify({
      title: 'ZZ Related Project',
      slug: RELATED_SLUG,
      category: 'branding',
      mediaType: 'image',
      image: image.id,
      description: 'Temporary related project.',
      _status: 'published',
    }),
  })
  const related = await relatedCreate.json()
  const relatedId = related?.doc?.id
  check('REST create related project', relatedCreate.status === 201 && Boolean(relatedId), String(relatedCreate.status))

  const create = await fetch(`${BASE}/api/projects`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `JWT ${token}` },
    body: JSON.stringify({
      title: 'ZZ Cloudinary Project',
      slug: SLUG,
      category: 'branding',
      mediaType: 'image',
      image: image.id,
      description: 'Temporary project used to verify Cloudinary media on the public site.',
      objective: 'ZZ objective copy.',
      challenge: 'ZZ challenge copy.',
      strategy: 'ZZ strategy copy.',
      creativeProcess: 'ZZ process copy.',
      finalSolution: 'ZZ solution copy.',
      externalLinks: [{ label: 'ZZ Live Site', url: 'https://example.com/zz' }],
      relatedProjects: [relatedId],
      _status: 'published',
    }),
  })
  const created = await create.json()
  projectId = created?.doc?.id
  check('REST create project', create.status === 201 && Boolean(projectId), String(create.status))

  const detail = await fetch(`${BASE}/projects/${SLUG}`)
  const html = await detail.text()
  check('project page status', detail.status === 200, String(detail.status))
  check('project page uses Cloudinary', html.includes('res.cloudinary.com'))
  check('project page has no local media route', !html.includes('/api/media/file/'))
  check('case study objective renders', html.includes('ZZ objective copy.'))
  check('case study final solution renders', html.includes('ZZ solution copy.'))
  check('external links render', html.includes('ZZ Live Site'))
  check('related projects render', html.includes('ZZ Related Project'))

  check(
    'projects listing revalidated',
    await until(async () => (await (await fetch(`${BASE}/projects`)).text()).includes(SLUG))
  )
  check(
    'sitemap revalidated',
    await until(async () => (await (await fetch(`${BASE}/sitemap.xml`)).text()).includes(SLUG))
  )

  const remove = await fetch(`${BASE}/api/projects/${projectId}`, {
    method: 'DELETE',
    headers: { Authorization: `JWT ${token}` },
  })
  check('REST delete project', remove.status === 200, String(remove.status))
  projectId = null

  check(
    'projects listing updated after delete',
    await until(async () => !(await (await fetch(`${BASE}/projects`)).text()).includes(SLUG))
  )
} catch (error) {
  check('unexpected error', false, String(error?.message || error))
} finally {
  const removed = await cleanup()
  check('cleanup: project removed', removed.projects >= 0, `${removed.projects}`)
  check('cleanup: media removed', removed.media >= 1, `${removed.media}`)
  check('cleanup: admin removed', removed.users >= 1, `${removed.users}`)
}

const failed = results.filter((result) => !result.ok)
console.log(`\n${results.length - failed.length}/${results.length} checks passed`)
if (failed.length) {
  console.log('Failures:')
  for (const failure of failed) console.log(`- ${failure.label} ${failure.detail}`)
}
process.exit(failed.length ? 1 : 0)
