/**
 * Shared access-control rules.
 *
 * Roles:
 *   admin  — full control, can publish and delete.
 *   editor — can create/edit content; publishing requires the
 *            `publishingEnabled` flag on the user (see Users.js).
 */
export const anyone = () => true

export const isAdmin = ({ req: { user } }) => user?.role === 'admin'

export const isAdminOrEditor = ({ req: { user } }) =>
  user?.role === 'admin' || user?.role === 'editor'

/** Admins always publish; editors only when explicitly permitted. */
export const canPublish = ({ req: { user } }) =>
  user?.role === 'admin' || (user?.role === 'editor' && user?.publishingEnabled === true)

/** Public visitors only ever see published documents. */
export const publishedOrLoggedIn = ({ req: { user } }) => {
  if (user) return true
  return { _status: { equals: 'published' } }
}

/** Published-only read rule that also works for collections without drafts. */
export const publicRead = () => true
