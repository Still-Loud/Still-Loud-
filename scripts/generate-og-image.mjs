/**
 * Builds the static social share card at public/og/og-default.jpg.
 *
 * 1200x630 keeps every network happy (Open Graph, X, LinkedIn, WhatsApp). We
 * composite the real logo SVG over a branded dark card instead of shipping a
 * screenshot, so the image stays sharp and matches the site palette.
 *
 * Run: npm run generate:og
 */
import { mkdir } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import sharp from 'sharp'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const outDir = path.join(root, 'public', 'og')
const outFile = path.join(outDir, 'og-default.jpg')
const logoFile = path.join(root, 'public', 'assets', 'fulllogo.svg')

const WIDTH = 1200
const HEIGHT = 630
const LOGO_WIDTH = 560

const backdrop = `
<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
  <defs>
    <radialGradient id="purple" cx="82%" cy="14%" r="65%">
      <stop offset="0%" stop-color="#8338EC" stop-opacity="0.55"/>
      <stop offset="55%" stop-color="#8338EC" stop-opacity="0.16"/>
      <stop offset="100%" stop-color="#8338EC" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="orange" cx="6%" cy="94%" r="60%">
      <stop offset="0%" stop-color="#FB5607" stop-opacity="0.3"/>
      <stop offset="100%" stop-color="#FB5607" stop-opacity="0"/>
    </radialGradient>
    <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
      <path d="M60 0H0V60" fill="none" stroke="#E9ECEF" stroke-opacity="0.055" stroke-width="1"/>
    </pattern>
  </defs>
  <rect width="${WIDTH}" height="${HEIGHT}" fill="#212529"/>
  <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#grid)"/>
  <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#purple)"/>
  <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#orange)"/>
</svg>`

const footer = `
<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
  <rect x="${WIDTH / 2 - 32}" y="404" width="64" height="4" rx="2" fill="#FB5607"/>
  <text x="${WIDTH / 2}" y="462" text-anchor="middle"
        font-family="Segoe UI, Arial, Helvetica, sans-serif"
        font-size="33" font-weight="700" letter-spacing="3.5" fill="#E9ECEF">
    DISTINCTIVE DESIGN. MEASURABLE IMPACT.
  </text>
  <text x="${WIDTH / 2}" y="512" text-anchor="middle"
        font-family="Segoe UI, Arial, Helvetica, sans-serif"
        font-size="21" font-weight="600" letter-spacing="6" fill="#FB5607">
    STILLLOUD.IN
  </text>
</svg>`

const logo = await sharp(logoFile)
  .resize({ width: LOGO_WIDTH, fit: 'inside' })
  .png()
  .toBuffer()

const { height: logoHeight } = await sharp(logo).metadata()
const logoTop = Math.round((HEIGHT - logoHeight) / 2) - 78

await mkdir(outDir, { recursive: true })

await sharp(Buffer.from(backdrop))
  .composite([
    { input: logo, top: logoTop, left: Math.round((WIDTH - LOGO_WIDTH) / 2) },
    { input: Buffer.from(footer), top: 0, left: 0 },
  ])
  .jpeg({ quality: 90, chromaSubsampling: '4:4:4', mozjpeg: true })
  .toFile(outFile)

console.log(`wrote ${path.relative(root, outFile)} (${WIDTH}x${HEIGHT})`)
