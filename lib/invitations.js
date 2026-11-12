import crypto from 'crypto'

/**
 * Invitation tokens.
 *
 * The raw token is returned to the administrator exactly once and is never
 * stored. Only its SHA-256 digest is written to PostgreSQL, so a database leak
 * cannot be replayed against /accept-invite. Tokens are 256-bit random values,
 * which is why a plain hash (no salt/stretching) is sufficient.
 */
export const INVITATION_STATUS = {
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  REVOKED: 'revoked',
}

const TOKEN_BYTES = 32
const MIN_TOKEN_LENGTH = 20
const MAX_TOKEN_LENGTH = 200

export function normalizeEmail(value) {
  return String(value || '').trim().toLowerCase()
}

export function isValidEmail(value) {
  const email = normalizeEmail(value)
  return email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export function generateInvitationToken() {
  return crypto.randomBytes(TOKEN_BYTES).toString('base64url')
}

export function hashInvitationToken(token) {
  return crypto.createHash('sha256').update(String(token)).digest('hex')
}

/** Absolute link based on the real public domain (local domain in development). */
export function invitationUrl(token) {
  const base = (process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000').replace(/\/+$/, '')
  return `${base}/accept-invite?token=${encodeURIComponent(token)}`
}

export function isInvitationExpired(invitation, now = Date.now()) {
  if (!invitation?.expiresAt) return true
  return new Date(invitation.expiresAt).getTime() <= now
}

/** Effective state for the UI (expiry is derived, never stored). */
export function invitationState(invitation) {
  if (!invitation) return 'invalid'
  if (invitation.status === INVITATION_STATUS.ACCEPTED) return 'accepted'
  if (invitation.status === INVITATION_STATUS.REVOKED) return 'revoked'
  if (isInvitationExpired(invitation)) return 'expired'
  return INVITATION_STATUS.PENDING
}

export async function findInvitationByToken(payload, token) {
  if (typeof token !== 'string') return null
  const value = token.trim()
  if (value.length < MIN_TOKEN_LENGTH || value.length > MAX_TOKEN_LENGTH) return null

  const { docs } = await payload.find({
    collection: 'invitations',
    where: { tokenHash: { equals: hashInvitationToken(value) } },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  })

  return docs[0] || null
}

/** Shared password rules. Returns an error message or null. */
export function passwordProblem(password) {
  if (typeof password !== 'string') return 'Enter a password.'
  if (password.length < 8) return 'Use at least 8 characters for the password.'
  if (password.length > 200) return 'That password is too long.'
  return null
}

/** Human-readable reason an invitation cannot be accepted. */
export function invitationProblem(invitation) {
  const state = invitationState(invitation)
  if (state === 'invalid') return 'This invitation link is not valid.'
  if (state === 'accepted') return 'This invitation has already been used. Sign in instead.'
  if (state === 'revoked') return 'This invitation was revoked. Ask an administrator for a new link.'
  if (state === 'expired') return 'This invitation has expired. Ask an administrator for a new link.'
  return null
}
