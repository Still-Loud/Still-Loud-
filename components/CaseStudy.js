'use client'

import { useEffect, useRef, useState } from 'react'

/* Featured case study — glowing phone mockup with autoplaying brand video.
   Behaviour mirrors js/our-work.js §3 (autoplay + sound toggle). */
export default function CaseStudy() {
  const videoRef = useRef(null)
  const [muted, setMuted] = useState(true)

  useEffect(() => {
    videoRef.current?.play().catch(() => {
      /* Browser autoplay policies: video is muted so it should play */
    })
  }, [])

  const toggleSound = () => {
    const video = videoRef.current
    if (!video) return
    video.muted = !video.muted
    setMuted(video.muted)
  }

  return (
    <section className="ow-case-study-section" aria-labelledby="fp-title">
      <div className="ow-case-study-container">
        <div className="ow-case-study-card">
          {/* Ambient Background Glows & Contours */}
          <div className="fp-card-bg-contour" aria-hidden="true" />
          <div className="fp-card-glow fp-card-glow-purple" aria-hidden="true" />
          <div className="fp-card-glow fp-card-glow-orange" aria-hidden="true" />

          <div className="fp-card-grid">
            {/* Left Column: Glowing Smartphone Mockup */}
            <div className="fp-mockup-col">
              <div className="fp-mockup-wrapper">
                {/* Glowing neon purple border halo */}
                <div className="fp-phone-halo" aria-hidden="true" />

                {/* Smartphone Device Chassis */}
                <div className="fp-phone-frame">
                  {/* Side Buttons */}
                  <span className="fp-phone-btn-mute" aria-hidden="true" />
                  <span className="fp-phone-btn-vol-up" aria-hidden="true" />
                  <span className="fp-phone-btn-vol-down" aria-hidden="true" />
                  <span className="fp-phone-btn-power" aria-hidden="true" />

                  {/* Screen Viewport */}
                  <div className="fp-phone-screen">
                    {/* Dynamic Island */}
                    <div className="fp-phone-dynamic-island" aria-hidden="true">
                      <span className="fp-camera-lens" />
                      <span className="fp-sensor-dot" />
                    </div>

                    {/* Phone Screen Background / Video */}
                    <div className="fp-phone-screen-media">
                      <img
                        src="/assets/bg_only.png"
                        alt="Kubes Brand Backdrop"
                        className="fp-phone-bg-img"
                        loading="eager"
                      />
                      <video
                        id="fp-phone-video"
                        ref={videoRef}
                        src="https://res.cloudinary.com/n4d0qen2/video/upload/kubes_rooms_pqz0pq.mp4"
                        className="fp-phone-video"
                        autoPlay
                        loop
                        muted
                        playsInline
                        title="Kubes By The Raasta — Brand Story Video"
                        aria-label="Kubes By The Raasta resort brand video"
                      />
                    </div>

                    {/* Subtle Gloss Reflection Overlay */}
                    <div className="fp-phone-glare" aria-hidden="true" />

                    {/* Sound Toggle Control */}
                    <div className="fp-phone-controls">
                      <button
                        type="button"
                        className="fp-sound-btn"
                        id="fp-sound-btn"
                        aria-label={muted ? 'Unmute sound' : 'Mute sound'}
                        onClick={toggleSound}
                      >
                        <i className={`fas ${muted ? 'fa-volume-mute' : 'fa-volume-up'}`} id="fp-sound-icon" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Case Study Info & Metrics */}
            <div className="fp-content-col">
              {/* Eyebrow: FeaturedProject */}
              <div className="fp-eyebrow">
                <span className="fp-eyebrow-featured">Featured</span>
                <span className="fp-eyebrow-project">Project</span>
              </div>

              {/* Main Heading */}
              <h2 id="fp-title" className="fp-title">
                Luxury Resort
                <br />
                <span className="fp-highlight-purple">Branding</span> &{' '}
                <span className="fp-highlight-purple">Social</span>
                <br />
                management
              </h2>

              {/* Narrative Description */}
              <p className="fp-description">
                A complete social media management and transformation for premium resort named
                KUBES BY THE RAASTA located in Jispa, Himachal Pradesh. from online presence to
                engaging content we crafted an experience.
              </p>

              {/* Metrics / Stat Boxes */}
              <div className="fp-stats-row">
                {/* Box 1 */}
                <div className="fp-stat-box">
                  <span className="fp-stat-label">Instagram Drives</span>
                  <span className="fp-stat-val">90%</span>
                  <span className="fp-stat-sub">of Their Bookings.</span>
                </div>

                {/* Box 2 */}
                <div className="fp-stat-box">
                  <span className="fp-stat-label">Partnering Since</span>
                  <span className="fp-stat-val">08+</span>
                  <span className="fp-stat-sub">Months.</span>
                </div>
              </div>

              {/* Tags Pills */}
              <div className="fp-tags-row" role="list" aria-label="Project Deliverables">
                <span className="fp-tag-pill" role="listitem">
                  Branding
                </span>
                <span className="fp-tag-pill" role="listitem">
                  Social Media
                </span>
                <span className="fp-tag-pill" role="listitem">
                  Strategy
                </span>
              </div>

              {/* CTA Button */}
              <div className="fp-cta-wrap">
                <a
                  href="https://instagram.com/kubesbytheraasta"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="fp-cta-button"
                  aria-label="See Kubes By The Raasta social presence on Instagram"
                >
                  <span>SEE THEIR PRESENCE</span>
                  <span className="fp-cta-arrow" aria-hidden="true">
                    <i className="fas fa-arrow-right" />
                  </span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
