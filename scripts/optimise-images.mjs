/**
 * Convert the oversized portfolio artwork to WebP.
 *
 * The v1 site shipped print-resolution PNG/JPG files (a 17,280 px logo used at
 * 56 px, a 4,419 px-wide Pinterest pin, 15 MB SVGs that are really a single
 * embedded raster). This script writes a sibling .webp at a sensible display
 * width and records what it produced.
 *
 *   node scripts/optimise-images.mjs
 *
 * Originals are left untouched; delete them once the site has been checked.
 */
import fs from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'

const ROOT = path.resolve('public/assets')

/** dir (relative to public/assets) -> max pixel width */
const RULES = [
  // Portfolio gallery — masonry columns are ~380 px wide at 1440.
  { dir: 'OUR WORK page/Creatives', width: 1400, quality: 82 },
  { dir: 'OUR WORK page/Logos', width: 1400, quality: 82 },
  { dir: 'OUR WORK page/Printables', width: 1400, quality: 82 },
  // Testimonial avatars render at 56–72 px.
  { dir: 'Testemonial_Logos', width: 240, quality: 88 },
  // Pricing artwork renders at ~320 px.
  { dir: 'Packages', width: 700, quality: 85 },
  // Page artwork.
  { dir: null, files: ['1.svg', '3.svg', '5.svg'], width: 1080, quality: 85 },
  { dir: null, files: ['Brain.svg', 'handshakes.svg'], width: 760, quality: 80 },
  { dir: null, files: ['FrontPage design.svg'], width: 1400, quality: 85 },
  { dir: null, files: ['BG_only.svg', 'bg_only.png'], width: 1366, quality: 80, out: 'bg_only.webp' },
]

const RASTER = /\.(png|jpe?g|webp|svg)$/i

async function convert(input, output, width, quality) {
  const image = sharp(input, { limitInputPixels: false, density: 144 }).rotate()
  const meta = await image.metadata()

  let pipeline = image
  if (meta.width && meta.width > width) {
    pipeline = pipeline.resize({ width, withoutEnlargement: true })
  }

  await pipeline.webp({ quality, effort: 6 }).toFile(output)

  const [before, after] = await Promise.all([
    fs.stat(input).then((s) => s.size),
    fs.stat(output).then((s) => s.size),
  ])

  return { before, after }
}

async function main() {
  const results = []

  for (const rule of RULES) {
    const dir = rule.dir ? path.join(ROOT, rule.dir) : ROOT
    const names = rule.files || (await fs.readdir(dir)).filter((f) => RASTER.test(f))

    for (const name of names) {
      if (!RASTER.test(name)) continue
      const input = path.join(dir, name)
      const base = name.replace(/\.[^.]+$/, '')
      const output = path.join(dir, rule.out || `${base}.webp`)

      try {
        await fs.access(input)
      } catch {
        results.push({ name: path.relative(ROOT, input), skipped: true })
        continue
      }

      try {
        const { before, after } = await convert(input, output, rule.width, rule.quality)
        results.push({
          name: path.relative(ROOT, input),
          out: path.relative(ROOT, output),
          before,
          after,
        })
      } catch (error) {
        results.push({ name: path.relative(ROOT, input), error: error.message })
      }
    }
  }

  let totalBefore = 0
  let totalAfter = 0

  for (const result of results) {
    if (result.error) {
      console.log(`FAIL  ${result.name}  — ${result.error.slice(0, 90)}`)
      continue
    }
    if (result.skipped) {
      console.log(`skip  ${result.name}  (not found)`)
      continue
    }
    totalBefore += result.before
    totalAfter += result.after
    console.log(
      `${String(Math.round(result.before / 1024)).padStart(6)} KB -> ${String(
        Math.round(result.after / 1024)
      ).padStart(5)} KB  ${result.out}`
    )
  }

  console.log(
    `\n${Math.round(totalBefore / 1024 / 1024)} MB -> ${(totalAfter / 1024 / 1024).toFixed(
      1
    )} MB (${Math.round((1 - totalAfter / totalBefore) * 100)}% smaller)`
  )
}

main()
