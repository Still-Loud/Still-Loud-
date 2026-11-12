import AcceptInviteForm from '../../../components/AcceptInviteForm'
import Footer from '../../../components/Footer'
import Navbar from '../../../components/Navbar'
import '../../../styles/invite.css'
import {
  findInvitationByToken,
  invitationProblem,
  invitationState,
} from '../../../lib/invitations'
import { getPayloadClient } from '../../../lib/payload'

/**
 * Public invitation landing page.
 *
 * The token is validated on the server before anything is rendered. Invalid,
 * expired, revoked and already-used links never reach the form, and the email
 * shown is the one stored on the invitation — never one from the URL.
 */
export const dynamic = 'force-dynamic'
export const revalidate = 0

export const metadata = {
  title: 'Accept invitation | StillLoud',
  description: 'Activate your StillLoud CMS account.',
  robots: { index: false, follow: false },
  referrer: 'no-referrer',
}

export default async function AcceptInvitePage({ searchParams }) {
  const params = await searchParams
  const raw = params?.token
  const token = Array.isArray(raw) ? raw[0] : raw

  let invitation = null
  let problem = null

  if (!token) {
    problem = 'This invitation link is missing its token. Ask an administrator for a new link.'
  } else {
    const payload = await getPayloadClient()
    invitation = await findInvitationByToken(payload, token)
    problem = invitationProblem(invitation)
  }

  return (
    <div className="invite-page">
      <Navbar />
      <main className="invite-shell">
        {problem ? (
          <div className="invite-card" role="alert">
            <p className="invite-eyebrow">StillLoud CMS</p>
            <h1>Invitation unavailable</h1>
            <p>{problem}</p>
            <p className="invite-hint">
              Invitation state: <strong>{invitationState(invitation)}</strong>
            </p>
            <a className="invite-button" href="/admin/login">
              Go to sign in
            </a>
          </div>
        ) : (
          <AcceptInviteForm
            token={token}
            email={invitation.email}
            name={invitation.name || ''}
            role={invitation.role}
            expiresAt={invitation.expiresAt}
          />
        )}
      </main>
      <Footer />
    </div>
  )
}
