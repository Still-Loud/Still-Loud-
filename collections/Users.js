import { APIError } from 'payload'

import { isAdmin } from './access.js'

/**
 * CMS accounts.
 *
 * There is no public sign-up. Accounts are created either by an administrator
 * or by accepting an invitation (see collections/Invitations.js). Invitations
 * never create the account up front: the Users document only exists after the
 * invited person sets a password at /accept-invite.
 *
 * Payload owns authentication end to end: password hashing, JWT signing,
 * HTTP-only cookies, token refresh, logout and server-side sessions. Nothing
 * here re-implements or stores a JWT.
 */
/** @type {import('payload').CollectionConfig} */
export const Users = {
  slug: 'users',
  labels: {
    singular: 'User',
    plural: 'Users',
  },
  auth: {
    /* Short-lived JWT + a server-side session id. Clearing a user's sessions
       invalidates every existing cookie immediately (used when an account is
       disabled). */
    tokenExpiration: 60 * 60 * 2, // 2 hours
    useSessions: true,
    maxLoginAttempts: 5,
    lockTime: 15 * 60 * 1000, // 15 minutes
    resetPasswordExpiration: 60 * 60, // 1 hour
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
      async ({ data, req, operation, originalDoc }) => {
        // The very first account must be an admin, otherwise nobody can
        // manage roles or publish content.
        if (operation === 'create') {
          const { totalDocs } = await req.payload.count({ collection: 'users' })
          if (totalDocs === 0) {
            return { ...data, role: 'admin', publishingEnabled: true, active: true }
          }
        }

        /* Defense in depth: field access already blocks this in the API, but
           never let a non-admin write privileged fields through any path. */
        if (operation === 'update' && req.user && req.user.role !== 'admin') {
          const next = { ...data }
          if (originalDoc) {
            if (next.role !== undefined && next.role !== originalDoc.role) next.role = originalDoc.role
            if (next.active !== undefined && next.active !== originalDoc.active) next.active = originalDoc.active
            if (
              next.publishingEnabled !== undefined &&
              next.publishingEnabled !== originalDoc.publishingEnabled
            ) {
              next.publishingEnabled = originalDoc.publishingEnabled
            }
          }
          return next
        }

        return data
      },
    ],
    afterChange: [
      async ({ doc, previousDoc, operation, req }) => {
        /* Disabling an account also drops its server-side sessions, so an
           already-signed-in browser cannot keep using a stolen cookie. */
        if (
          operation === 'update' &&
          doc.active === false &&
          previousDoc?.active !== false &&
          !req.context?.skipSessionRevoke
        ) {
          await req.payload.update({
            collection: 'users',
            id: doc.id,
            data: { sessions: [] },
            overrideAccess: true,
            req,
            context: { skipSessionRevoke: true },
          })
        }
        return doc
      },
    ],
  },
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
