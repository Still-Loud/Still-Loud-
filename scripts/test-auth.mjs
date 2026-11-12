/**
 * Exercises invitation-only auth end to end.
 *
 *   node --env-file=.env scripts/test-auth.mjs
 *
 * Creates temporary users, checks the invite endpoint, the admin invite screen
 * and the deactivated-login guard, then removes the temporary users.
 */
import crypto from 'crypto'

import { getPayload } from 'payload'

import config from '../payload.config.js'

const BASE = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'
const payload = await getPayload({ config })

const ADMIN_EMAIL = 'zz-test-admin@example.com'
const EDITOR_EMAIL = 'zz-test-editor@example.com'
const LOCKED_EMAIL = 'zz-test-locked@example.com'
const PASSWORD = `Zz-${crypto.randomBytes(18).toString('base64url')}`

async function cleanup() {
  const { docs } = await payload.find({
    collection: 'users',
    where: { email: { in: [ADMIN_EMAIL, EDITOR_EMAIL, LOCKED_EMAIL] } },
    limit: 10,
    depth: 0,
    overrideAccess: true,
  })
  for (const user of docs) {
    await payload.delete({ collection: 'users', id: user.id, overrideAccess: true })
  }
  return docs.length
}

await cleanup()

const admin = await payload.create({
  collection: 'users',
  data: {
    name: 'ZZ Test Admin',
    email: ADMIN_EMAIL,
    password: PASSWORD,
    role: 'admin',
    active: true,
    publishingEnabled: true,
  },
  overrideAccess: true,
})

const locked = await payload.create({
  collection: 'users',
  data: {
    name: 'ZZ Test Locked',
    email: LOCKED_EMAIL,
    password: PASSWORD,
    role: 'editor',
    active: false,
  },
  overrideAccess: true,
})

async function json(response) {
  const text = await response.text()
  try {
    return JSON.parse(text)
  } catch {
    return { raw: text.slice(0, 200) }
  }
}

const login = await fetch(`${BASE}/api/users/login`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: ADMIN_EMAIL, password: PASSWORD }),
})
const loginBody = await json(login)
const token = loginBody.token
console.log(`admin login: ${login.status} token=${Boolean(token)} role=${loginBody.user?.role}`)

const anonymousInvite = await fetch(`${BASE}/api/users/invite`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ name: 'Anon', email: 'anon@example.com', role: 'editor' }),
})
console.log(`anonymous invite: ${anonymousInvite.status}`)

const invite = await fetch(`${BASE}/api/users/invite`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', Authorization: `JWT ${token}` },
  body: JSON.stringify({ name: 'ZZ Test Editor', email: EDITOR_EMAIL, role: 'editor' }),
})
console.log(`admin invite: ${invite.status} ${JSON.stringify(await json(invite))}`)

const adminScreen = await fetch(`${BASE}/admin/invite`, {
  headers: { Cookie: `payload-token=${token}` },
  redirect: 'manual',
})
console.log(`/admin/invite: ${adminScreen.status}`)

const invited = await payload.find({
  collection: 'users',
  where: { email: { equals: EDITOR_EMAIL } },
  limit: 1,
  depth: 0,
  overrideAccess: true,
})
console.log(
  `invited user: ${invited.docs.length} role=${invited.docs[0]?.role} active=${invited.docs[0]?.active}`
)

const lockedLogin = await fetch(`${BASE}/api/users/login`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: LOCKED_EMAIL, password: PASSWORD }),
})
console.log(`deactivated login: ${lockedLogin.status} ${JSON.stringify(await json(lockedLogin))}`)

const removed = await cleanup()
console.log(`cleanup: removed ${removed} test users (admin id ${admin.id}, locked id ${locked.id})`)
process.exit(0)
