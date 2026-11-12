/**
 * Pre-build environment check.
 *
 * Vercel builds the static pages by initialising Payload, so the build machine
 * needs the same secrets as the runtime. Without them the build fails deep
 * inside a prerender with "missing secret key" or a database error, which is
 * hard to trace. This script runs before `next build` and prints which expected
 * variables are visible. It never prints a value.
 *
 * Locally, `.env` is loaded first so `npm run build` behaves like `npm run dev`.
 */
import { existsSync } from 'node:fs'

if (typeof process.loadEnvFile === 'function' && existsSync('.env')) {
  try {
    process.loadEnvFile('.env')
  } catch {
    /* A malformed .env is reported by the checks below, not here. */
  }
}

function has(name) {
  const value = process.env[name]
  return typeof value === 'string' && value.trim() !== ''
}

const onVercel = Boolean(process.env.VERCEL)
const missing = []
const warnings = []

const database = has('DATABASE_URL')
  ? 'DATABASE_URL'
  : has('DATABASE_URI')
    ? 'DATABASE_URI'
    : null
if (!database) missing.push('DATABASE_URL (or DATABASE_URI)')

if (!has('PAYLOAD_SECRET')) {
  missing.push('PAYLOAD_SECRET')
} else if ((process.env.PAYLOAD_SECRET || '').length < 32) {
  warnings.push('PAYLOAD_SECRET is shorter than 32 characters; use a longer random value.')
}

if (!has('NEXT_PUBLIC_SERVER_URL')) {
  if (onVercel) missing.push('NEXT_PUBLIC_SERVER_URL')
  else warnings.push('NEXT_PUBLIC_SERVER_URL is not set; absolute URLs fall back to http://localhost:3000.')
} else if (onVercel && /localhost|127\.0\.0\.1/i.test(process.env.NEXT_PUBLIC_SERVER_URL)) {
  missing.push('NEXT_PUBLIC_SERVER_URL (it must be the public domain, not localhost)')
}

const cloudinary = ['CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET']
const cloudinarySet = cloudinary.filter(has)
if (cloudinarySet.length > 0 && cloudinarySet.length < cloudinary.length) {
  warnings.push(`Cloudinary is partially configured (${cloudinarySet.join(', ')}); uploads stay on local disk until all three are set.`)
} else if (cloudinarySet.length === 0 && onVercel) {
  warnings.push('Cloudinary is not configured; production uploads will fail on the read-only filesystem.')
}

const checked = [
  'DATABASE_URL',
  'DATABASE_URL_UNPOOLED',
  'DATABASE_URI',
  'PAYLOAD_SECRET',
  'NEXT_PUBLIC_SERVER_URL',
  'CLOUDINARY_CLOUD_NAME',
  'CLOUDINARY_API_KEY',
  'CLOUDINARY_API_SECRET',
  'BREVO_SMTP_HOST',
  'BREVO_SMTP_USER',
  'EMAIL_FROM',
]

console.log(`Build environment check${onVercel ? ' (Vercel)' : ''} — values are never printed:`)
if (onVercel) {
  console.log(
    `  context: VERCEL_ENV=${process.env.VERCEL_ENV || 'unknown'} repo=${
      process.env.VERCEL_GIT_REPO_SLUG || 'unknown'
    } branch=${process.env.VERCEL_GIT_COMMIT_REF || 'unknown'}`
  )
}
for (const name of checked) {
  console.log(`  ${has(name) ? 'set    ' : 'missing'}  ${name}`)
}

for (const warning of warnings) {
  console.warn(`warning: ${warning}`)
}

if (missing.length > 0) {
  console.error('')
  console.error(`Build stopped: missing required environment variable(s): ${missing.join(', ')}`)
  console.error('')
  console.error('Add them in Vercel -> Project -> Settings -> Environment Variables for')
  console.error('Production, Preview and Development, then trigger a new deployment.')
  console.error('Environment variable changes do not apply to existing deployments.')
  console.error('If a variable is set in the dashboard but listed as missing above, it is')
  console.error('scoped to a different environment or a different Vercel project.')
  process.exit(1)
}

console.log('Environment check passed.')
