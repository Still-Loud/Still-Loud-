import crypto from 'crypto'

import { APIError } from 'payload'

import { isAdmin } from './access.js'

/**
 * CMS accounts.
 *
 * There is no public sign-up. Only an admin can create/invite a user:
 *   • the admin UI has an "Invite user" screen, or
 *   • POST /api/users/invite with { name, email, role }.
 *
 * Inviting creates the account with a random password that is thrown away, then
 * uses Payload's built-in forgot-password flow to email a one-time setup link.
 * The link expires (auth.resetPasswordExpiration) and the token is single use.
 */
/** @type {import('payload').CollectionConfig} */
export const Users = {
  slug: 'users',
  labels: {
    singular: 'User',
    plural: 'Users',
  },
  auth: {
    tokenExpiration: 60 * 60 * 4, // 4 hours
    maxLoginAttempts: 5,
    lockTime: 10 * 60 * 1000, // 10 minutes
    cookies: {
      sameSite: 'Lax',
      secure: process.env.NODE_ENV === 'production',
    },
  },
  admin: {
    group: 'Settings',
    useAsTitle: 'email',
    defaultColumns: ['name', 'email', 'role', 'active', 'lastLoginAt'],
    description:
      'Only admins can invite people. Visitors cannot create accounts. Deactivate a user to block their login without deleting their content.',
  },
  access: {
    read: ({ req: { user } }) => {
      if (user?.role === 'admin') return true
      if (!user) return false
      return { id: { equals: user.id } }
    },
    create: isAdmin,
    update: ({ req: { user } }) => {
      if (user?.role === 'admin') return true
      if (!user) return false
      return { id: { equals: user.id } }
    },
    delete: isAdmin,
  },
  hooks: {
    beforeLogin: [
      ({ user }) => {
        if (user && user.active === false) {
          throw new APIError(
            'This account has been deactivated. Ask an administrator to re-enable it.',
            403
          )
        }
        return user
      },
    ],
    afterLogin: [
      async ({ user, req }) => {
        await req.payload.update({
          collection: 'users',
          id: user.id,
          data: { lastLoginAt: new Date().toISOString() },
          overrideAccess: true,
          req,
        })
        return user
      },
    ],
    beforeChange: [
      async ({ data, req, operation }) => {
        // The very first account must be an admin, otherwise nobody can
        // manage roles or publish content.
        if (operation === 'create') {
          const { totalDocs } = await req.payload.count({ collection: 'users' })
          if (totalDocs === 0) {
            return { ...data, role: 'admin', publishingEnabled: true, active: true }
          }
        }
        return data
      },
    ],
  },
  endpoints: [
    {
      path: '/invite',
      method: 'post',
      handler: async (req) => {
        if (req.user?.role !== 'admin') {
          return Response.json({ error: 'Only administrators can invite users.' }, { status: 403 })
        }

        let body = {}
        try {
          body = await req.json?.()
        } catch {
          return Response.json({ error: 'Invalid request body.' }, { status: 400 })
        }

        const email = String(body?.email || '').trim().toLowerCase()
        const name = String(body?.name || '').trim()
        const role = body?.role === 'admin' ? 'admin' : 'editor'

        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
          return Response.json({ error: 'Enter a valid email address.' }, { status: 400 })
        }
        if (!name) {
          return Response.json({ error: 'Enter the person’s name.' }, { status: 400 })
        }

        const existing = await req.payload.find({
          collection: 'users',
          where: { email: { equals: email } },
          limit: 1,
          depth: 0,
          overrideAccess: true,
        })
        if (existing.totalDocs > 0) {
          return Response.json({ error: 'A user with this email already exists.' }, { status: 409 })
        }

        // Random, never shown or stored outside Payload's hash. The user sets
        // their own password through the emailed reset link.
        const throwawayPassword = crypto.randomBytes(32).toString('base64url')

        try {
          await req.payload.create({
            collection: 'users',
            data: {
              name,
              email,
              role,
              active: true,
              publishingEnabled: role === 'admin',
              password: throwawayPassword,
            },
            overrideAccess: true,
            req,
          })

          await req.payload.forgotPassword({
            collection: 'users',
            data: { email },
            req,
          })
        } catch (error) {
          req.payload.logger.error(`Invite failed for ${email}: ${error?.message}`)
          return Response.json(
            { error: 'Could not send the invitation. Check the email settings and try again.' },
            { status: 500 }
          )
        }

        return Response.json({ ok: true, email })
      },
    },
  ],
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'role',
      type: 'select',
      required: true,
      defaultValue: 'editor',
      options: [
        { label: 'Administrator — full access, can invite users', value: 'admin' },
        { label: 'Editor — can write and edit content', value: 'editor' },
      ],
      access: {
        // Only admins may grant or change roles.
        update: ({ req: { user } }) => user?.role === 'admin',
      },
      admin: {
        description: 'Editors cannot invite users or delete content.',
      },
    },
    {
      name: 'publishingEnabled',
      type: 'checkbox',
      defaultValue: false,
      label: 'Allow publishing',
      admin: {
        position: 'sidebar',
        description:
          'Editors can save drafts. Tick this to let them publish. Admins always can.',
      },
      access: {
        update: ({ req: { user } }) => user?.role === 'admin',
      },
    },
    {
      name: 'active',
      type: 'checkbox',
      defaultValue: true,
      label: 'Account active',
      admin: {
        position: 'sidebar',
        description:
          'Un-tick to block this person from logging in. Their content stays published.',
      },
      access: {
        update: ({ req: { user } }) => user?.role === 'admin',
      },
    },
    {
      name: 'lastLoginAt',
      type: 'date',
      label: 'Last login',
      admin: {
        position: 'sidebar',
        readOnly: true,
        date: { pickerAppearance: 'dayAndTime' },
      },
    },
  ],
}
