# Migration Decision Log

Defaults agreed before code, recorded so later steps don't silently drift.

| ID | Decision | Choice | Why | Reversible? |
|---|---|---|---|---|
| D1 | Route shape | `/` single page (all anchors) + `/our-work` + `/blog/*` | Real site has only 2 URLs. Splitting About/Services/Contact creates unranked URLs and requires new layouts, violating the no-redesign rule. | Hard later — URL changes cost rankings |
| D2 | Portfolio URL | 301 `/our-work.html` → `/our-work` | Preserves every existing backlink and indexed URL; clean path. | Yes (drop the redirect) |
| D3 | CMS coverage | Add `Projects` + `Testimonials` collections | 48 gallery items and 6 testimonials are hardcoded; without collections the client can never update their own portfolio. | Yes |
| D4 | Media storage | Vercel Blob for uploads; keep Cloudinary URLs for existing video embeds | Payload has a first-class Blob adapter, no first-class Cloudinary adapter. Cloudinary is used only for video hosting today. | Yes, with a storage adapter swap |
| D5 | `Pages` collection | Fixed field groups per section, max-length validation, no block builder | Prevents arbitrary layout edits that would break the preserved design. | Yes |
| D6 | Tawk.to chat | Keep, load on first user interaction | Live-chat widget is the largest INP risk on the page. Appearance unchanged; only load timing moves. | Yes |
| D7 | Branding filter | Fix: `branding` should match branding **and** logo cards | Currently `data-category="branding"` matches zero cards, so the tab silently shows only logos. | Yes |
| D8 | Reel poster frames | **OPEN** — use the 6 unused `Reel Cover/*.svg` as `poster` | Reel cards currently render as empty black boxes until clicked. Posters improve first paint but change what is displayed today. | Yes |

## Delivery decisions (performance pass)

| ID | Decision | Choice | Why |
|---|---|---|---|
| D9 | Image format | WebP at display width, originals archived outside the repo | v1 shipped print-resolution PNG/JPG/SVG (97.8 MB in `public/assets`); WebP at 1400/1080/760/240 px is 2.8 MB with no visible loss. `scripts/optimise-images.mjs` regenerates. |
| D10 | Video delivery | Cloudinary transform `q_auto,w_720` on every embed | 12.2 MB → 3.2 MB for the case study; same for the reels. The transform is delivery-side, the uploaded original is untouched. |
| D11 | Icons | Self-hosted Font Awesome 6.4.0, subset to the classes in use | 100 KB render-blocking stylesheet → 12 KB bundled into the site CSS. `scripts/fontawesome-subset.mjs` scans `components/`, `app/`, `styles/` and must be re-run when a new `fa-*` class is added. |
| D12 | Tags | GTM + GA4 stay `afterInteractive` | `lazyOnload` was measured: TBT rose (254 → 442 ms) because the tags then execute inside the interactive window. Revisit if the client consolidates to GTM only. |

## Version pins

| Package | Pin | Reason |
|---|---|---|
| `payload` | 3.93.0 | Current stable |
| `@payloadcms/*` | 3.93.0 | Must match `payload` exactly (peer deps) |
| `next` | 16.4.6 | Within `@payloadcms/next` peer range (`>=16.3.3 <17`) |
| `react` / `react-dom` | **19.2.x** | `@payloadcms/richtext-lexical` peers are `^19.0.1 \|\| ^19.1.2 \|\| ^19.2.1` — npm `latest` (19.3.1) is **outside** range |

## Open questions for the client

1. Ownership of both Cloudinary accounts (`n4d0qen2`, `tebtzfn8`).
2. Is the absence of any contact form intentional? All conversion is external links today.
3. Google Analytics 4 (`G-35L8G4ZZBE`) and GTM (`GTM-M4KFX8KF`) — keep both, or consolidate to GTM only?
