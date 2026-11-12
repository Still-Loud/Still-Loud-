/**
 * Real Cloudinary round-trip test.
 *
 *   node --env-file=.env scripts/test-cloudinary.mjs
 *
 * Uploads one image into every folder, replaces an image, uploads a short
 * video, checks delivery URLs and metadata, then deletes every test asset and
 * confirms nothing is left behind. Self-cleaning.
 */
import path from 'path'

import { getPayload } from 'payload'

import config from '../payload.config.js'
import { mediaDeliveryUrl, mediaPosterUrl, publicIdFor } from '../lib/cloudinaryAdapter.js'

const CLOUD = process.env.CLOUDINARY_CLOUD_NAME
const KEY = process.env.CLOUDINARY_API_KEY
const SECRET = process.env.CLOUDINARY_API_SECRET
const AUTH = `Basic ${Buffer.from(`${KEY}:${SECRET}`).toString('base64')}`

const TMP = path.join(process.env.TEMP || process.env.TMP || '.', 'stillloud-cloudinary-test')
const IMAGE_A = path.join(TMP, 'a', 'test-image.webp')
const IMAGE_REPLACEMENT = path.join(TMP, 'b', 'test-image.webp')
const VIDEO = path.join(TMP, 'a', 'test-video.mp4')

const folders = [
  'stillloud/projects',
  'stillloud/testimonials',
  'stillloud/blogs',
  'stillloud/homepage',
  'stillloud/pages',
]

const payload = await getPayload({ config })
const created = []
const results = []

function check(label, ok, detail = '') {
  results.push({ label, ok, detail })
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}${detail ? ` — ${detail}` : ''}`)
}

async function fetchWithTimeout(url, options = {}, ms = 20000) {
  return fetch(url, { ...options, signal: AbortSignal.timeout(ms) })
}

async function admin(pathname) {
  const response = await fetchWithTimeout(`https://api.cloudinary.com/v1_1/${CLOUD}${pathname}`, {
    headers: { Authorization: AUTH },
  })
  return { status: response.status, body: await response.json().catch(() => ({})) }
}

async function exists(publicId, resourceType = 'image') {
  if (!publicId) return false
  const { status, body } = await admin(
    `/resources/${resourceType}/upload?public_ids[]=${encodeURIComponent(publicId)}`
  )
  return status === 200 && Array.isArray(body.resources) && body.resources.length > 0
}

async function head(url) {
  if (!url) return 0
  try {
    const response = await fetchWithTimeout(url, { method: 'HEAD' })
    return response.status
  } catch {
    return 0
  }
}

function validSizes(doc) {
  return Object.entries(doc?.sizes || {})
    .filter(([, size]) => size?.filename)
    .map(([name, size]) => ({ name, ...size }))
}

function assetIds(doc) {
  const ids = []
  if (doc?.cloudinaryPublicId) ids.push({ id: doc.cloudinaryPublicId, type: doc.resourceType })
  for (const size of validSizes(doc)) {
    ids.push({ id: publicIdFor(doc, size.filename), type: 'image' })
  }
  return ids
}

const reload = (doc) =>
  payload.findByID({ collection: 'media', id: doc.id, depth: 0, overrideAccess: true })

async function removeOldTestDocs() {
  const { docs } = await payload.find({
    collection: 'media',
    where: { alt: { contains: 'Cloudinary test' } },
    limit: 50,
    depth: 0,
    overrideAccess: true,
  })
  for (const doc of docs) {
    await payload.delete({ collection: 'media', id: doc.id, overrideAccess: true })
  }
  if (docs.length) console.log(`Removed ${docs.length} media doc(s) from an earlier run.`)
}

