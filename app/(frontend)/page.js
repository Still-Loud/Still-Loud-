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
import { buildOpenGraph, buildTwitter } from '../../lib/metadata'

const TITLE = 'StillLoud | Branding, Website Design & Creative Studio'
const DESCRIPTION =
  'Helping businesses grow through strategic branding, websites, social media design, and creative digital experiences.'

export const metadata = {
  alternates: {
    canonical: '/',
  },
  openGraph: buildOpenGraph({
    title: TITLE,
    description: DESCRIPTION,
    path: '/',
  }),
  twitter: buildTwitter({ title: TITLE, description: DESCRIPTION }),
}

export default function HomePage() {
  return (
    <>
      <BackToTop />

      {/* Top Hero & Navbar Wrapper (Cream Card) */}
      <div className="top-hero-card">
        <div className="grid-overlay"></div>
        <Navbar />
        <Hero />
      </div>

      <div className="premium-bg-wrapper">
        <About />
        <Services />
        <Portfolio />
        <Testimonials />
        <Marquee />
        <Pricing />
      </div>

      <Footer />
      <TawkTo />
    </>
  )
}
