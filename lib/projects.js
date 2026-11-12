import { mediaPosterUrl, mediaUrl } from './media.js'

export const PROJECT_CATEGORY_LABELS = {
  creative: 'Creative',
  reels: 'Reels',
  branding: 'Branding',
  logo: 'Logo Design',
  printables: 'Printables',
}

const BADGES = {
  creative: 'Creative',
  reels: 'Reel',
  branding: 'Branding',
  logo: 'Logo',
  printables: 'Printables',
}

/** Turn a Payload project document into a WorkGallery card. */
export function projectToCard(project) {
  if (!project) return null
  const isVideo = project.mediaType === 'video'
  const src = isVideo
    ? project.videoUrl || mediaUrl(project.video)
    : mediaUrl(project.image, 'card')

  if (!src) return null

  return {
    type: isVideo ? 'video' : 'image',
    src: src || mediaUrl(project.poster, 'card'),
    poster: mediaPosterUrl(project.poster) || undefined,
    alt: project.alt || project.title,
    title: project.title,
    ariaLabel: isVideo ? `${project.title} video` : undefined,
    category: project.category || 'creative',
    categoryLabel: PROJECT_CATEGORY_LABELS[project.category] || 'Creative',
    badge: project.badge || BADGES[project.category] || 'Project',
    href: `/projects/${project.slug}`,
  }
}
