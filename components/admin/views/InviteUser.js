'use client'

import { useState } from 'react'

/**
 * Admin → Invite user.
 *
 * Creates the account through POST /api/users/invite, which emails a one-time
 * password-setup link. Visitors still cannot register — the endpoint and this
 * screen are admin-only.
 */
export function InviteUser() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('editor')
  const [status, setStatus] = useState(null)
  const [sending, setSending] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setSending(true)
    setStatus(null)

    try {
      const response = await fetch('/api/users/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, role }),
      })
      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        setStatus({ type: 'error', message: data?.error || 'Could not send the invitation.' })
      } else {
        setStatus({
          type: 'success',
          message: `Invitation sent to ${data.email || email}. They will receive a link to set their own password.`,
        })
        setName('')
        setEmail('')
        setRole('editor')
      }
    } catch {
      setStatus({ type: 'error', message: 'Network error. Please try again.' })
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="gutter--left gutter--right collection-list">
      <div style={{ maxWidth: 640, padding: '40px 0' }}>
        <h1 style={{ margin: 0, fontSize: 28 }}>Invite a user</h1>
        <p style={{ marginTop: 10, marginBottom: 28, opacity: 0.75, lineHeight: 1.6 }}>
          Accounts are invitation-only. The person receives a one-time link to set their own
          password; nobody can register from the public site. The link expires automatically, and
          only administrators can send invitations.
        </p>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 18 }}>
            <label htmlFor="invite-name" style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>
              Full name
            </label>
            <input
              id="invite-name"
              type="text"
              required
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="e.g. Priya Sharma"
              style={{
                width: '100%',
                padding: '12px 14px',
                borderRadius: 8,
                border: '1px solid var(--theme-elevation-150, #3a3a3a)',
                background: 'var(--theme-elevation-50, #1a1a1a)',
                color: 'inherit',
                fontSize: 15,
              }}
            />
          </div>

          <div style={{ marginBottom: 18 }}>
            <label htmlFor="invite-email" style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>
              Email address
            </label>
            <input
              id="invite-email"
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="name@company.com"
              style={{
                width: '100%',
                padding: '12px 14px',
                borderRadius: 8,
                border: '1px solid var(--theme-elevation-150, #3a3a3a)',
                background: 'var(--theme-elevation-50, #1a1a1a)',
                color: 'inherit',
                fontSize: 15,
              }}
            />
          </div>

          <div style={{ marginBottom: 26 }}>
            <label htmlFor="invite-role" style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>
              Role
            </label>
            <select
              id="invite-role"
              value={role}
              onChange={(event) => setRole(event.target.value)}
              style={{
                width: '100%',
                padding: '12px 14px',
                borderRadius: 8,
                border: '1px solid var(--theme-elevation-150, #3a3a3a)',
                background: 'var(--theme-elevation-50, #1a1a1a)',
                color: 'inherit',
                fontSize: 15,
              }}
            >
              <option value="editor">Editor — can create and edit content</option>
              <option value="admin">Administrator — full access, can invite users</option>
            </select>
            <p style={{ marginTop: 8, marginBottom: 0, fontSize: 13, opacity: 0.7 }}>
              Editors can save drafts. Publishing can be enabled per user after they join.
            </p>
          </div>

          {status && (
            <p
              role="status"
              style={{
                marginBottom: 20,
                padding: '12px 14px',
                borderRadius: 8,
                fontSize: 14,
                lineHeight: 1.5,
                background: status.type === 'error' ? 'rgba(220, 38, 38, 0.15)' : 'rgba(34, 197, 94, 0.15)',
                border:
                  status.type === 'error'
                    ? '1px solid rgba(220, 38, 38, 0.5)'
                    : '1px solid rgba(34, 197, 94, 0.5)',
              }}
            >
              {status.message}
            </p>
          )}

          <button
            type="submit"
            disabled={sending}
            style={{
              padding: '12px 22px',
              borderRadius: 8,
              border: 0,
              background: '#8338ec',
              color: '#fff',
              fontWeight: 700,
              fontSize: 15,
              cursor: sending ? 'wait' : 'pointer',
              opacity: sending ? 0.7 : 1,
            }}
          >
            {sending ? 'Sending invitation…' : 'Send invitation'}
          </button>
        </form>

        <p style={{ marginTop: 28, fontSize: 13, opacity: 0.65, lineHeight: 1.6 }}>
          To revoke access later, open <a href="/admin/collections/users">Users</a> and un-tick
          “Account active”. Their content stays published; only their login stops working.
        </p>
      </div>
    </div>
  )
}
