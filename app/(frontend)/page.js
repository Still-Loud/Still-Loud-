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

export const metadata = {
  alternates: {
    canonical: '/',
  },
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
