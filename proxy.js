import { NextResponse } from 'next/server'

/**
 * Applies the editable Redirects collection with real 301/302 status codes.
 *
 * `next/navigation` can only issue 307/308, so the lookup happens here, before
 * the route renders. The redirect list is cached per server instance for a
 * minute to avoid a database round-trip on every page view.
 *
 * Static, API, admin and file requests are excluded via the matcher below.
 */
const TTL = 60 * 1000
let cache = { at: 0, map: {} }

async function loadRedirects(origin) {
  if (Date.now() - cache.at < TTL) return cache.map

  try {
    const url = new URL('/api/redirects', origin)
    url.searchParams.set('limit', '1000')
    url.searchParams.set('depth', '0')
    url.searchParams.set('where[enabled][equals]', 'true')

    const response = await fetch(url, { headers: { accept: 'application/json' } })
    if (!response.ok) return cache.map

    const data = await response.json()
    const map = {}
    for (const doc of data?.docs || []) {
      if (doc?.from && doc?.to) {
        map[normalize(doc.from)] = { to: doc.to, type: doc.type === '302' ? 302 : 301 }
      }
    }
    cache = { at: Date.now(), map }
    return map
  } catch {
    return cache.map
  }
}

function normalize(path) {
  const clean = String(path || '').split('?')[0].replace(/\/+$/, '')
  return clean || '/'
}

export async function proxy(request) {
  const { pathname, origin } = request.nextUrl
  const map = await loadRedirects(origin)
  const match = map[normalize(pathname)]

  if (!match) return NextResponse.next()

  const destination = /^https?:\/\//i.test(match.to)
    ? match.to
    : new URL(match.to.startsWith('/') ? match.to : `/${match.to}`, origin).toString()

  return NextResponse.redirect(destination, match.type)
}

export const config = {
  matcher: ['/((?!_next|admin|api|.*\\.[^/]+$).*)'],
}

