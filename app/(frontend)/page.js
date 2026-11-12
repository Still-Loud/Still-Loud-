import Navbar from '../../components/Navbar'
import Hero from '../../components/Hero'
import About from '../../components/About'
import Services from '../../components/Services'
import Portfolio from '../../components/Portfolio'
import Testimonials from '../../components/Testimonials'
import Marquee from '../../components/Marquee'
import Pricing from '../../components/Pricing'
import Footer from '../../components/Footer'
import BackToTop from '../../components/BackToTop'
import TawkTo from '../../components/TawkTo'
import { isPreview } from '../../lib/draft'
import { buildSeoMetadata } from '../../lib/seo'
import { getPayloadClient } from '../../lib/payload'

export const revalidate = 300

const TITLE = 'StillLoud | Branding, Website Design & Creative Studio'
const DESCRIPTION =
  'Helping businesses grow through strategic branding, websites, social media design, and creative digital experiences.'

async function getHomeContent() {
  const preview = await isPreview()
  const payload = await getPayloadClient()

  const home = await payload.findGlobal({
    slug: 'home-page',
    depth: 2,
    draft: preview,
    overrideAccess: preview,
  })

  const limit = Math.min(Math.max(Number(home?.testimonialsLimit) || 6, 1), 12)

  const { docs: testimonials } = await payload.find({
    collection: 'testimonials',
    where: {
      _status: { equals: 'published' },
      featured: { equals: true },
    },
    sort: 'order',
    limit,
    depth: 1,
    overrideAccess: false,
  })

  let { docs: projects } = await payload.find({
    collection: 'projects',
    where: {
      _status: { equals: 'published' },
      featured: { equals: true },
    },
    sort: 'order',
    limit: 2,
    depth: 1,
    overrideAccess: false,
  })

  if (projects.length === 0) {
    const fallback = await payload.find({
      collection: 'projects',
      where: { _status: { equals: 'published' } },
      sort: 'order',
      limit: 2,
      depth: 1,
      overrideAccess: false,
    })
    projects = fallback.docs
  }

  return { home: home || {}, testimonials, projects }
}

export async function generateMetadata() {
  const { home } = await getHomeContent()

  return buildSeoMetadata({
    seo: home?.seo,
    title: TITLE,
    description: DESCRIPTION,
    path: '/',
  })
}

export default async function HomePage() {
  const { home, testimonials, projects } = await getHomeContent()

  return (
    <>
      <BackToTop />

      {/* Top Hero & Navbar Wrapper (Cream Card) */}
      <div className="top-hero-card">
        <div className="grid-overlay"></div>
        <Navbar />
        {home.showHero !== false && <Hero content={home} />}
      </div>

      <div className="premium-bg-wrapper">
        {home.showAbout !== false && <About content={home} />}
        {home.showServices !== false && <Services content={home} />}
        {home.showPortfolio !== false && <Portfolio content={home} projects={projects} />}
        {home.showTestimonials !== false && (
          <Testimonials content={home} testimonials={testimonials} />
        )}
        <Marquee />
        {home.showPricing !== false && <Pricing content={home} />}
      </div>

      {home.showFooter !== false && <Footer content={home} />}
      <TawkTo />
    </>
  )
}
