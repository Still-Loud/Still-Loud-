import { RichText } from '@payloadcms/richtext-lexical/react'
import { notFound } from 'next/navigation'
import { cache } from 'react'

import '../../../../styles/blog.css'
import '../../../../styles/projects.css'

import BackToTop from '../../../../components/BackToTop'
import Footer from '../../../../components/Footer'
import Navbar from '../../../../components/Navbar'
import ProjectCard from '../../../../components/projects/ProjectCard'
import TawkTo from '../../../../components/TawkTo'
import { isPreview } from '../../../../lib/draft'
import { absoluteMediaUrl, formatMonth, mediaAlt, mediaPosterUrl, mediaUrl } from '../../../../lib/media'
import { getPayloadClient } from '../../../../lib/payload'
import { PROJECT_CATEGORY_LABELS } from '../../../../lib/projects'
import { absoluteUrl, breadcrumbSchema, buildSeoMetadata } from '../../../../lib/seo'

export const revalidate = 300

const getProject = cache(async (slug) => {
  const preview = await isPreview()
  const payload = await getPayloadClient()

  const { docs } = await payload.find({
    collection: 'projects',
    where: preview
      ? { slug: { equals: slug } }
      : { slug: { equals: slug }, _status: { equals: 'published' } },
    limit: 1,
    depth: 2,
    draft: preview,
    overrideAccess: preview,
  })

  return docs[0] || null
})

export async function generateMetadata({ params }) {
  const { slug } = await params
  const project = await getProject(slug)

  if (!project) {
    return {
      title: 'Project Not Found | StillLoud',
      robots: { index: false, follow: false },
    }
  }

  return buildSeoMetadata({
    seo: project.seo,
    title: `${project.title} | StillLoud`,
    description: project.description || `A StillLoud project for ${project.client || 'a client'}.`,
    path: `/projects/${project.slug}`,
    image: project.seo?.ogImage || project.image,
  })
}

