/**
 * Homepage global → frontend revalidation check.
 *
 *   node --env-file=.env scripts/test-homepage.mjs
 *
 * Changes one homepage field through the REST API (the same path the admin
 * uses), waits for `/` to show it, then restores the previous copy. Creates and
 * removes a temporary admin account.
 */
import crypto from 'crypto'

import { getPayload } from 'payload'

import config from '../payload.config.js'

const BASE = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'
const RUN = crypto.randomBytes(3).toString('hex')
const EMAIL = `zz-home-admin-${RUN}@example.com`
const PASSWORD = `Zz-${crypto.randomBytes(18).toString('base64url')}`
const VALUE = `ZZ Homepage ${RUN}`

const payload = await getPayload({ config })
const results = []

function check(label, ok, detail = '') {
  results.push({ label, ok, detail })
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}${detail ? ` — ${detail}` : ''}`)
}

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
async function until(fn, attempts = 10, delay = 1000) {
  for (let index = 0; index < attempts; index += 1) {
    if (await fn()) return true
    await wait(delay)
  }
  return false
}

async function cleanup() {
  const { docs } = await payload.find({
    collection: 'users',
    where: { email: { equals: EMAIL } },
    limit: 5,
    depth: 0,
    overrideAccess: true,
  })
  for (const user of docs) {
    await payload.delete({ collection: 'users', id: user.id, overrideAccess: true })
  }
}

await cleanup()

let token = null
let original = null

try {
  await payload.create({
    collection: 'users',
    data: {
      name: 'ZZ Homepage Admin',
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

  const global = await payload.findGlobal({ slug: 'home-page', depth: 0, overrideAccess: true })
  original = global?.heroEyebrow || 'JOIN US'

  const update = await fetch(`${BASE}/api/globals/home-page`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `JWT ${token}` },
    body: JSON.stringify({ heroEyebrow: VALUE, _status: 'published' }),
  })
  check('REST update homepage', update.status === 200, String(update.status))

  const shown = await until(async () => (await (await fetch(`${BASE}/`)).text()).includes(VALUE))
  check('homepage revalidated with new copy', shown)

  const restore = await fetch(`${BASE}/api/globals/home-page`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `JWT ${token}` },
    body: JSON.stringify({ heroEyebrow: original, _status: 'published' }),
  })
  check('REST restore homepage', restore.status === 200, String(restore.status))

  const restored = await until(
    async () => !(await (await fetch(`${BASE}/`)).text()).includes(VALUE)
  )
  check('homepage revalidated after restore', restored)
} catch (error) {
  check('unexpected error', false, String(error?.message || error))
} finally {
  if (token && original) {
    /* Best effort: leave the global exactly as it was even after a failure. */
    await fetch(`${BASE}/api/globals/home-page`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `JWT ${token}` },
      body: JSON.stringify({ heroEyebrow: original, _status: 'published' }),
    }).catch(() => null)
  }
  await cleanup()
}

const failed = results.filter((result) => !result.ok)
console.log(`\n${results.length - failed.length}/${results.length} checks passed`)
if (failed.length) {
  console.log('Failures:')
  for (const failure of failed) console.log(`- ${failure.label} ${failure.detail}`)
}
process.exit(failed.length ? 1 : 0)
