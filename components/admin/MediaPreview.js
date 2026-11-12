'use client'

import { useDocumentInfo } from '@payloadcms/ui'

/**
 * Preview for the Media edit view.
 *
 * Images get a scaled <img>; videos get a real player with a Cloudinary poster
 * frame, so an editor can confirm a reel before publishing.
 */

function posterFromVideoUrl(url) {
  if (!url) return undefined
  return url
    .replace('/video/upload/', '/video/upload/so_0,w_720,q_auto/')
    .replace(/\.[a-z0-9]+(\?.*)?$/i, '.jpg$1')
}

function formatDuration(seconds) {
  if (!seconds || Number.isNaN(Number(seconds))) return null
  const total = Math.round(Number(seconds))
  const minutes = Math.floor(total / 60)
  const rest = String(total % 60).padStart(2, '0')
  return `${minutes}:${rest}`
}

function formatBytes(bytes) {
  if (!bytes) return null
  const mb = Number(bytes) / (1024 * 1024)
  if (mb >= 1) return `${mb.toFixed(1)} MB`
  return `${Math.round(Number(bytes) / 1024)} KB`
}

export function MediaPreview() {
  const { data } = useDocumentInfo()

  const url = data?.cloudinaryUrl || data?.url
  if (!url) return null

  const isVideo = String(data?.mimeType || '').startsWith('video/')
  const meta = [
    data?.format ? String(data.format).toUpperCase() : null,
    data?.width && data?.height ? `${data.width}x${data.height}` : null,
    isVideo ? formatDuration(data?.duration) : null,
    formatBytes(data?.bytes || data?.filesize),
  ].filter(Boolean)

  return (
    <div style={{ margin: '8px 0 24px' }}>
      {isVideo ? (
        <video
          controls
          preload="metadata"
          src={url}
          poster={posterFromVideoUrl(url)}
          style={{
            display: 'block',
            width: '100%',
            maxWidth: '420px',
            borderRadius: '12px',
            background: '#111',
          }}
        />
      ) : (
        <img
          src={data?.sizes?.card?.url || url}
          alt={data?.alt || ''}
          style={{
            display: 'block',
            width: '100%',
            maxWidth: '420px',
            height: 'auto',
            borderRadius: '12px',
            border: '1px solid var(--theme-elevation-100, #2a2a2a)',
          }}
        />
      )}

      {meta.length > 0 && (
        <p style={{ margin: '8px 0 0', fontSize: '12px', opacity: 0.7 }}>
          {meta.join(' · ')}
        </p>
      )}
    </div>
  )
}
