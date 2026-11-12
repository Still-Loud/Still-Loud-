'use client'

import { useEffect, useState } from 'react'

/**
 * Password + name form for /accept-invite.
 *
 * The token, email and role arrive from the server after it has already
 * validated the invitation. On submit the API re-validates everything and
 * creates the account with the role stored on the invitation — never a role
 * supplied by this form.
 */
export default function AcceptInviteForm({ token, email, name, role, expiresAt }) {
  const [fullName, setFullName] = useState(name || '')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState(null)
  const [sending, setSending] = useState(false)
  const [done, setDone] = useState(null)

  useEffect(() => {
    if (!done?.loginUrl) return
    /* Remove the token from the address bar once it has been consumed. */
    if (typeof window !== 'undefined') {
      window.history.replaceState({}, '', '/accept-invite')
    }
    const timer = setTimeout(() => {
      window.location.href = done.loginUrl
    }, 3000)
    return () => clearTimeout(timer)
  }, [done])

  async function handleSubmit(event) {
    event.preventDefault()
    setError(null)

    if (!fullName.trim()) {
      setError('Enter your name.')
      return
    }
    if (password.length < 8) {
      setError('Use at least 8 characters for the password.')
      return
    }
    if (password !== confirmPassword) {
      setError('The passwords do not match.')
      return
    }

    setSending(true)
    try {
      const response = await fetch('/api/invitations/accept', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          name: fullName,
          password,
          confirmPassword,
        }),
      })
      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        setError(
          data?.error ||
            data?.errors?.[0]?.message ||
            'The invitation could not be accepted. Ask an administrator for a new link.'
        )
        return
      }

      setDone({
        email: data.email || email,
        loginUrl: data.loginUrl || '/admin/login',
      })
    } catch {
      setError('Network error. Please check your connection and try again.')
    } finally {
      setSending(false)
    }
  }

  if (done) {
    return (
      <div className="invite-card" role="status">
        <h1>You’re in.</h1>
        <p>
          The account for <strong>{done.email}</strong> is active. You can now sign in with the
          password you just chose.
        </p>
        <a className="invite-button" href={done.loginUrl}>
          Go to sign in
        </a>
        <p className="invite-hint">Redirecting you to the sign-in page…</p>
      </div>
    )
  }

  return (
    <div className="invite-card">
      <p className="invite-eyebrow">StillLoud CMS</p>
      <h1>Accept your invitation</h1>
      <p className="invite-lede">
        You’ve been invited as an <strong>{role === 'admin' ? 'administrator' : 'editor'}</strong>.
        Set your name and password to activate the account.
      </p>

      <form onSubmit={handleSubmit} noValidate>
        <div className="invite-field">
          <label htmlFor="invite-account-email">Email address</label>
          <input id="invite-account-email" type="email" value={email} readOnly disabled />
          <span className="invite-hint">This is the address the invitation was sent to.</span>
        </div>

        <div className="invite-field">
          <label htmlFor="invite-account-name">Your name</label>
          <input
            id="invite-account-name"
            type="text"
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
            autoComplete="name"
            maxLength={120}
            required
          />
        </div>

        <div className="invite-field">
          <label htmlFor="invite-account-password">Password</label>
          <div className="invite-password">
            <input
              id="invite-account-password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="new-password"
              minLength={8}
              maxLength={200}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword((value) => !value)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>
          <span className="invite-hint">At least 8 characters.</span>
        </div>

        <div className="invite-field">
          <label htmlFor="invite-account-confirm">Confirm password</label>
          <input
            id="invite-account-confirm"
            type={showPassword ? 'text' : 'password'}
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            autoComplete="new-password"
            minLength={8}
            maxLength={200}
            required
          />
        </div>

        {error && (
          <p className="invite-error" role="alert">
            {error}
          </p>
        )}

        <button type="submit" className="invite-button" disabled={sending}>
          {sending ? 'Activating…' : 'Activate account'}
        </button>
      </form>

      {expiresAt && (
        <p className="invite-hint">
          This invitation expires {new Date(expiresAt).toLocaleString('en-IN')}.
        </p>
      )}
    </div>
  )
}
