'use client'

import React, { useCallback, useEffect, useState } from 'react'
import { useAuth } from '@payloadcms/ui'

/**
 * Admin → User management.
 *
 * One screen for everything the administrator needs:
 *   • invite someone and copy the generated link (no SMTP required),
 *   • see pending / accepted / expired / revoked invitations,
 *   • generate a replacement link, revoke an invitation,
 *   • disable / reactivate / delete users and change roles.
 *
 * Every action is re-checked by Payload on the server. The raw invitation token
 * only ever exists in this browser tab, in the response that created it.
 */

const input = {
  width: '100%',
  padding: '10px 12px',
  borderRadius: 8,
  border: '1px solid var(--theme-elevation-150, #3a3a3a)',
  background: 'var(--theme-elevation-50, #1a1a1a)',
  color: 'inherit',
  fontSize: 14,
}

const label = {
  display: 'block',
  marginBottom: 6,
  fontWeight: 600,
  fontSize: 13,
}

const primaryButton = {
  padding: '11px 20px',
  borderRadius: 8,
  border: 0,
  background: '#8338ec',
  color: '#fff',
  fontWeight: 700,
  fontSize: 14,
  cursor: 'pointer',
}

const secondaryButton = {
  padding: '6px 11px',
  borderRadius: 7,
  border: '1px solid var(--theme-elevation-200, #444)',
  background: 'transparent',
  color: 'inherit',
  fontSize: 12,
  fontWeight: 600,
  cursor: 'pointer',
}

const dangerButton = {
  ...secondaryButton,
  borderColor: 'rgba(220, 38, 38, 0.55)',
  color: '#f87171',
}

const card = {
  border: '1px solid var(--theme-elevation-100, #333)',
  borderRadius: 12,
  padding: 22,
  marginBottom: 24,
  background: 'var(--theme-elevation-0, #111)',
}

const cell = {
  padding: '10px 12px',
  borderBottom: '1px solid var(--theme-elevation-100, #2a2a2a)',
  fontSize: 13,
  verticalAlign: 'top',
}

const headCell = {
  ...cell,
  fontWeight: 700,
  fontSize: 12,
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
  opacity: 0.7,
}

const STATUS_COLORS = {
  pending: { background: 'rgba(234, 179, 8, 0.15)', color: '#facc15' },
  accepted: { background: 'rgba(34, 197, 94, 0.15)', color: '#4ade80' },
  revoked: { background: 'rgba(220, 38, 38, 0.15)', color: '#f87171' },
  expired: { background: 'rgba(148, 163, 184, 0.15)', color: '#cbd5e1' },
  active: { background: 'rgba(34, 197, 94, 0.15)', color: '#4ade80' },
  disabled: { background: 'rgba(220, 38, 38, 0.15)', color: '#f87171' },
}

function Badge({ status }) {
  const colors = STATUS_COLORS[status] || STATUS_COLORS.pending
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '3px 9px',
        borderRadius: 999,
        fontSize: 11,
        fontWeight: 700,
        textTransform: 'capitalize',
        ...colors,
      }}
    >
      {status}
    </span>
  )
}

async function request(path, options = {}) {
  const response = await fetch(path, {
    credentials: 'same-origin',
    ...options,
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(
      data?.errors?.[0]?.message || data?.error || `Request failed (${response.status})`
    )
  }
  return data
}

function effectiveStatus(invitation) {
  if (invitation.status === 'accepted') return 'accepted'
  if (invitation.status === 'revoked') return 'revoked'
  if (invitation.expiresAt && new Date(invitation.expiresAt).getTime() <= Date.now()) {
    return 'expired'
  }
  return 'pending'
}

function formatDate(value) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
}

function relativeExpiry(value) {
  if (!value) return ''
  const ms = new Date(value).getTime() - Date.now()
  if (Number.isNaN(ms)) return ''
  if (ms <= 0) return 'expired'
  const hours = Math.floor(ms / (60 * 60 * 1000))
  if (hours >= 24) return `in ${Math.floor(hours / 24)} day(s)`
  if (hours >= 1) return `in ${hours} hour(s)`
  return `in ${Math.max(1, Math.floor(ms / 60000))} minute(s)`
}

function copyToClipboard(value) {
  if (navigator.clipboard?.writeText) return navigator.clipboard.writeText(value)
  const area = document.createElement('textarea')
  area.value = value
  area.setAttribute('readonly', '')
  area.style.position = 'fixed'
  area.style.opacity = '0'
  document.body.appendChild(area)
  area.select()
  document.execCommand('copy')
  document.body.removeChild(area)
  return Promise.resolve()
}

