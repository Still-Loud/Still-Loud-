/**
 * Custom Cloudinary storage adapter for @payloadcms/plugin-cloud-storage.
 *
 * There is no officially supported Cloudinary adapter for Payload 3.93, so this
 * implements the documented `GeneratedAdapter` contract with the official
 * Cloudinary SDK:
 *
 *   handleUpload  -> upload_stream (original + every Payload image size)
 *   generateURL   -> deterministic delivery URL, computed from the document
 *   handleDelete  -> uploader.destroy, called by the plugin on replace/delete
 *   staticHandler -> 404 (files are served from Cloudinary, never proxied)
 *
 * Public ids are deterministic: `<folder>/<docId>-<filename>-<ext>`. That makes
 * generateURL work for image sizes too (Payload appends the size to the
 * filename), survives replacements, and gives the plugin something stable to
 * delete.
 */
import {
  deliveryUrl,
  destroyAsset,
  isCloudinaryConfigured,
  resourceTypeForMime,
  safePublicId,
  uploadBuffer,
  videoPosterUrl,
} from './cloudinary.js'

export const DEFAULT_MEDIA_FOLDER = 'stillloud/pages'

export function publicIdFor(data, filename) {
  const folder = data?.folder || DEFAULT_MEDIA_FOLDER
  const idPrefix = data?.id ? `${data.id}-` : ''
  /* Keep the extension in the id: replacing a.jpg with a.png must not collide
     with the asset the plugin is about to delete. */
  const name = safePublicId(`${idPrefix}${filename}`).replace(/\./g, '-')
  return `${folder}/${name}`
}

const cacheKeyFor = (data) => {
  if (!data?.updatedAt) return undefined
  const time = new Date(data.updatedAt).getTime()
  return Number.isNaN(time) ? undefined : time
}

export function mediaDeliveryUrl(data, filename) {
  const publicId = publicIdFor(data, filename)
  const resourceType = data?.resourceType || 'image'
  /* The public id stores the extension as a hyphen (-jpg) so replacements
     never collide, so the real extension comes from the filename. */
  const format = String(filename || '').includes('.')
    ? String(filename).split('.').pop().toLowerCase()
    : data?.format || undefined
  return deliveryUrl({ publicId, resourceType, format, cacheKey: cacheKeyFor(data) })
}

export function mediaPosterUrl(data) {
  if (!data?.cloudinaryPublicId) return null
  return videoPosterUrl({
    publicId: data.cloudinaryPublicId,
    cacheKey: cacheKeyFor(data),
  })
}

export function createCloudinaryAdapter() {
  return () => ({
    name: 'cloudinary',

    async handleUpload({ data, file }) {
      if (!isCloudinaryConfigured()) return undefined

      const resourceType = resourceTypeForMime(file.mimeType)
      const publicId = publicIdFor(data, file.filename)

      const result = await uploadBuffer({
        buffer: file.buffer,
        publicId,
        resourceType,
        context: `filename=${file.filename}`,
      })

      /* Payload calls handleUpload once per image size. Only the original
         should write document-level metadata — returning it for sizes would
         overwrite the parent values with the scaled dimensions. */
      if (file.imageSizeName) return undefined

      return {
        cloudinaryPublicId: result.public_id,
        cloudinaryUrl: result.secure_url,
        resourceType: result.resource_type,
        format: result.format,
        bytes: result.bytes,
        width: result.width,
        height: result.height,
        duration: typeof result.duration === 'number' ? Math.round(result.duration * 10) / 10 : null,
        /* Persist a correct URL immediately. Without this the create response
           (which does not run the read hook) points at the local file route. */
        url: deliveryUrl({
          publicId: result.public_id,
          resourceType: result.resource_type,
          format: result.format,
        }),
      }
    },

    generateURL({ data, filename }) {
      if (!isCloudinaryConfigured() || !data) {
        return `/media/${filename}`
      }

      /* A document uploaded before Cloudinary was enabled has no public id;
         it is still served from local disk. */
      if (!data.cloudinaryPublicId) {
        return data.url || `/media/${filename}`
      }

      return mediaDeliveryUrl(data, filename)
    },

    async handleDelete({ doc, filename }) {
      if (!isCloudinaryConfigured()) return
      if (!doc) return

      /* The plugin calls this once for the original and once per generated
         image size. The document-level `cloudinaryPublicId` only identifies the
         original, so sizes must be derived from their own filename or they are
         left behind as orphans. */
      const isOriginal = !doc.filename || !filename || doc.filename === filename
      const publicId = isOriginal
        ? doc.cloudinaryPublicId || publicIdFor(doc, filename)
        : publicIdFor(doc, filename)
      if (!publicId) return

      await destroyAsset({
        publicId,
        resourceType: doc.resourceType || 'image',
      })
    },

    staticHandler() {
      return new Response('Not found', { status: 404 })
    },
  })
}
