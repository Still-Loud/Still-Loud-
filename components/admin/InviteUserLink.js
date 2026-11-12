import React from 'react'

/**
 * "Invite user" link in the admin navigation.
 * Only admins see it, and the invite endpoint enforces the same rule.
 */
export function InviteUserLink() {
  return (
    <a
      href="/admin/invite"
      style={{
        display: 'block',
        padding: '8px 0',
        fontSize: 13,
        fontWeight: 600,
        textDecoration: 'none',
        color: 'var(--theme-text, inherit)',
        opacity: 0.85,
      }}
    >
      Invite user
    </a>
  )
}
