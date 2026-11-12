import Link from 'next/link'

import { formatMonth, mediaAlt, mediaPosterUrl, mediaUrl } from '../../lib/media'
import { PROJECT_CATEGORY_LABELS } from '../../lib/projects'

/* Project card used by /projects and the related-projects strip. */
export default function ProjectCard({ project }) {
  const isVideo = project.mediaType === 'video'
  const image = mediaUrl(project.image, 'card')
  const poster =
    mediaUrl(project.poster, 'card') || mediaPosterUrl(project.poster) || image

  return (
    <Link href={`/projects/${project.slug}`} className="blog-card project-card">
      <div className="blog-card-media project-card-media">
        {isVideo && (project.videoUrl || project.video?.url) ? (
          <video
            src={project.videoUrl || project.video?.url}
            poster={poster || undefined}
            muted
            loop
            playsInline
            preload="metadata"
            aria-label={`${project.title} preview`}
          />
        ) : image ? (
          <img src={image} alt={mediaAlt(project.image, project.alt || project.title)} loading="lazy" decoding="async" />
        ) : (
          <div className="blog-card-placeholder" aria-hidden="true">
            StillLoud
          </div>
        )}
      </div>

      <div className="blog-card-body">
        <div className="blog-card-cats">
          <span className="blog-cat-pill">
            {PROJECT_CATEGORY_LABELS[project.category] || 'Project'}
          </span>
          {project.featured && <span className="blog-cat-pill">Featured</span>}
        </div>

        <h2 className="blog-card-title">{project.title}</h2>
        {project.description && <p className="blog-card-excerpt">{project.description}</p>}

        <div className="blog-card-meta">
          {project.client && <span>{project.client}</span>}
          {project.client && formatMonth(project.completionDate) ? <span className="dot" /> : null}
          {formatMonth(project.completionDate) && <span>{formatMonth(project.completionDate)}</span>}
        </div>
      </div>
    </Link>
  )
}