try {
  if (!CLOUD || !KEY || !SECRET) throw new Error('CLOUDINARY_* is not configured')
  await removeOldTestDocs()

  /* 1. Image upload into every folder. */
  for (const folder of folders) {
    console.log(`Uploading into ${folder}…`)
    const response = await payload.create({
      collection: 'media',
      data: { folder, alt: `Cloudinary test image (${folder})` },
      filePath: IMAGE_A,
      overrideAccess: true,
    })
    const doc = await reload(response)
    created.push(doc)

    const id = doc.cloudinaryPublicId
    check(`${folder}: public id`, Boolean(id) && id.startsWith(`${folder}/`), id)
    check(`${folder}: resource type`, doc.resourceType === 'image', doc.resourceType)
    check(`${folder}: delivery URL`, String(doc.url).includes('res.cloudinary.com'), doc.url)
    check(`${folder}: delivery reachable`, (await head(doc.url)) === 200, doc.url)
    check(`${folder}: original stored`, await exists(id, 'image'))

    const sizes = validSizes(doc)
    check(`${folder}: size generated`, sizes.length >= 1, `${sizes.length} size(s)`)
    for (const size of sizes) {
      check(`${folder}: ${size.name} URL`, (await head(size.url)) === 200, `${size.width}x${size.height}`)
      check(`${folder}: ${size.name} stored`, await exists(publicIdFor(doc, size.filename), 'image'))
    }
  }

  /* 2. Replace with a different file under the same name. */
  const before = created[0]
  const oldAssets = assetIds(before)
  console.log('Replacing the projects image…')
  const replacedResponse = await payload.update({
    collection: 'media',
    id: before.id,
    data: { alt: 'Cloudinary test image (replaced)' },
    filePath: IMAGE_REPLACEMENT,
    overrideAccess: true,
  })
  const replaced = await reload(replacedResponse)
  created[0] = replaced

  check('replace: bytes changed', replaced.bytes !== before.bytes, `${before.bytes} -> ${replaced.bytes}`)
  check('replace: delivery URL', String(replaced.url).includes('res.cloudinary.com'), replaced.url)
  check('replace: delivery reachable', (await head(replaced.url)) === 200, replaced.url)
  check('replace: cache busted', String(replaced.url).includes('?v='), replaced.url?.split('?')[1])
  check('replace: new asset stored', await exists(replaced.cloudinaryPublicId, 'image'))
  for (const old of oldAssets) {
    check(`replace: old ${old.id} removed`, !(await exists(old.id, old.type)))
  }
  for (const size of validSizes(replaced)) {
    check(`replace: ${size.name} stored`, await exists(publicIdFor(replaced, size.filename), 'image'))
  }

  /* 3. Video upload. */
  console.log('Uploading the video…')
  const videoResponse = await payload.create({
    collection: 'media',
    data: { folder: 'stillloud/projects', alt: 'Cloudinary test video' },
    filePath: VIDEO,
    overrideAccess: true,
  })
  const video = await reload(videoResponse)
  created.push(video)
  check('video: resource type', video.resourceType === 'video', video.resourceType)
  check('video: format', video.format === 'mp4', video.format)
  check('video: duration', Number(video.duration) > 1.5, `${video.duration}s`)
  check(
    'video: width/height',
    video.width === 320 && video.height === 240,
    `${video.width}x${video.height}`
  )
  check('video: bytes', Number(video.bytes) > 0, `${video.bytes}`)
  check('video: delivery URL', String(video.url).includes('res.cloudinary.com'), video.url)
  check('video: delivery reachable', (await head(video.url)) === 200, video.url)
  check('video: stored', await exists(video.cloudinaryPublicId, 'video'))
  const poster = mediaPosterUrl(video)
  check('video: poster frame', (await head(poster)) === 200, poster)

  /* 4. Deterministic URL helper matches the document. */
  const computed = mediaDeliveryUrl(replaced, replaced.filename)
  check('url helper matches document', computed === replaced.url, computed)
} catch (error) {
  check('unexpected error', false, String(error?.message || error))
} finally {
  /* 5. Delete everything and confirm there are no orphans. */
  const expected = created.flatMap(assetIds)

  for (const doc of created) {
    if (!doc?.id) continue
    try {
      await payload.delete({ collection: 'media', id: doc.id, overrideAccess: true })
    } catch (error) {
      check(`cleanup: delete ${doc.id}`, false, String(error?.message || error))
    }
  }

  for (const { id, type } of expected) {
    check(`cleanup: ${id}`, !(await exists(id, type || 'image')))
  }

  const listing = await admin('/resources/image/upload?prefix=stillloud/&max_results=100')
  const leftovers = (listing.body.resources || []).filter(
    (asset) => !expected.some((entry) => entry.id === asset.public_id)
  )
  check('cleanup: no image orphans under stillloud/', leftovers.length === 0, `${leftovers.length}`)

  const failed = results.filter((result) => !result.ok)
  console.log(`\n${results.length - failed.length}/${results.length} checks passed`)
  if (failed.length) {
    console.log('Failures:')
    for (const failure of failed) console.log(`- ${failure.label} ${failure.detail}`)
  }
  process.exit(failed.length ? 1 : 0)
}
