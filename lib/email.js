/**
 * Transactional email.
 *
 * SMTP is optional on purpose. Until Brevo is configured the invitation
 * workflow still works: the admin copies the generated link and sends it
 * manually. Sending never throws into the caller and never logs the recipient,
 * the token or the invitation URL.
 */
export function smtpSettings() {
  const host = process.env.BREVO_SMTP_HOST || process.env.SMTP_HOST || ''
  const port = Number(process.env.BREVO_SMTP_PORT || process.env.SMTP_PORT || 587)
  const user = process.env.BREVO_SMTP_USER || process.env.SMTP_USER || ''
  const pass = process.env.BREVO_SMTP_KEY || process.env.SMTP_PASS || ''

  return {
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
    configured: Boolean(host && user && pass),
  }
}

export function emailFrom() {
  return process.env.EMAIL_FROM || process.env.SMTP_FROM || 'team.stillloud@gmail.com'
}

export function emailFromName() {
  return process.env.EMAIL_FROM_NAME || 'StillLoud'
}

export function emailConfigured() {
  return smtpSettings().configured
}

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function layout({ heading, body, url, cta }) {
  const button = url
    ? `<p style="margin:28px 0"><a href="${escapeHtml(url)}" style="background:#8338ec;color:#fff;padding:14px 26px;border-radius:999px;text-decoration:none;font-weight:700;display:inline-block">${escapeHtml(
        cta || 'Open link'
      )}</a></p>
       <p style="font-size:13px;color:#666">If the button does not work, copy this address into your browser:<br /><span style="word-break:break-all">${escapeHtml(
         url
       )}</span></p>`
    : ''

  return `<!doctype html>
<html><body style="margin:0;background:#f6f4fb;font-family:Arial,Helvetica,sans-serif;color:#1c1c1c">
  <div style="max-width:560px;margin:0 auto;padding:32px 20px">
    <div style="background:#fff;border-radius:16px;padding:32px">
      <h1 style="margin:0 0 16px;font-size:22px">${escapeHtml(heading)}</h1>
      ${body}
      ${button}
    </div>
    <p style="text-align:center;font-size:12px;color:#888;margin-top:20px">StillLoud — invitation-only CMS</p>
  </div>
</body></html>`
}

/**
 * Sends the invitation link when SMTP is configured.
 * @returns {Promise<{sent: boolean, reason?: string}>}
 */
export async function sendInvitationEmail({ payload, invitation, url }) {
  if (!emailConfigured()) return { sent: false, reason: 'not-configured' }
  if (!invitation?.email || !url) return { sent: false, reason: 'missing-details' }

  const role = invitation.role === 'admin' ? 'administrator' : 'editor'
  const greeting = invitation.name ? `Hi ${escapeHtml(invitation.name)},` : 'Hello,'
  const expires = invitation.expiresAt
    ? new Date(invitation.expiresAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })
    : ''

  try {
    await payload.sendEmail({
      to: invitation.email,
      subject: 'Your StillLoud CMS invitation',
      text: `${greeting}\n\nYou have been invited to the StillLoud CMS as an ${role}. Accept the invitation and choose your password within the next 24 hours:\n\n${url}\n\nThis link can only be used once. If it expires, ask an administrator for a new one.`,
      html: layout({
        heading: 'Your StillLoud CMS invitation',
        body: `<p>${greeting}</p>
          <p>You have been invited to manage StillLoud content as an <strong>${role}</strong>.</p>
          <p>Choose your password using the button below.</p>
          ${expires ? `<p style="font-size:13px;color:#666">This link expires on ${escapeHtml(expires)}.</p>` : ''}
          <p style="font-size:13px;color:#666">The link can only be used once.</p>`,
        url,
        cta: 'Accept invitation',
      }),
    })
    return { sent: true }
  } catch {
    /* Deliberately generic: an SMTP error must not leak the link into logs. */
    payload.logger.error(`Invitation email could not be sent (invitation ${invitation.id}).`)
    return { sent: false, reason: 'send-failed' }
  }
}

/** Optional confirmation once an invited account is activated. */
export async function sendWelcomeEmail({ payload, user }) {
  if (!emailConfigured() || !user?.email) return { sent: false, reason: 'not-configured' }

  try {
    await payload.sendEmail({
      to: user.email,
      subject: 'Your StillLoud CMS account is ready',
      text: `Hi ${user.name || 'there'},\n\nYour StillLoud CMS account is active. Sign in at ${process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'}/admin\n\nIf you did not expect this, contact the team.`,
      html: layout({
        heading: 'Your account is ready',
        body: `<p>Hi ${escapeHtml(user.name || 'there')},</p>
          <p>Your StillLoud CMS account is active. You can now sign in and start working.</p>`,
        url: `${(process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000').replace(/\/+$/, '')}/admin`,
        cta: 'Sign in',
      }),
    })
    return { sent: true }
  } catch {
    payload.logger.error(`Welcome email could not be sent (user ${user.id}).`)
    return { sent: false, reason: 'send-failed' }
  }
}
