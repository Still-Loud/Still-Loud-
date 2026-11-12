import '../../../styles/blog.css'
import '../../../styles/projects.css'

import BackToTop from '../../../components/BackToTop'
import Footer from '../../../components/Footer'
import Navbar from '../../../components/Navbar'
import ProjectCard from '../../../components/projects/ProjectCard'
import TawkTo from '../../../components/TawkTo'
import { getPayloadClient } from '../../../lib/payload'
import { buildSeoMetadata } from '../../../lib/seo'

const TITLE = 'Projects | StillLoud Portfolio'
const DESCRIPTION =
  'Selected branding, social media, logo, print and video projects by StillLoud — with the story behind each one.'

export const metadata = buildSeoMetadata({
  title: TITLE,
  description: DESCRIPTION,
  path: '/projects',
})

export const revalidate = 300

export default async function ProjectsPage() {
  const payload = await getPayloadClient()
  const { docs: projects } = await payload.find({
    collection: 'projects',
    where: { _status: { equals: 'published' } },
    sort: 'order',
    limit: 200,
    depth: 1,
    overrideAccess: false,
  })

  return (
    <div className="blog-page projects-page">
      <BackToTop />
      <Navbar variant="work" />

      <section className="blog-hero project-hero">
        <div className="blog-hero-inner">
          <nav className="post-breadcrumb" aria-label="Breadcrumb">
            <a href="/">Home</a>
            <i className="fas fa-chevron-right" aria-hidden="true" />
            <span aria-current="page">Projects</span>
          </nav>
          <div className="blog-eyebrow">
            <span className="bullet-dot" aria-hidden="true" />
            Selected work
          </div>
          <h1 className="blog-title">
            Brands we&apos;ve made <span className="highlight-red">louder</span>
          </h1>
          <p className="blog-subtitle">
            Every project below is real client work: the brief, the thinking and the finished
            design.
          </p>
        </div>
      </section>

      <section className="blog-section" aria-label="All projects">
        <div className="blog-container">
          {projects.length > 0 ? (
            <div className="blog-grid project-grid">
              {projects.map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>
          ) : (
            <div className="blog-empty">
              <div className="blog-empty-icon" aria-hidden="true">
                <i className="fas fa-images" />
              </div>
              <h2>Projects are on their way</h2>
              <p>
                We are writing up recent work. In the meantime, browse the full gallery on{' '}
                <a href="/our-work">Our Work</a>.
              </p>
            </div>
          )}

          <p className="project-back-link">
            <a href="/our-work" className="btn btn-pill-red">
              Browse the full gallery <i className="fas fa-arrow-right" />
            </a>
          </p>
        </div>
      </section>

      <Footer variant="work" />
      <TawkTo />
    </div>
  )
}
