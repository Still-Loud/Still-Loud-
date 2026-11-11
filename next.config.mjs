import { withPayload } from '@payloadcms/next/withPayload'

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  devIndicators: false,

  /* Keep the v1 URLs working. D2: the static .html pages are gone, so every
     indexed/crawled URL 301s to its App Router equivalent. */
  async redirects() {
    return [
      { source: '/index.html', destination: '/', permanent: true },
      { source: '/our-work.html', destination: '/our-work', permanent: true },
    ]
  },
}

export default withPayload(nextConfig)
