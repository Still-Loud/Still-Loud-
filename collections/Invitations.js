import {
  INVITATION_STATUS,
  invitationProblem,
  invitationState,
  invitationUrl,
  findInvitationByToken,
  generateInvitationToken,
  hashInvitationToken,
  isValidEmail,
  normalizeEmail,
  passwordProblem,
} from '../lib/invitations.js'
import { sendInvitationEmail, sendWelcomeEmail } from '../lib/email.js'
import { clientIp, rateLimit, rateLimitResponse } from '../lib/rateLimit.js'
import { isAdmin } from './access.js'

/**
 * Invitation-only account creation.
 *
 * An invitation never creates an account. It stores a SHA-256 hash of a random
 * token plus the email and role the administrator pre-approved. The invited
 * person exchanges the token for an account at /accept-invite, and only then is
 * a Users document created — with the role from this record, never from the
 * request body.
 *
 * Raw tokens exist only in the response that creates/refreshes them. They are
 * never stored, returned by the REST API or written to logs.
 */

const DEFAULT_EXPIRY_HOURS = 24
const MAX_EXPIRY_HOURS = 24 * 30

function json(body, status = 200) {
  return Response.json(body, { status })
}

async function readBody(req) {
  try {
    return (await req.json()) || {}
  } catch {
    return null
  }
}

function expiryDate(hours) {
  const value = Number(hours)
  const safe = Number.isFinite(value)
    ? Math.min(Math.max(Math.round(value), 1), MAX_EXPIRY_HOURS)
    : DEFAULT_EXPIRY_HOURS
  return new Date(Date.now() + safe * 60 * 60 * 1000)
}

function hoursFrom(body) {
  return body?.expiresInHours ?? body?.expiryHours ?? DEFAULT_EXPIRY_HOURS
}

async function findUserByEmail(payload, email) {
  const { totalDocs } = await payload.count({
    collection: 'users',
    where: { email: { equals: email } },
    overrideAccess: true,
  })
  return totalDocs > 0
}

/** Invalidate any earlier pending link for the same address before issuing one. */
async function revokePendingForEmail(payload, email) {
  const { docs } = await payload.find({
    collection: 'invitations',
    where: {
      email: { equals: email },
      status: { equals: INVITATION_STATUS.PENDING },
    },
    limit: 50,
    depth: 0,
    overrideAccess: true,
  })

  for (const invitation of docs) {
    await payload.update({
      collection: 'invitations',
      id: invitation.id,
      data: { status: INVITATION_STATUS.REVOKED },
      overrideAccess: true,
    })
  }
}

