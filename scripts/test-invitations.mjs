/**
 * End-to-end invitation and session tests against the running server.
 *
 *   node --env-file=.env scripts/test-invitations.mjs
 *
 * Creates real users and invitations, then removes everything it created.
 * Never prints a token, a password or an invitation URL.
 */
import crypto from 'crypto'
import { getPayload } from 'payload'

import config from '../payload.config.js'

const BASE = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'
const RUN = crypto.randomBytes(4).toString('hex')
const PASSWORD = `Zz-${crypto.randomBytes(15).toString('base64url')}`

const adminEmail = `zz-invite-admin-${RUN}@example.com`
const editorEmail = `zz-invite-editor-${RUN}@example.com`
const lockEmail = `zz-invite-lock-${RUN}@example.com`

const payload = await getPayload({ config })
const results = []
const userIds = []
const invitationIds = []

function check(label, ok, detail = '') {
  results.push({ label, ok, detail })
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}${detail ? ` — ${detail}` : ''}`)
}

async function api(path, { method = 'GET', token, body } = {}) {
  const response = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `JWT ${token}` } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  })
  const raw = await response.text()
  let data = {}
  try {
    data = raw ? JSON.parse(raw) : {}
  } catch {
    data = { raw }
  }
  return { status: response.status, data, headers: response.headers }
}

async function login(email, password) {
  const response = await api('/api/users/login', { method: 'POST', body: { email, password } })
  return { ...response, token: response.data?.token }
}

async function makeUser({ email, role = 'admin' }) {
  const user = await payload.create({
    collection: 'users',
    data: {
      name: `ZZ ${role} ${RUN}`,
      email,
      password: PASSWORD,
      role,
      active: true,
      publishingEnabled: role === 'admin',
    },
    overrideAccess: true,
  })
  userIds.push(user.id)
  return user
}

async function generateInvitation(token, email, body = {}) {
  const response = await api('/api/invitations/generate', {
    method: 'POST',
    token,
    body: { email, role: 'editor', expiresInHours: 24, ...body },
  })
  if (response.data?.invitation?.id) invitationIds.push(response.data.invitation.id)
  return response
}

async function acceptInvitation(token, body = {}) {
  return api('/api/invitations/accept', {
    method: 'POST',
    body: { token, name: `ZZ Invited ${RUN}`, password: PASSWORD, confirmPassword: PASSWORD, ...body },
  })
}

function tokenFrom(url) {
  try {
    return new URL(url).searchParams.get('token')
  } catch {
    return null
  }
}

async function cleanup() {
  for (const id of invitationIds) {
    await payload
      .delete({ collection: 'invitations', id, overrideAccess: true })
      .catch(() => null)
  }
  for (const id of userIds) {
    await payload.delete({ collection: 'users', id, overrideAccess: true }).catch(() => null)
  }
  /* Catch anything left by a failed earlier run. */
  for (const user of (await payload.find({
    collection: 'users',
    where: { email: { in: [adminEmail, editorEmail, lockEmail] } },
    limit: 10,
    overrideAccess: true,
  })).docs) {
    await payload.delete({ collection: 'users', id: user.id, overrideAccess: true }).catch(() => null)
  }
  for (const invitation of (await payload.find({
    collection: 'invitations',
    where: { email: { in: [adminEmail, editorEmail, lockEmail] } },
    limit: 50,
    overrideAccess: true,
  })).docs) {
    await payload.delete({ collection: 'invitations', id: invitation.id, overrideAccess: true }).catch(() => null)
  }
}

await cleanup()

try {
  await makeUser({ email: adminEmail, role: 'admin' })

  /* Public registration must not exist. */
  const register = await api('/api/users', {
    method: 'POST',
    body: { name: 'Public', email: `zz-public-${RUN}@example.com`, password: PASSWORD },
  })
  check('public registration rejected', register.status === 403 || register.status === 401, String(register.status))

  /* Bad password. */
  const badLogin = await login(adminEmail, 'definitely-not-the-password')
  check('invalid credentials rejected', badLogin.status === 401, String(badLogin.status))
  check('invalid login returns no token', !badLogin.token)

  /* Admin login + cookie flags. */
  const adminLogin = await login(adminEmail, PASSWORD)
  check('admin login works', adminLogin.status === 200 && Boolean(adminLogin.token), String(adminLogin.status))
  const adminToken = adminLogin.token
  const cookies = adminLogin.headers.get('set-cookie') || ''
  check('auth cookie is HttpOnly', /httponly/i.test(cookies))
  check('auth cookie is SameSite', /samesite=/i.test(cookies))
  check('auth cookie is Secure in production', /secure/i.test(cookies))

  /* Invitation validation errors. */
  const invalidEmail = await generateInvitation(adminToken, 'not-an-email')
  check('invalid invitation email rejected', invalidEmail.status === 400, String(invalidEmail.status))

  const existing = await generateInvitation(adminToken, adminEmail)
  check('invitation for existing user rejected', existing.status === 409, String(existing.status))

  const created = await generateInvitation(adminToken, editorEmail, { role: 'editor' })
  const invitation = created.data?.invitation
  const inviteUrl = created.data?.url
  const inviteToken = tokenFrom(inviteUrl)

  check('admin creates invitation', created.status === 200 && Boolean(invitation?.id), String(created.status))
  check('invitation response has copyable URL', Boolean(inviteToken), inviteUrl ? 'url present' : 'missing')
  check('invitation response hides token hash', !('tokenHash' in (invitation || {})))
  check('invitation role is editor', invitation?.role === 'editor', invitation?.role)

  const expiryHours = (new Date(invitation?.expiresAt).getTime() - Date.now()) / (60 * 60 * 1000)
  check('default expiry is 24 hours', expiryHours > 23.5 && expiryHours <= 24.1, `${expiryHours.toFixed(2)}h`)

  const list = await api('/api/invitations?limit=50&depth=0', { token: adminToken })
  const listed = (list.data?.docs || []).find((doc) => doc.id === invitation?.id)
  check('admin can list invitations', list.status === 200 && Boolean(listed), String(list.status))
  check('list response hides token hash', !('tokenHash' in (listed || {})))

  /* Invitation page validates server-side. */
  const page = await fetch(`${BASE}/accept-invite?token=${encodeURIComponent(inviteToken || 'missing')}`)
  const html = await page.text()
  check('invitation URL opens', page.status === 200, String(page.status))
  check('invitation page shows intended email', html.includes(editorEmail))
  check('invitation page shows the form', html.includes('Accept your invitation'))

  const validate = await api('/api/invitations/validate', {
    method: 'POST',
    body: { token: inviteToken },
  })
  check('valid token validates', validate.status === 200 && validate.data?.valid === true, String(validate.status))

  /* The request body must never be able to choose a role. */
  const accepted = await acceptInvitation(inviteToken, { role: 'admin' })
  check('valid invitation activates account', accepted.status === 200 && Boolean(accepted.data?.email), String(accepted.status))

  const invitedUser = (await payload.find({
    collection: 'users',
    where: { email: { equals: editorEmail } },
    limit: 1,
    overrideAccess: true,
  })).docs[0]
  if (invitedUser) userIds.push(invitedUser.id)
  check('account gets the invitation role', invitedUser?.role === 'editor', invitedUser?.role)
  check('request body cannot escalate role', invitedUser?.role !== 'admin', invitedUser?.role)

  const editorLogin = await login(editorEmail, PASSWORD)
  check('invited user can sign in', editorLogin.status === 200 && Boolean(editorLogin.token), String(editorLogin.status))
  const editorToken = editorLogin.token

  /* Consumed token. */
  const reused = await acceptInvitation(inviteToken)
  check('reused invitation rejected', reused.status === 409, String(reused.status))
  const reusedValidate = await api('/api/invitations/validate', {
    method: 'POST',
    body: { token: inviteToken },
  })
  check('reused token no longer validates', reusedValidate.status === 400, String(reusedValidate.status))

  /* Editor boundaries. */
  const editorInvite = await generateInvitation(editorToken, `zz-nope-${RUN}@example.com`)
  check('editor cannot invite users', editorInvite.status === 403, String(editorInvite.status))

  const editorList = await api('/api/invitations', { token: editorToken })
  check('editor cannot read invitations', editorList.status === 403, String(editorList.status))

  const roleChange = await api(`/api/users/${invitedUser.id}`, {
    method: 'PATCH',
    token: editorToken,
    body: { role: 'admin', active: false, publishingEnabled: true },
  })
  const afterRoleAttempt = (await payload.findByID({
    collection: 'users',
    id: invitedUser.id,
    depth: 0,
    overrideAccess: true,
  }))
  check(
    'editor cannot change own role',
    afterRoleAttempt.role === 'editor',
    `${roleChange.status} / ${afterRoleAttempt.role}`
  )
  check('editor cannot enable own publishing', afterRoleAttempt.publishingEnabled !== true)
  check('editor cannot disable own account', afterRoleAttempt.active !== false)

  /* Expired invitation. */
  const expiring = await generateInvitation(adminToken, `zz-expired-${RUN}@example.com`)
  const expiredId = expiring.data?.invitation?.id
  const expiredToken = tokenFrom(expiring.data?.url)
  await payload.update({
    collection: 'invitations',
    id: expiredId,
    data: { expiresAt: new Date(Date.now() - 60_000).toISOString() },
    overrideAccess: true,
  })
  const expiredValidate = await api('/api/invitations/validate', {
    method: 'POST',
    body: { token: expiredToken },
  })
  const expiredAccept = await acceptInvitation(expiredToken)
  check('expired invitation rejected', expiredAccept.status === 409, String(expiredAccept.status))
  check('expired state reported', expiredValidate.data?.state === 'expired', expiredValidate.data?.state)

  /* Revoked invitation. */
  const revokable = await generateInvitation(adminToken, `zz-revoked-${RUN}@example.com`)
  const revokedId = revokable.data?.invitation?.id
  const revokedToken = tokenFrom(revokable.data?.url)
  const revoke = await api('/api/invitations/revoke', {
    method: 'POST',
    token: adminToken,
    body: { id: revokedId },
  })
  check('admin revokes invitation', revoke.status === 200, String(revoke.status))
  const revokedValidate = await api('/api/invitations/validate', {
    method: 'POST',
    body: { token: revokedToken },
  })
  const revokedAccept = await acceptInvitation(revokedToken)
  check('revoked invitation rejected', revokedAccept.status === 409, String(revokedAccept.status))
  check('revoked state reported', revokedValidate.data?.state === 'revoked', revokedValidate.data?.state)

  /* Replacement links. */
  const resendable = await generateInvitation(adminToken, `zz-resend-${RUN}@example.com`)
  const resendId = resendable.data?.invitation?.id
  const oldToken = tokenFrom(resendable.data?.url)
  const resent = await api('/api/invitations/resend', {
    method: 'POST',
    token: adminToken,
    body: { id: resendId },
  })
  const newToken = tokenFrom(resent.data?.url)
  const oldValidate = await api('/api/invitations/validate', {
    method: 'POST',
    body: { token: oldToken },
  })
  const newValidate = await api('/api/invitations/validate', {
    method: 'POST',
    body: { token: newToken },
  })
  check('admin resends invitation', resent.status === 200 && Boolean(newToken), String(resent.status))
  check('old link stops working', oldValidate.status === 400, String(oldValidate.status))
  check('replacement link works', newValidate.status === 200 && newValidate.data?.valid === true, String(newValidate.status))

  /* Disabled users cannot sign in, and existing sessions die. */
  const disable = await api(`/api/users/${invitedUser.id}`, {
    method: 'PATCH',
    token: adminToken,
    body: { active: false },
  })
  check('admin disables user', disable.status === 200 && disable.data?.doc?.active === false, String(disable.status))

  const disabledLogin = await login(editorEmail, PASSWORD)
  check('disabled user cannot sign in', disabledLogin.status === 403, String(disabledLogin.status))

  const staleSession = await api('/api/users/me', { token: editorToken })
  check(
    'disabled user session is revoked',
    staleSession.status === 401 || !staleSession.data?.user,
    `${staleSession.status} / ${staleSession.data?.user ? 'user' : 'no user'}`
  )

  /* Account lockout after repeated failures. Uses the local API so the
     per-IP HTTP throttle does not mask Payload's per-account lockout. */
  await makeUser({ email: lockEmail, role: 'editor' })
  const lockResults = []
  for (let attempt = 0; attempt < 6; attempt += 1) {
    try {
      await payload.login({ collection: 'users', data: { email: lockEmail, password: `wrong-${attempt}` } })
      lockResults.push('ok')
    } catch (lockError) {
      lockResults.push(lockError?.message || 'error')
    }
  }
  let lockedCorrect = ''
  try {
    await payload.login({ collection: 'users', data: { email: lockEmail, password: PASSWORD } })
    lockedCorrect = 'ok'
  } catch (lockError) {
    lockedCorrect = lockError?.message || 'error'
  }
  check(
    'repeated failures lock the account',
    /locked/i.test(lockResults[5] || '') && /locked/i.test(lockedCorrect),
    `${lockResults[5]} / ${lockedCorrect}`
  )

  /* Logout revokes the session token. */
  const logout = await api('/api/users/logout', { method: 'POST', token: adminToken })
  check('admin logout works', logout.status === 200, String(logout.status))
  const afterLogout = await api('/api/users/me', { token: adminToken })
  check(
    'logged-out token no longer authenticates',
    afterLogout.status === 401 || !afterLogout.data?.user,
    `${afterLogout.status} / ${afterLogout.data?.user ? 'user' : 'no user'}`
  )
} catch (error) {
  check('unexpected error', false, String(error?.message || error))
} finally {
  await cleanup()
}

const failed = results.filter((result) => !result.ok)
console.log(`\n${results.length - failed.length}/${results.length} checks passed`)
if (failed.length) {
  console.log('Failures:')
  for (const failure of failed) console.log(`- ${failure.label} ${failure.detail}`)
}
process.exit(failed.length ? 1 : 0)
