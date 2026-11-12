import { draftMode } from 'next/headers'
import { redirect } from 'next/navigation'

import { getPayloadClient } from '../../../lib/payload'

/**
 * Turns on Next.js draft mode for a logged-in CMS user.
 *
 * The admin "Preview" button opens this route. It re-checks the Payload session
 * from the request cookie — so a shared link does nothing for a visitor — then
 * redirects to the real public URL, which now renders the latest draft.
 *
 *   /api/preview?collection=pages&slug=about-us
 *   /api/preview?collection=posts&slug=hello-world
 *   /api/preview?collection=projects&slug=kubes
 *   /api/preview?global=home-page&path=/
 */
export async function GET(request) {
  const payload = await getPayloadClient()
  const { user } = await payload.auth({ headers: request.headers })

  if (!user || user.active === false) {
    return Response.json(
      { error: 'Sign in to the admin panel before previewing drafts.' },
      { status: 401 }
    )
  }

  const { searchParams } = new URL(request.url)
  const collection = searchParams.get('collection')
  const globalSlug = searchParams.get('global')
  const slug = searchParams.get('slug')

  let path = searchParams.get('path')

  if (!path) {
    if (globalSlug === 'home-page') path = '/'
    else if (collection === 'posts') path = slug ? `/blog/${slug}` : '/blog'
    else if (collection === 'projects') path = slug ? `/projects/${slug}` : '/projects'
    else if (collection === 'pages') path = slug ? `/${slug}` : '/'
  }

  if (!path || !path.startsWith('/')) {
    return Response.json({ error: 'Missing or invalid preview path.' }, { status: 400 })
  }

  const mode = await draftMode()
  mode.enable()

  redirect(path)
}
