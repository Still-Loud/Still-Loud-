import '../../styles/not-found.css'

import Navbar from '../../components/Navbar'
import Footer from '../../components/Footer'

export const metadata = {
  title: 'Page Not Found | StillLoud',
}

export default function NotFound() {
  return (
    <>
      <Navbar variant="work" />

      <main className="error-404">
        <div className="error-404-inner">
          <div className="error-404-code">404</div>
          <h1 className="error-404-title">
            This page went <span className="highlight-red">quiet.</span>
          </h1>
          <p className="error-404-text">
            The page you&apos;re looking for doesn&apos;t exist or has moved. Let&apos;s get you back
            to the loud part.
          </p>
          <div className="error-404-actions">
            <a href="/" className="btn btn-pill-red">
              Back to Home <i className="fas fa-arrow-right" />
            </a>
            <a href="/our-work" className="btn btn-schedule">
              <i className="fas fa-magnifying-glass" /> Explore Our Work
            </a>
          </div>
        </div>
      </main>

      <Footer variant="work" />
    </>
  )
}
