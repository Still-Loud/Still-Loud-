import { NextResponse } from 'next/server'

import { rateLimit } from './lib/rateLimit.js'

/**
 * Two jobs, both before the route renders:
 *
 *   1. Apply the editable Redirects collection with real 301/302 status codes.
 *   2. Throttle the unauthenticated auth endpoints by client IP (login,
 *      forgot-password, reset-password). Payload's per-account lockout remains
 *      the backstop for repeated password failures.
 *
 * `next/navigation` can only issue 307/308, so redirects must happen here.
 * The redirect list is cached per server instance for a minute to avoid a
 * database round-trip on every page view.
 */
const TTL = 60 * 1000
let cache = { at: 0, map: {} }

const THROTTLED = {
  '/api/users/login': { limit: 10, windowMs: 5 * 60 * 1000, message: 'Too many sign-in attempts. Please wait a few minutes and try again.' },
  '/api/users/forgot-password': { limit: 5, windowMs: 15 * 60 * 1000, message: 'Too many password-reset requests. Please wait and try again.' },
  '/api/users/reset-password': { limit: 10, windowMs: 15 * 60 * 1000, message: 'Too many password-reset attempts. Please wait and try again.' },
}

function ipFor(request) {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0].trim()
  return request.headers.get('x-real-ip') || request.headers.get('x-vercel-forwarded-for') || 'unknown'
}

function throttle(request) {
  const config = THROTTLED[request.nextUrl.pathname]
  if (!config || request.method !== 'POST') return null

  const result = rateLimit({
    key: `${request.nextUrl.pathname}:${ipFor(request)}`,
    limit: config.limit,
    windowMs: config.windowMs,
  })

  if (result.ok) return null

  return NextResponse.json(
    { errors: [{ message: config.message }] },
    { status: 429, headers: { 'Retry-After': String(result.retryAfter) } }
  )
}

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

  const blocked = throttle(request)
  if (blocked) return blocked

  /* API requests that are not throttled skip the redirect lookup. */
  if (pathname.startsWith('/api/')) return NextResponse.next()

  const map = await loadRedirects(origin)
  const match = map[normalize(pathname)]

  if (!match) return NextResponse.next()

  const destination = /^https?:\/\//i.test(match.to)
    ? match.to
    : new URL(match.to.startsWith('/') ? match.to : `/${match.to}`, origin).toString()

  return NextResponse.redirect(destination, match.type)
}

export const config = {
  matcher: [
    '/((?!_next|admin|api|.*\\.[^/]+$).*)',
    '/api/users/login',
    '/api/users/forgot-password',
    '/api/users/reset-password',
  ],
}

