import '../../../styles/our-work.css'

import BackToTop from '../../../components/BackToTop'
import Navbar from '../../../components/Navbar'
import WorkHero from '../../../components/WorkHero'
import CaseStudy from '../../../components/CaseStudy'
import WorkGallery from '../../../components/WorkGallery'
import WorkCta from '../../../components/WorkCta'
import Footer from '../../../components/Footer'
import TawkTo from '../../../components/TawkTo'

export const metadata = {
  title: 'Our Work | StillLoud Portfolio — Creative, Logo & Branding Gallery',
  description:
    "Explore StillLoud's creative portfolio — social media creatives, logo design, branding, and printables. Premium design work built for brands that want to stand out.",
  keywords:
    'StillLoud portfolio, creative work, logo design, branding, social media creatives, printables, design agency portfolio, India',
  authors: [{ name: 'StillLoud' }],
  alternates: {
    canonical: '/our-work',
  },
  openGraph: {
    title: 'Our Work | StillLoud Portfolio',
    description:
      'Explore our gallery of social media creatives, logos, branding, and printable designs.',
    type: 'website',
  },
}

const creativeWorkSchema = {
  '@context': 'https://schema.org',
  '@type': 'CreativeWork',
  name: 'StillLoud Portfolio',
  creator: {
    '@type': 'Organization',
    name: 'StillLoud',
  },
}

export default function OurWorkPage() {
  return (
    <div className="ow-page">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(creativeWorkSchema) }}
      />

      <BackToTop />
      <Navbar variant="work" />
      <WorkHero />
      <CaseStudy />
      <WorkGallery />
      <WorkCta />
      <Footer variant="work" />
      <TawkTo />
    </div>
  )
}
