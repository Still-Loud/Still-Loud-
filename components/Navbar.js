'use client'

import { useEffect, useRef, useState } from 'react'

export default function Navbar({ variant = 'home' }) {
  const isWork = variant === 'work'
  const prefix = isWork ? '/#' : '#'
  const brandHref = isWork ? '/' : '#home'
  const [menuOpen, setMenuOpen] = useState(false)
  const navRef = useRef(null)

  /* Sticky navbar transition — mirrors js/main.js §1 */
  useEffect(() => {
    const navbar = navRef.current?.querySelector('.navbar')
    if (!navbar) return

    const onScroll = () => {
      if (window.scrollY > 40) {
        navbar.style.padding = '10px 16px 10px 20px'
        navbar.style.boxShadow = '0 12px 36px rgba(0, 0, 0, 0.35), 0 4px 12px rgba(0, 0, 0, 0.2)'
        navbar.style.backgroundColor = 'rgba(33, 37, 41, 0.97)'
        navbar.style.backdropFilter = 'blur(12px)'
      } else {
        navbar.style.padding = '14px 20px 14px 24px'
        navbar.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.25), 0 2px 8px rgba(0, 0, 0, 0.15)'
        navbar.style.backgroundColor = 'var(--color-dark)'
        navbar.style.backdropFilter = 'none'
      }
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  /* Body scroll lock while the mobile drawer is open — mirrors js/main.js §2 */
  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : 'auto'
    return () => {
      document.body.style.overflow = 'auto'
    }
  }, [menuOpen])

  /* Active nav link on scroll — mirrors js/main.js §8 (home page only) */
  useEffect(() => {
    if (isWork) return
    const navItems = Array.from(document.querySelectorAll('.nav-links a'))
    const sections = Array.from(document.querySelectorAll('section, div.top-hero-card'))
    if (!sections.length) return

    const onScroll = () => {
      let currentSectionId = ''
      sections.forEach((section) => {
        const sectionTop = section.offsetTop
        if (window.scrollY >= sectionTop - 150) {
          currentSectionId = section.classList.contains('top-hero-card')
            ? 'home'
            : section.getAttribute('id')
        }
      })
      navItems.forEach((item) => {
        item.classList.remove('active')
        if (item.getAttribute('href') === `#${currentSectionId}`) {
          item.classList.add('active')
        }
      })
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header className="navbar-wrapper" ref={navRef}>
      <div className="navbar">
        {/* Brand Logo (Far Left) */}
        <a href={brandHref} className="nav-brand">
          <img src="/assets/fulllogo.svg" alt="stillLoud Logo" className="nav-logo desktop-logo" />
          <img src="/assets/logo.svg" alt="stillLoud Logo Mobile" className="nav-logo mobile-logo" />
        </a>

        {/* Navigation Menu */}
        <nav className={`nav-container${menuOpen ? ' active' : ''}`} aria-label="Main navigation">
          <ul className="nav-links">
            <li>
              <a
                href={`${prefix}home`}
                className={isWork ? undefined : 'active'}
                onClick={() => setMenuOpen(false)}
              >
                Home
              </a>
            </li>
            <li>
              <a href={`${prefix}about`} onClick={() => setMenuOpen(false)}>
                About
              </a>
            </li>
            <li>
              <a href={`${prefix}services`} onClick={() => setMenuOpen(false)}>
                Services
              </a>
            </li>
            <li>
              <a
                href="/our-work"
                className={`nav-link-work${isWork ? ' active' : ''}`}
                onClick={() => setMenuOpen(false)}
              >
                Our Work
              </a>
            </li>
            <li>
              <a href={`${prefix}reviews`} onClick={() => setMenuOpen(false)}>
                Reviews
              </a>
            </li>
            <li>
              <a href={`${prefix}contact`} onClick={() => setMenuOpen(false)}>
                Contact
              </a>
            </li>
          </ul>
        </nav>

        {/* CTA Button (Far Right) */}
        <a href={`${prefix}contact`} className="nav-cta">
          Let&apos;s Talk <i className="fas fa-arrow-right" />
        </a>

        {/* Hamburger Button for Mobile */}
        <button
          className={`mobile-menu-btn${menuOpen ? ' active' : ''}`}
          aria-label="Toggle Navigation"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((v) => !v)}
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
      </div>
    </header>
  )
}
