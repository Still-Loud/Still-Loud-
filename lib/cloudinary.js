/**
 * Server-only Cloudinary helpers.
 *
 * Credentials come from CLOUDINARY_CLOUD_NAME / CLOUDINARY_API_KEY /
 * CLOUDINARY_API_SECRET. Nothing here may be imported by a client component —
 * the SDK and the API secret would end up in the browser bundle.
 */
import { Readable } from 'node:stream'

import { v2 as cloudinary } from 'cloudinary'

const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME
const API_KEY = process.env.CLOUDINARY_API_KEY
const API_SECRET = process.env.CLOUDINARY_API_SECRET

let configured = false

export function isCloudinaryConfigured() {
  return Boolean(CLOUD_NAME && API_KEY && API_SECRET)
}

function sdk() {
  if (!isCloudinaryConfigured()) {
    throw new Error('Cloudinary credentials are not configured')
  }
  if (!configured) {
    cloudinary.config({
      cloud_name: CLOUD_NAME,
      api_key: API_KEY,
      api_secret: API_SECRET,
      secure: true,
    })
    configured = true
  }
  return cloudinary
}

export function resourceTypeForMime(mimeType = '') {
  if (mimeType.startsWith('video/')) return 'video'
  if (mimeType.startsWith('image/')) return 'image'
  return 'raw'
}

/** Cloudinary rejects spaces and a few characters in public ids. */
export function safePublicId(value = '') {
  return String(value)
    .normalize('NFKD')
    .replace(/[^\w./-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

/**
 * Upload a Buffer with upload_stream (the SDK's recommended server-side path).
 * `overwrite` + `invalidate` make a replacement with the same public id safe.
 */
export async function uploadBuffer({ buffer, publicId, resourceType, context }) {
  const client = sdk()

  return new Promise((resolve, reject) => {
    const stream = client.uploader.upload_stream(
      {
        resource_type: resourceType,
        public_id: publicId,
        overwrite: true,
        invalidate: true,
        unique_filename: false,
        use_filename: false,
        timeout: 180000,
        ...(context ? { context } : {}),
      },
      (error, result) => {
        if (error) return reject(error)
        return resolve(result)
      }
    )

    Readable.from(buffer).pipe(stream)
  })
}

/** Deletes one delivered asset. A missing asset is not an error. */
export async function destroyAsset({ publicId, resourceType = 'image' }) {
  if (!publicId || !isCloudinaryConfigured()) return { result: 'skipped' }
  try {
    return await sdk().uploader.destroy(publicId, {
      resource_type: resourceType,
      invalidate: true,
    })
  } catch (error) {
    if (error?.http_code === 404) return { result: 'not found' }
    throw error
  }
}

/** Public delivery URL. `cacheKey` busts browser/CDN caches after a replace. */
export function deliveryUrl({ publicId, resourceType = 'image', format, cacheKey }) {
  if (!publicId || !CLOUD_NAME) return null
  const transforms = resourceType === 'video' ? 'q_auto' : 'f_auto,q_auto'
  const extension = format ? `.${format}` : ''
  const base = `https://res.cloudinary.com/${CLOUD_NAME}/${resourceType}/upload/${transforms}/${publicId}${extension}`
  return cacheKey ? `${base}?v=${cacheKey}` : base
}

/** Video poster frame (first non-black-ish second, 720 px wide). */
export function videoPosterUrl({ publicId, cacheKey }) {
  if (!publicId || !CLOUD_NAME) return null
  const base = `https://res.cloudinary.com/${CLOUD_NAME}/video/upload/so_0,w_720,q_auto/${publicId}.jpg`
  return cacheKey ? `${base}?v=${cacheKey}` : base
}