export const Invitations = {
  slug: 'invitations',
  labels: {
    singular: 'Invitation',
    plural: 'Invitations',
  },
  admin: {
    group: 'Settings',
    useAsTitle: 'email',
    defaultColumns: ['email', 'role', 'status', 'expiresAt', 'createdAt'],
    description:
      'Invitation links. Use User Management to generate and copy them; raw tokens are only shown once.',
    hidden: ({ user }) => user?.role !== 'admin',
  },
  access: {
    read: isAdmin,
    create: isAdmin,
    update: isAdmin,
    delete: isAdmin,
  },
  hooks: {
    beforeValidate: [
      ({ data }) => {
        if (!data) return data
        return {
          ...data,
          email: data.email ? normalizeEmail(data.email) : data.email,
          name: typeof data.name === 'string' ? data.name.trim() : data.name,
        }
      },
    ],
  },
  endpoints: [
    {
      path: '/generate',
      method: 'post',
      handler: async (req) => {
        if (req.user?.role !== 'admin') {
          return json({ error: 'Only administrators can create invitations.' }, 403)
        }

        const limit = rateLimit({
          key: `invite:${req.user.id}:${clientIp(req)}`,
          limit: 30,
          windowMs: 10 * 60 * 1000,
        })
        if (!limit.ok) return rateLimitResponse(limit.retryAfter)

        const body = await readBody(req)
        if (!body) return json({ error: 'Invalid request body.' }, 400)

        const email = normalizeEmail(body.email)
        const name = String(body.name || '').trim().slice(0, 120)
        const role = body.role === 'admin' ? 'admin' : 'editor'

        if (!isValidEmail(email)) return json({ error: 'Enter a valid email address.' }, 400)
        if (await findUserByEmail(req.payload, email)) {
          return json({ error: 'A user with this email already exists.' }, 409)
        }

        await revokePendingForEmail(req.payload, email)

        const token = generateInvitationToken()
        const expiresAt = expiryDate(hoursFrom(body))

        const invitation = await req.payload.create({
          collection: 'invitations',
          data: {
            email,
            name: name || undefined,
            role,
            tokenHash: hashInvitationToken(token),
            status: INVITATION_STATUS.PENDING,
            expiresAt: expiresAt.toISOString(),
            invitedBy: req.user.id,
            lastSentAt: new Date().toISOString(),
          },
          overrideAccess: true,
          req,
        })

        const url = invitationUrl(token)
        const emailResult = await sendInvitationEmail({
          payload: req.payload,
          invitation,
          url,
        })

        return json({
          ok: true,
          invitation: {
            id: invitation.id,
            email,
            name: name || null,
            role,
            status: INVITATION_STATUS.PENDING,
            expiresAt: invitation.expiresAt,
          },
          url,
          emailSent: emailResult.sent,
        })
      },
    },
    {
      path: '/validate',
      method: 'post',
      handler: async (req) => {
        const limit = rateLimit({
          key: `validate:${clientIp(req)}`,
          limit: 30,
          windowMs: 10 * 60 * 1000,
        })
        if (!limit.ok) return rateLimitResponse(limit.retryAfter)

        const body = await readBody(req)
        if (!body) return json({ valid: false, error: 'Invalid request body.' }, 400)

        const invitation = await findInvitationByToken(req.payload, body.token)
        const problem = invitationProblem(invitation)
        if (problem) {
          return json(
            {
              valid: false,
              state: invitationState(invitation),
              error: problem,
            },
            400
          )
        }

        return json({
          valid: true,
          state: INVITATION_STATUS.PENDING,
          invitation: {
            email: invitation.email,
            name: invitation.name || null,
            role: invitation.role,
            expiresAt: invitation.expiresAt,
          },
        })
      },
    },
    {
      path: '/accept',
      method: 'post',
      handler: async (req) => {
        const limit = rateLimit({
          key: `accept:${clientIp(req)}`,
          limit: 12,
          windowMs: 15 * 60 * 1000,
        })
        if (!limit.ok) return rateLimitResponse(limit.retryAfter)

        const body = await readBody(req)
        if (!body) return json({ error: 'Invalid request body.' }, 400)

        const invitation = await findInvitationByToken(req.payload, body.token)
        const problem = invitationProblem(invitation)
        if (problem) {
          return json(
            { error: problem, state: invitationState(invitation) },
            invitation ? 409 : 400
          )
        }

        const name = String(body.name || invitation.name || '').trim().slice(0, 120)
        if (!name) return json({ error: 'Enter your name.' }, 400)

        const password = body.password
        const passwordError = passwordProblem(password)
        if (passwordError) return json({ error: passwordError }, 400)

        if (body.confirmPassword !== undefined && body.confirmPassword !== password) {
          return json({ error: 'The passwords do not match.' }, 400)
        }

        if (await findUserByEmail(req.payload, invitation.email)) {
          return json(
            { error: 'An account already exists for this email address. Sign in instead.' },
            409
          )
        }

        let user
        try {
          /* Role comes from the invitation record only. A request body can never
             choose or escalate a role. */
          user = await req.payload.create({
            collection: 'users',
            data: {
              name,
              email: invitation.email,
              password,
              role: invitation.role,
              active: true,
              publishingEnabled: invitation.role === 'admin',
            },
            overrideAccess: true,
            req,
          })
        } catch {
          return json(
            { error: 'The account could not be created. Ask an administrator for a new invitation.' },
            500
          )
        }

        await req.payload.update({
          collection: 'invitations',
          id: invitation.id,
          data: {
            status: INVITATION_STATUS.ACCEPTED,
            acceptedAt: new Date().toISOString(),
            acceptedUser: user.id,
          },
          overrideAccess: true,
          req,
        })

        await sendWelcomeEmail({ payload: req.payload, user })

        const base = (process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000').replace(
          /\/+$/,
          ''
        )

        return json({
          ok: true,
          email: user.email,
          loginUrl: `${base}/admin/login`,
        })
      },
    },
    {
      path: '/revoke',
      method: 'post',
      handler: async (req) => {
        if (req.user?.role !== 'admin') {
          return json({ error: 'Only administrators can revoke invitations.' }, 403)
        }

        const body = await readBody(req)
        const id = body?.id || body?.invitationId
        if (!id) return json({ error: 'Missing invitation id.' }, 400)

        const invitation = await req.payload
          .findByID({ collection: 'invitations', id, depth: 0, overrideAccess: true })
          .catch(() => null)

        if (!invitation) return json({ error: 'Invitation not found.' }, 404)
        if (invitation.status === INVITATION_STATUS.ACCEPTED) {
          return json({ error: 'This invitation was already accepted.' }, 409)
        }

        await req.payload.update({
          collection: 'invitations',
          id,
          data: { status: INVITATION_STATUS.REVOKED },
          overrideAccess: true,
          req,
        })

        return json({ ok: true, id })
      },
    },
    {
      path: '/resend',
      method: 'post',
      handler: async (req) => {
        if (req.user?.role !== 'admin') {
          return json({ error: 'Only administrators can resend invitations.' }, 403)
        }

        const limit = rateLimit({
          key: `resend:${req.user.id}`,
          limit: 30,
          windowMs: 10 * 60 * 1000,
        })
        if (!limit.ok) return rateLimitResponse(limit.retryAfter)

        const body = await readBody(req)
        const id = body?.id || body?.invitationId
        if (!id) return json({ error: 'Missing invitation id.' }, 400)

        const invitation = await req.payload
          .findByID({ collection: 'invitations', id, depth: 0, overrideAccess: true })
          .catch(() => null)

        if (!invitation) return json({ error: 'Invitation not found.' }, 404)
        if (invitation.status === INVITATION_STATUS.ACCEPTED) {
          return json({ error: 'This invitation was already accepted.' }, 409)
        }

        const token = generateInvitationToken()
        const expiresAt = expiryDate(hoursFrom(body))
        const updated = await req.payload.update({
          collection: 'invitations',
          id,
          data: {
            tokenHash: hashInvitationToken(token),
            status: INVITATION_STATUS.PENDING,
            expiresAt: expiresAt.toISOString(),
            acceptedAt: null,
            acceptedUser: null,
            invitedBy: req.user.id,
            lastSentAt: new Date().toISOString(),
          },
          overrideAccess: true,
          req,
        })

        const url = invitationUrl(token)
        const emailResult = await sendInvitationEmail({
          payload: req.payload,
          invitation: updated,
          url,
        })

        return json({ ok: true, url, expiresAt: updated.expiresAt, emailSent: emailResult.sent })
      },
    },
  ],
  fields: [
    {
      name: 'email',
      type: 'text',
      required: true,
      index: true,
    },
    {
      name: 'name',
      type: 'text',
    },
    {
      name: 'role',
      type: 'select',
      required: true,
      defaultValue: 'editor',
      options: [
        { label: 'Editor', value: 'editor' },
        { label: 'Administrator', value: 'admin' },
      ],
    },
    {
      name: 'tokenHash',
      type: 'text',
      index: true,
      admin: {
        hidden: true,
      },
      access: {
        read: () => false,
        update: () => false,
      },
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: INVITATION_STATUS.PENDING,
      index: true,
      options: [
        { label: 'Pending', value: INVITATION_STATUS.PENDING },
        { label: 'Accepted', value: INVITATION_STATUS.ACCEPTED },
        { label: 'Revoked', value: INVITATION_STATUS.REVOKED },
      ],
    },
    {
      name: 'expiresAt',
      type: 'date',
      required: true,
      admin: {
        date: { pickerAppearance: 'dayAndTime' },
      },
    },
    {
      name: 'acceptedAt',
      type: 'date',
      admin: {
        date: { pickerAppearance: 'dayAndTime' },
      },
    },
    {
      name: 'lastSentAt',
      type: 'date',
      admin: {
        date: { pickerAppearance: 'dayAndTime' },
      },
    },
    {
      name: 'invitedBy',
      type: 'relationship',
      relationTo: 'users',
      admin: { readOnly: true },
    },
    {
      name: 'acceptedUser',
      type: 'relationship',
      relationTo: 'users',
      admin: { readOnly: true },
    },
  ],
}
