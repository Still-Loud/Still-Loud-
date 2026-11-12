'use client'

import React from 'react'
import { useAuth } from '@payloadcms/ui'

/**
 * Admin → User management link.
 *
 * Hidden for editors; the Invitations collection and its endpoints enforce the
 * same rule server-side, so hiding the link is convenience, not security.
 */
export function UserManagementLink() {
  const { user } = useAuth()
  if (user?.role !== 'admin') return null

  return (
    <a
      href="/admin/user-management"
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
      User management
    </a>
  )
}