export default async function ProjectDetailPage({ params }) {
  const { slug } = await params
  const project = await getProject(slug)
  if (!project) notFound()

  const preview = await isPreview()
  const payload = await getPayloadClient()
  const url = `/projects/${project.slug}`

  const { docs: relatedFromCategory } = await payload.find({
    collection: 'projects',
    where: {
      _status: { equals: 'published' },
      id: { not_equals: project.id },
      ...(project.category ? { category: { equals: project.category } } : {}),
    },
    sort: 'order',
    limit: 3,
    depth: 1,
    overrideAccess: false,
  })

  /* A manual selection wins. Only published projects may surface publicly,
     even if an editor linked a draft before publishing it. */
  const manualRelated = (project.relatedProjects || []).filter(
    (item) =>
      item &&
      typeof item === 'object' &&
      item.id !== project.id &&
      (preview || item._status === 'published')
  )
  const related = (manualRelated.length > 0 ? manualRelated : relatedFromCategory).slice(0, 3)

  const isVideo = project.mediaType === 'video'
  const image = mediaUrl(project.image, 'hero')
  const videoSrc = project.videoUrl || mediaUrl(project.video)
  const poster = mediaUrl(project.poster, 'card') || mediaPosterUrl(project.poster) || image
  const categoryLabel = PROJECT_CATEGORY_LABELS[project.category] || 'Project'
  const services = (project.services || []).filter(Boolean)
  const gallery = (project.gallery || []).filter((item) => item?.image)
  const videoGallery = (project.videoGallery || []).filter((item) => item?.video)
  const externalLinks = (project.externalLinks || []).filter((link) => link?.url)
  const caseStudySections = [
    { title: 'Objective', body: project.objective },
    { title: 'Challenge', body: project.challenge },
    { title: 'Strategy', body: project.strategy },
    { title: 'Creative process', body: project.creativeProcess },
    { title: 'Final solution', body: project.finalSolution },
  ].filter((section) => section.body)

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'CreativeWork',
    name: project.title,
    description: project.seo?.metaDescription || project.description || undefined,
    image: absoluteMediaUrl(project.seo?.ogImage || project.image, 'hero') || undefined,
    dateCreated: project.completionDate || undefined,
    dateModified: project.updatedAt,
    creator: { '@type': 'Organization', name: 'StillLoud', url: absoluteUrl('/') },
    url: absoluteUrl(url),
    ...(project.client ? { about: { '@type': 'Organization', name: project.client } } : {}),
  }

  const breadcrumbs = breadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'Projects', url: '/projects' },
    { name: project.title, url },
  ])

  return (
    <div className="blog-page project-detail-page">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbs) }}
      />

      <BackToTop />
      <Navbar variant="work" />

      {preview && (
        <div className="preview-banner" role="status">
          Draft preview — this page is not public.{' '}
          <a href={`/api/exit-preview?path=${encodeURIComponent(url)}`}>Exit preview</a>
        </div>
      )}

      <article>
        <header className="post-hero project-post-hero">
          <div className="post-hero-inner">
            <nav className="post-breadcrumb" aria-label="Breadcrumb">
              <a href="/">Home</a>
              <i className="fas fa-chevron-right" aria-hidden="true" />
              <a href="/projects">Projects</a>
              <i className="fas fa-chevron-right" aria-hidden="true" />
              <span aria-current="page">{project.title}</span>
            </nav>

            <div className="post-cats">
              <span className="blog-cat-pill">{categoryLabel}</span>
              {project.featured && <span className="blog-cat-pill">Featured</span>}
            </div>

            <h1 className="post-title">{project.title}</h1>

            <div className="post-meta">
              {project.client && <span>{project.client}</span>}
              {project.client && formatMonth(project.completionDate) ? <span className="dot" /> : null}
              {formatMonth(project.completionDate) && <span>{formatMonth(project.completionDate)}</span>}
            </div>
          </div>

          <div className="post-hero-image project-hero-media">
            {isVideo && videoSrc ? (
              <video
                src={videoSrc}
                poster={poster || undefined}
                controls
                playsInline
                preload="metadata"
                aria-label={`${project.title} video`}
              />
            ) : image ? (
              <img
                src={image}
                alt={mediaAlt(project.image, project.alt || project.title)}
                width={project.image?.width || undefined}
                height={project.image?.height || undefined}
                decoding="async"
              />
            ) : null}
          </div>
        </header>

        <div className="post-body project-body">
          <div className="post-content">
            {project.description && (
              <p className="project-lede">{project.description}</p>
            )}
            {project.content ? (
              <RichText data={project.content} />
            ) : (
              !project.description && (
                <p>The full story for this project is coming soon.</p>
              )
            )}

            {caseStudySections.length > 0 && (
              <section className="project-case-study" aria-label="Case study">
                {caseStudySections.map((section) => (
                  <div key={section.title} className="project-case-section">
                    <h2>{section.title}</h2>
                    <p>{section.body}</p>
                  </div>
                ))}
              </section>
            )}

            {videoGallery.length > 0 && (
              <section className="project-gallery project-video-gallery" aria-label="Project videos">
                <h2>Project videos</h2>
                <div className="project-gallery-grid">
                  {videoGallery.map((item, index) => (
                    <figure key={item.id || `video-${index}`}>
                      <video
                        src={mediaUrl(item.video)}
                        poster={mediaPosterUrl(item.video) || undefined}
                        controls
                        playsInline
                        preload="metadata"
                        aria-label={item.caption || `${project.title} video ${index + 1}`}
                      />
                      {item.caption && <figcaption>{item.caption}</figcaption>}
                    </figure>
                  ))}
                </div>
              </section>
            )}

            {gallery.length > 0 && (
              <section className="project-gallery" aria-label="Project gallery">
                <h2>Project gallery</h2>
                <div className="project-gallery-grid">
                  {gallery.map((item, index) => (
                    <figure key={item.id || index}>
                      <img
                        src={mediaUrl(item.image, 'card')}
                        alt={mediaAlt(item.image, item.caption || `${project.title} image ${index + 1}`)}
                        loading="lazy"
                        decoding="async"
                      />
                      {item.caption && <figcaption>{item.caption}</figcaption>}
                    </figure>
                  ))}
                </div>
              </section>
            )}
          </div>

          <aside className="project-facts" aria-label="Project details">
            <h2>Project details</h2>
            <dl>
              {project.client && (
                <>
                  <dt>Client</dt>
                  <dd>{project.client}</dd>
                </>
              )}
              <dt>Category</dt>
              <dd>{categoryLabel}</dd>
              {formatMonth(project.completionDate) && (
                <>
                  <dt>Completed</dt>
                  <dd>{formatMonth(project.completionDate)}</dd>
                </>
              )}
              {services.length > 0 && (
                <>
                  <dt>Services</dt>
                  <dd>
                    <ul>
                      {services.map((service, index) => (
                        <li key={service.id || index}>{service.label}</li>
                      ))}
                    </ul>
                  </dd>
                </>
              )}
              {project.externalUrl && (
                <>
                  <dt>Live link</dt>
                  <dd>
                    <a href={project.externalUrl} target="_blank" rel="noopener noreferrer">
                      Visit project <i className="fas fa-arrow-up-right-from-square" />
                    </a>
                  </dd>
                </>
              )}
              {externalLinks.length > 0 && (
                <>
                  <dt>Links</dt>
                  <dd>
                    <ul>
                      {externalLinks.map((link, index) => (
                        <li key={link.id || index}>
                          <a href={link.url} target="_blank" rel="noopener noreferrer">
                            {link.label || link.url}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </dd>
                </>
              )}
            </dl>

            <a href="/#contact" className="btn btn-pill-red project-cta">
              Start a project <i className="fas fa-arrow-right" />
            </a>
          </aside>
        </div>
      </article>

      {related.length > 0 && (
        <section className="post-related blog-container" aria-labelledby="related-projects-title">
          <h2 id="related-projects-title" className="post-related-title">
            More {categoryLabel.toLowerCase()} work
          </h2>
          <div className="blog-grid">
            {related.map((item) => (
              <ProjectCard key={item.id} project={item} />
            ))}
          </div>
        </section>
      )}

      <Footer variant="work" />
      <TawkTo />
    </div>
  )
}
