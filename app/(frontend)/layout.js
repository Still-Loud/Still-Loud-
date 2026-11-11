import Script from 'next/script'

import '../../styles/style.css'
import '../../styles/responsive.css'

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

const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'StillLoud',
  email: 'team.stillloud@gmail.com',
  sameAs: ['https://instagram.com/wearestillloud'],
}

export default function FrontendLayout({ children }) {
  return (
    <html lang="en">
      <head>
        {/* Google Fonts: Poppins (Heading/Hero) & Manrope (Body/UI) */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&family=Poppins:wght@700;800;900&display=swap"
          rel="stylesheet"
        />
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
