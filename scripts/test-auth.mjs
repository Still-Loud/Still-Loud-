/**
 * Auth smoke test for the invitation-only CMS.
 *
 *   node --env-file=.env scripts/test-auth.mjs
 *
 * Uses the current invitation architecture: generating a link must not create
 * an account, accepting it must, and deactivated users must be refused. The
 * deeper invitation matrix lives in scripts/test-invitations.mjs.
 */
import crypto from 'crypto'

import { getPayload } from 'payload'

import config from '../payload.config.js'

const BASE = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'
const RUN = crypto.randomBytes(4).toString('hex')
const payload = await getPayload({ config })

const ADMIN_EMAIL = `zz-auth-admin-${RUN}@example.com`
const EDITOR_EMAIL = `zz-auth-editor-${RUN}@example.com`
const PASSWORD = `Zz-${crypto.randomBytes(18).toString('base64url')}`

async function cleanup() {
  for (const invitation of (await payload.find({
    collection: 'invitations',
    where: { email: { in: [ADMIN_EMAIL, EDITOR_EMAIL] } },
    limit: 20,
    depth: 0,
    overrideAccess: true,
  })).docs) {
    await payload.delete({ collection: 'invitations', id: invitation.id, overrideAccess: true })
  }

  const { docs } = await payload.find({
    collection: 'users',
    where: { email: { in: [ADMIN_EMAIL, EDITOR_EMAIL] } },
    limit: 10,
    depth: 0,
    overrideAccess: true,
  })
  for (const user of docs) {
    await payload.delete({ collection: 'users', id: user.id, overrideAccess: true })
  }
  return docs.length
}

async function json(response) {
  const text = await response.text()
  try {
    return JSON.parse(text)
  } catch {
    return { raw: text.slice(0, 200) }
  }
}

async function login(email, password) {
  const response = await fetch(`${BASE}/api/users/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  return { status: response.status, body: await json(response) }
}

await cleanup()

await payload.create({
  collection: 'users',
  data: {
    name: 'ZZ Auth Admin',
    email: ADMIN_EMAIL,
    password: PASSWORD,
    role: 'admin',
    active: true,
    publishingEnabled: true,
  },
  overrideAccess: true,
})

const adminLogin = await login(ADMIN_EMAIL, PASSWORD)
console.log(`admin login: ${adminLogin.status} token=${Boolean(adminLogin.body.token)} role=${adminLogin.body.user?.role}`)
const token = adminLogin.body.token

const anonymousInvite = await fetch(`${BASE}/api/invitations/generate`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ name: 'Anon', email: 'anon@example.com', role: 'editor' }),
})
console.log(`anonymous invite: ${anonymousInvite.status}`)

const invite = await fetch(`${BASE}/api/invitations/generate`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', Authorization: `JWT ${token}` },
  body: JSON.stringify({ name: 'ZZ Auth Editor', email: EDITOR_EMAIL, role: 'editor' }),
})
const inviteBody = await json(invite)
console.log(`admin invite: ${invite.status} url=${Boolean(inviteBody.url)}`)
const inviteToken = inviteBody.url ? new URL(inviteBody.url).searchParams.get('token') : null

const beforeAccept = await payload.find({
  collection: 'users',
  where: { email: { equals: EDITOR_EMAIL } },
  limit: 1,
  depth: 0,
  overrideAccess: true,
})
console.log(`user before acceptance: ${beforeAccept.docs.length} (expected 0)`)

const accept = await fetch(`${BASE}/api/invitations/accept`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    token: inviteToken,
    name: 'ZZ Auth Editor',
    password: PASSWORD,
    confirmPassword: PASSWORD,
  }),
})
console.log(`accept invitation: ${accept.status}`)

const invited = await payload.find({
  collection: 'users',
  where: { email: { equals: EDITOR_EMAIL } },
  limit: 1,
  depth: 0,
  overrideAccess: true,
})
console.log(
  `user after acceptance: ${invited.docs.length} role=${invited.docs[0]?.role} active=${invited.docs[0]?.active}`
)
if (invited.docs[0]) {
  await payload.update({
    collection: 'users',
    id: invited.docs[0].id,
    data: { active: false },
    overrideAccess: true,
  })
}

const blockedLogin = await login(EDITOR_EMAIL, PASSWORD)
console.log(`deactivated login: ${blockedLogin.status} (expected 403)`)

const removed = await cleanup()
console.log(`cleanup: removed ${removed} test users`)
process.exit(0)
