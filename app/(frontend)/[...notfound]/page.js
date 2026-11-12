import { notFound, permanentRedirect, redirect } from 'next/navigation'

import { getPayloadClient } from '../../../lib/payload'

/* Catch-all for unmatched URLs in the frontend group.
   1. Checks the editable Redirects collection (301/302) so legacy links keep
      their SEO equity.
   2. Otherwise renders the group's not-found page, keeping the brand layout
      (fonts, navbar, footer) and returning a real 404 status. Without this,
      Next falls back to its unstyled built-in page because the project uses
      multiple root layouts. */
export default async function CatchAllPage({ params }) {
  const { notfound } = await params
  const path = `/${(notfound || []).join('/')}`

  let target = null
  let type = '301'

  try {
    const payload = await getPayloadClient()
    const { docs } = await payload.find({
      collection: 'redirects',
      where: {
        from: { equals: path },
        enabled: { equals: true },
      },
      limit: 1,
      depth: 0,
      overrideAccess: false,
    })

    if (docs[0]?.to) {
      target = docs[0].to
      type = docs[0].type || '301'
    }
  } catch {
    /* A redirect lookup must never turn a 404 into a 500. */
  }

  // These helpers throw, so they must stay outside the try/catch above.
  if (target) {
    if (type === '302') redirect(target)
    permanentRedirect(target)
  }

  notFound()
}
