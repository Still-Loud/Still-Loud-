import { ScheduleMeetingButton } from './CtaButtons'

/* Shared footer. `variant="work"` reproduces the portfolio page's slightly
   different footer (v1 our-work.html): only the HIRE US! button, absolute
   section links back to the home page, and a spaced phone number. */
export default function Footer({ variant = 'home', content }) {
  const isWork = variant === 'work'
  const prefix = isWork ? '/#' : '#'

  const phone = content?.contactPhone || '+91 6351139179'
  const phoneHref = content?.contactPhoneHref || 'tel:+916351139179'
  const email = content?.contactEmail || 'team.stillloud@gmail.com'
  const whatsapp = content?.whatsappHref || (isWork ? 'https://wa.me/8866119607' : 'https://wa.me/6351139179')
  const instagram = content?.instagramUrl || 'https://instagram.com/wearestillloud'
  const linkedin = content?.linkedinUrl || 'https://www.linkedin.com/company/stillloud/'
  const pinterest = content?.pinterestUrl || 'https://in.pinterest.com/wearestillloud/'
  const copyright = content?.footerCopyright || '© 2026 StillLoud. All Rights Reserved.'

  const displayPhone = isWork ? phone.replace(/(\+91\s?)(\d{4})(\d{3})(\d{3})/, '$1$2 $3 $4') : phone

  return (
    <footer id="contact" className="footer-section">
      <div className="section-container">
        {/* Upper Footer Grid */}
        <div className="footer-upper">
          <div className="footer-upper-text">
            <h2>
              <span className="highlight-red">Curious?</span>
              <br />
              {content?.footerHeading || 'Let’s have a real chat.'}
            </h2>
          </div>
          <div className="footer-upper-btn-wrap">
            <a href={whatsapp} target="_blank" rel="noreferrer" className="btn btn-hire-us">
              HIRE US! <i className="fa-solid fa-circle-phone" />
            </a>
            {!isWork && <ScheduleMeetingButton light />}
          </div>
        </div>

        {/* Middle Footer Divider */}
        <div className="footer-divider"></div>

        {/* Footer Columns */}
        <div className="footer-cols">
          {/* Brand Info */}
          <div className="footer-col col-brand">
            <h3 className="footer-logo">StillLoud</h3>
            <p className="brand-bio">
              {content?.footerBio || (
                <>
                  Elevating Small Businesses with Strategic Design.
                  <br />
                  <br />
                  Branding • Logo Design • Social Media • Websites • UI/UX
                </>
              )}
            </p>
            <div className="footer-social-links">
              <a href={instagram} target="_blank" rel="noopener noreferrer" aria-label="Instagram">
                <i className="fab fa-instagram" />
              </a>
              <a href={linkedin} target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">
                <i className="fab fa-linkedin-in" />
              </a>
              <a href={pinterest} target="_blank" rel="noopener noreferrer" aria-label="Pinterest">
                <i className="fab fa-pinterest-p" />
              </a>
            </div>
          </div>

          {/* Navigation */}
          <div className="footer-col col-nav">
            <h4 className="col-title">Navigation</h4>
            <ul className="footer-nav-list">
              <li>
                <a href={`${prefix}home`}>Home</a>
              </li>
              <li>
                <a href={`${prefix}about`}>About us</a>
              </li>
              <li>
                <a href={`${prefix}services`}>Services</a>
              </li>
              <li>
                <a href="/our-work">Our Work</a>
              </li>
              <li>
                <a href="/blog">Blog</a>
              </li>
              <li>
                <a href={`${prefix}reviews`}>Reviews</a>
              </li>
              <li>
                <a href={`${prefix}contact`}>Contact</a>
              </li>
            </ul>
          </div>

          {/* Contact Details */}
          <div className="footer-col col-contact">
            <h4 className="col-title">Contact Us!</h4>
            <ul className="footer-contact-list">
              <li>
                <span className="contact-label">Call / WhatsApp</span>
                <span className="contact-value">
                  <a href={phoneHref}>{displayPhone}</a>
                </span>
              </li>
              <li>
                <span className="contact-label">Email Us</span>
                <span className="contact-value">
                  <a href={`mailto:${email}`}>{email}</a>
                </span>
              </li>
              <li>
                <span className="contact-label">Instagram DM</span>
                <span className="contact-value">
                  <a href={instagram} target="_blank" rel="noopener noreferrer">
                    @wearestillloud
                  </a>
                </span>
              </li>
              <li>
                <span className="contact-label">LinkedIn</span>
                <span className="contact-value">
                  <a href={linkedin} target="_blank" rel="noopener noreferrer">
                    StillLoud
                  </a>
                </span>
              </li>
              <li>
                <span className="contact-label">Pinterest</span>
                <span className="contact-value">
                  <a href={pinterest} target="_blank" rel="noopener noreferrer">
                    @wearestillloud
                  </a>
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Footer Copyright Bar */}
        <div className="footer-bottom">
          <p className="copyright-text">{copyright}</p>
        </div>
      </div>
    </footer>
  )
}
