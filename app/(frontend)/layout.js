import { Manrope, Poppins } from 'next/font/google'
import Script from 'next/script'

import '../../styles/style.css'
import '../../styles/responsive.css'

/* Self-hosted at build time by next/font — no render-blocking request to
   fonts.googleapis.com, no layout shift, and the files are served from our
   own origin with immutable caching. Weights match the v1 <link> exactly. */
const poppins = Poppins({
  subsets: ['latin'],
  weight: ['700', '800', '900'],
  variable: '--font-poppins',
  display: 'swap',
})

const manrope = Manrope({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-manrope',
  display: 'swap',
})

export const metadata = {
  metadataBase: new URL('https://stillloud.in'),
  title: 'StillLoud | Branding, Website Design & Creative Studio',
  description:
    'StillLoud is a creative branding and digital design studio helping businesses grow through strategic branding, logo design, social media creatives, website design, UI/UX, and digital marketing solutions.',
  keywords:
    'StillLoud, branding agency, branding studio, creative agency, logo design, brand identity, website design, web development, UI UX design, social media design, digital branding, marketing creatives, graphic design, creative studio, business branding, startup branding, small business branding, portfolio, creative services, India branding agency',
  authors: [{ name: 'StillLoud' }],
  openGraph: {
    title: 'StillLoud | Branding & Creative Design Studio',
    description:
      'Helping businesses grow through strategic branding, websites, social media design, and creative digital experiences.',
    type: 'website',
  },
  icons: {
    icon: '/assets/logo.svg',
  },
  verification: {
    google: '6RRXaTkZvHy-WpPjVwNahqLwI9GJXORKH29Aqt2O5xc',
    other: {
      'p:domain_verify': '1b63087bd2df1cd9a3970c29069d5872',
    },
  },
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
}

const SITE = 'https://stillloud.in'

const organizationSchema = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': ['Organization', 'ProfessionalService'],
      '@id': `${SITE}/#organization`,
      name: 'StillLoud',
      alternateName: 'stillLoud',
      url: SITE,
      logo: {
        '@type': 'ImageObject',
        url: `${SITE}/assets/fulllogo.svg`,
      },
      image: `${SITE}/assets/fulllogo.svg`,
      description:
        'StillLoud is a branding and creative design studio in India helping small businesses grow through strategic brand identity, logo design, social media creatives, website design and UI/UX.',
      email: 'team.stillloud@gmail.com',
      telephone: '+91-6351139179',
      address: {
        '@type': 'PostalAddress',
        addressCountry: 'IN',
      },
      areaServed: [
        { '@type': 'Country', name: 'India' },
        { '@type': 'Place', name: 'Worldwide (remote)' },
      ],
      contactPoint: [
        {
          '@type': 'ContactPoint',
          contactType: 'sales',
          telephone: '+91-6351139179',
          email: 'team.stillloud@gmail.com',
          availableLanguage: ['en', 'hi'],
        },
      ],
      sameAs: [
        'https://instagram.com/wearestillloud',
        'https://www.linkedin.com/company/stillloud/',
        'https://in.pinterest.com/wearestillloud/',
      ],
      knowsAbout: [
        'Brand strategy',
        'Brand identity',
        'Logo design',
        'Social media design',
        'Website design',
        'UI/UX design',
      ],
    },
    {
      '@type': 'WebSite',
      '@id': `${SITE}/#website`,
      url: SITE,
      name: 'StillLoud',
      description:
        'Branding, website design and social media creatives for small businesses.',
      publisher: { '@id': `${SITE}/#organization` },
      inLanguage: 'en-IN',
    },
  ],
}

export default function FrontendLayout({ children }) {
  return (
    <html lang="en" className={`${poppins.variable} ${manrope.variable}`}>
      <head>
        {/* FontAwesome Icons */}
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
      </head>
      <body>
        {/* Google Tag Manager (noscript) */}
        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-M4KFX8KF"
            height="0"
            width="0"
            style={{ display: 'none', visibility: 'hidden' }}
          />
        </noscript>
        {children}

        {/* Google Tag Manager */}
        <Script id="gtm" strategy="afterInteractive">
          {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-M4KFX8KF');`}
        </Script>
        {/* Google tag (gtag.js) */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-35L8G4ZZBE"
          strategy="afterInteractive"
        />
        <Script id="gtag-init" strategy="afterInteractive">
          {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', 'G-35L8G4ZZBE');`}
        </Script>
      </body>
    </html>
  )
}