export function UserManagement() {
  const { user: currentUser } = useAuth()
  const [users, setUsers] = useState([])
  const [invitations, setInvitations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [notice, setNotice] = useState(null)
  const [generated, setGenerated] = useState(null)
  const [busy, setBusy] = useState('')
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', role: 'editor', expiry: '24' })

  const isAdmin = currentUser?.role === 'admin'

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [usersData, invitationsData] = await Promise.all([
        request('/api/users?limit=200&sort=-createdAt&depth=0'),
        request('/api/invitations?limit=200&sort=-createdAt&depth=1'),
      ])
      setUsers(usersData?.docs || [])
      setInvitations(invitationsData?.docs || [])
    } catch (loadError) {
      setError(loadError.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (isAdmin) load()
  }, [isAdmin, load])

  async function generateInvitation(event) {
    event.preventDefault()
    setCreating(true)
    setError(null)
    setNotice(null)
    setGenerated(null)

    try {
      const data = await request('/api/invitations/generate', {
        method: 'POST',
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          role: form.role,
          expiresInHours: Number(form.expiry),
        }),
      })
      setGenerated({ ...data.invitation, url: data.url, emailSent: data.emailSent })
      setNotice(
        data.emailSent
          ? `Invitation created and emailed to ${data.invitation.email}.`
          : `Invitation created for ${data.invitation.email}. Email is not configured — copy the link and share it manually.`
      )
      setForm((current) => ({ ...current, name: '', email: '' }))
      await load()
    } catch (createError) {
      setError(createError.message)
    } finally {
      setCreating(false)
    }
  }

  async function copyLink(value) {
    try {
      await copyToClipboard(value)
      setNotice('Invitation link copied. Share it privately with the invited person.')
      setError(null)
    } catch {
      setError('Could not copy automatically. Select the link and copy it manually.')
    }
  }

  async function resendInvitation(invitation) {
    const key = `resend:${invitation.id}`
    setBusy(key)
    setError(null)
    setNotice(null)
    try {
      const data = await request('/api/invitations/resend', {
        method: 'POST',
        body: JSON.stringify({ id: invitation.id }),
      })
      setGenerated({
        id: invitation.id,
        email: invitation.email,
        name: invitation.name,
        role: invitation.role,
        status: 'pending',
        expiresAt: data.expiresAt,
        url: data.url,
        emailSent: data.emailSent,
      })
      setNotice(
        `New link generated for ${invitation.email}. The previous link no longer works.`
      )
      await load()
    } catch (resendError) {
      setError(resendError.message)
    } finally {
      setBusy('')
    }
  }

  async function revokeInvitation(invitation) {
    if (!window.confirm(`Revoke the invitation for ${invitation.email}?`)) return
    const key = `revoke:${invitation.id}`
    setBusy(key)
    setError(null)
    try {
      await request('/api/invitations/revoke', {
        method: 'POST',
        body: JSON.stringify({ id: invitation.id }),
      })
      setNotice(`Invitation for ${invitation.email} revoked.`)
      if (generated?.id === invitation.id) setGenerated(null)
      await load()
    } catch (revokeError) {
      setError(revokeError.message)
    } finally {
      setBusy('')
    }
  }

  async function updateUser(target, data, key) {
    setBusy(key)
    setError(null)
    setNotice(null)
    try {
      await request(`/api/users/${target.id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      })
      setNotice(`Updated ${target.name || target.email}.`)
      await load()
    } catch (updateError) {
      setError(updateError.message)
    } finally {
      setBusy('')
    }
  }

  async function deleteUser(target) {
    if (currentUser?.id === target.id) {
      setError('You cannot delete your own account.')
      return
    }
    if (!window.confirm(`Delete ${target.name || target.email}? Their content stays, but the account is removed.`)) {
      return
    }
    setBusy(`delete:${target.id}`)
    setError(null)
    try {
      await request(`/api/users/${target.id}`, { method: 'DELETE' })
      setNotice(`Deleted ${target.name || target.email}.`)
      await load()
    } catch (deleteError) {
      setError(deleteError.message)
    } finally {
      setBusy('')
    }
  }

  if (!isAdmin) {
    return (
      <div className="gutter--left gutter--right collection-list">
        <div style={{ maxWidth: 760, padding: '40px 0' }}>
          <h1 style={{ margin: 0, fontSize: 28 }}>User management</h1>
          <p style={{ marginTop: 14, opacity: 0.75 }}>
            Only administrators can manage users and invitations.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="gutter--left gutter--right collection-list">
      <div style={{ maxWidth: 1040, padding: '36px 0 60px' }}>
        <h1 style={{ margin: 0, fontSize: 28 }}>User management</h1>
        <p style={{ marginTop: 10, marginBottom: 26, opacity: 0.75, lineHeight: 1.6 }}>
          Accounts are invitation-only. Generate a link and share it privately — email is sent
          automatically only when Brevo SMTP is configured. The invited person sets their own
          password; nobody can choose their own role.
        </p>

        {error && (
          <p
            role="alert"
            style={{
              padding: '12px 14px',
              borderRadius: 8,
              background: 'rgba(220, 38, 38, 0.15)',
              border: '1px solid rgba(220, 38, 38, 0.5)',
              fontSize: 14,
            }}
          >
            {error}
          </p>
        )}

        {notice && (
          <p
            role="status"
            style={{
              padding: '12px 14px',
              borderRadius: 8,
              background: 'rgba(34, 197, 94, 0.12)',
              border: '1px solid rgba(34, 197, 94, 0.4)',
              fontSize: 14,
            }}
          >
            {notice}
          </p>
        )}

        {generated && (
          <div style={{ ...card, borderColor: 'rgba(131, 56, 236, 0.6)' }}>
            <h2 style={{ margin: 0, fontSize: 18 }}>Invitation link for {generated.email}</h2>
            <p style={{ margin: '8px 0 12px', fontSize: 13, opacity: 0.75 }}>
              Valid {relativeExpiry(generated.expiresAt)} · expires {formatDate(generated.expiresAt)} ·{' '}
              role {generated.role === 'admin' ? 'administrator' : 'editor'}
              {generated.emailSent ? ' · emailed' : ' · not emailed (SMTP off)'}
            </p>
            <p style={{ margin: '0 0 10px', fontSize: 13, color: '#facc15' }}>
              This is the only time the full link is shown. Copy it now.
            </p>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <input readOnly value={generated.url} style={{ ...input, flex: '1 1 420px' }} />
              <button type="button" style={primaryButton} onClick={() => copyLink(generated.url)}>
                Copy link
              </button>
              <button type="button" style={secondaryButton} onClick={() => setGenerated(null)}>
                Done
              </button>
            </div>
          </div>
        )}

        <section style={card} aria-labelledby="invite-heading">
          <h2 id="invite-heading" style={{ margin: 0, fontSize: 19 }}>
            Invite a user
          </h2>
          <p style={{ margin: '6px 0 20px', fontSize: 13, opacity: 0.7 }}>
            The link expires automatically and works once. Generate a new link at any time.
          </p>

          <form
            onSubmit={generateInvitation}
            style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 16 }}
          >
            <div>
              <label htmlFor="invite-name" style={label}>
                Name (optional)
              </label>
              <input
                id="invite-name"
                type="text"
                value={form.name}
                onChange={(event) => setForm((f) => ({ ...f, name: event.target.value }))}
                placeholder="e.g. Priya Sharma"
                style={input}
              />
            </div>
            <div>
              <label htmlFor="invite-email" style={label}>
                Email address
              </label>
              <input
                id="invite-email"
                type="email"
                required
                value={form.email}
                onChange={(event) => setForm((f) => ({ ...f, email: event.target.value }))}
                placeholder="name@company.com"
                style={input}
              />
            </div>
            <div>
              <label htmlFor="invite-role" style={label}>
                Role
              </label>
              <select
                id="invite-role"
                value={form.role}
                onChange={(event) => setForm((f) => ({ ...f, role: event.target.value }))}
                style={input}
              >
                <option value="editor">Editor</option>
                <option value="admin">Administrator</option>
              </select>
            </div>
            <div>
              <label htmlFor="invite-expiry" style={label}>
                Expires in
              </label>
              <select
                id="invite-expiry"
                value={form.expiry}
                onChange={(event) => setForm((f) => ({ ...f, expiry: event.target.value }))}
                style={input}
              >
                <option value="1">1 hour</option>
                <option value="8">8 hours</option>
                <option value="24">24 hours (default)</option>
                <option value="72">3 days</option>
                <option value="168">7 days</option>
              </select>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
              <button type="submit" disabled={creating} style={{ ...primaryButton, opacity: creating ? 0.7 : 1 }}>
                {creating ? 'Generating…' : 'Generate invitation'}
              </button>
            </div>
          </form>
        </section>

        <section style={card} aria-labelledby="users-heading">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
            <h2 id="users-heading" style={{ margin: 0, fontSize: 19 }}>
              Users
            </h2>
            <button type="button" style={secondaryButton} onClick={load} disabled={loading}>
              Refresh
            </button>
          </div>

          {loading ? (
            <p style={{ marginTop: 16, opacity: 0.7 }}>Loading users…</p>
          ) : (
            <div style={{ overflowX: 'auto', marginTop: 14 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={headCell}>Name / email</th>
                    <th style={headCell}>Role</th>
                    <th style={headCell}>Status</th>
                    <th style={headCell}>Last login</th>
                    <th style={headCell}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((account) => {
                    const isSelf = currentUser?.id === account.id
                    const active = account.active !== false
                    return (
                      <tr key={account.id}>
                        <td style={cell}>
                          <strong>{account.name || '—'}</strong>
                          <br />
                          <span style={{ opacity: 0.75 }}>{account.email}</span>
                          {isSelf && <span style={{ opacity: 0.6 }}> (you)</span>}
                        </td>
                        <td style={cell}>
                          <select
                            value={account.role}
                            disabled={isSelf || busy === `role:${account.id}`}
                            onChange={(event) =>
                              updateUser(account, { role: event.target.value }, `role:${account.id}`)
                            }
                            style={{ ...input, padding: '6px 8px', fontSize: 12 }}
                          >
                            <option value="editor">Editor</option>
                            <option value="admin">Administrator</option>
                          </select>
                        </td>
                        <td style={cell}>
                          <Badge status={active ? 'active' : 'disabled'} />
                        </td>
                        <td style={cell}>{formatDate(account.lastLoginAt)}</td>
                        <td style={cell}>
                          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                            <button
                              type="button"
                              style={secondaryButton}
                              disabled={isSelf || busy === `active:${account.id}`}
                              onClick={() =>
                                updateUser(
                                  account,
                                  { active: !active },
                                  `active:${account.id}`
                                )
                              }
                            >
                              {active ? 'Disable' : 'Reactivate'}
                            </button>
                            <button
                              type="button"
                              style={dangerButton}
                              disabled={isSelf || busy === `delete:${account.id}`}
                              onClick={() => deleteUser(account)}
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section style={card} aria-labelledby="invitations-heading">
          <h2 id="invitations-heading" style={{ margin: 0, fontSize: 19 }}>
            Invitations
          </h2>
          <p style={{ margin: '6px 0 0', fontSize: 13, opacity: 0.7 }}>
            Full links are shown once. Use “New link” to replace an old one — the previous link
            stops working immediately.
          </p>

          {loading ? (
            <p style={{ marginTop: 16, opacity: 0.7 }}>Loading invitations…</p>
          ) : invitations.length === 0 ? (
            <p style={{ marginTop: 16, opacity: 0.7 }}>No invitations yet.</p>
          ) : (
            <div style={{ overflowX: 'auto', marginTop: 14 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={headCell}>Email</th>
                    <th style={headCell}>Role</th>
                    <th style={headCell}>Status</th>
                    <th style={headCell}>Expiry</th>
                    <th style={headCell}>Created</th>
                    <th style={headCell}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {invitations.map((invitation) => {
                    const status = effectiveStatus(invitation)
                    return (
                      <tr key={invitation.id}>
                        <td style={cell}>
                          <strong>{invitation.email}</strong>
                          {invitation.name && (
                            <>
                              <br />
                              <span style={{ opacity: 0.7 }}>{invitation.name}</span>
                            </>
                          )}
                        </td>
                        <td style={cell}>
                          {invitation.role === 'admin' ? 'Administrator' : 'Editor'}
                        </td>
                        <td style={cell}>
                          <Badge status={status} />
                        </td>
                        <td style={cell}>
                          {formatDate(invitation.expiresAt)}
                          {status === 'pending' && (
                            <>
                              <br />
                              <span style={{ opacity: 0.65 }}>{relativeExpiry(invitation.expiresAt)}</span>
                            </>
                          )}
                        </td>
                        <td style={cell}>{formatDate(invitation.createdAt)}</td>
                        <td style={cell}>
                          {status === 'accepted' || status === 'revoked' ? (
                            <span style={{ opacity: 0.5 }}>—</span>
                          ) : (
                            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                              <button
                                type="button"
                                style={secondaryButton}
                                disabled={busy === `resend:${invitation.id}`}
                                onClick={() => resendInvitation(invitation)}
                              >
                                {busy === `resend:${invitation.id}` ? 'Generating…' : 'New link'}
                              </button>
                              <button
                                type="button"
                                style={dangerButton}
                                disabled={busy === `revoke:${invitation.id}`}
                                onClick={() => revokeInvitation(invitation)}
                              >
                                Revoke
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
