# Performance after migration

Measured with Lighthouse 12 against `next start` on the same machine as the Phase 0
baseline (`docs/baseline/lighthouse`), same Chrome build, default throttling
(mobile: Moto G4 profile, 1.6 Mbps / 4× CPU).

| Page | Perf before → after | LCP before → after | TBT before → after | Page weight before → after |
|---|---|---|---|---|
| `/` desktop | 43 → **99** | 6.33 s → **1.02 s** | 763 ms → **7 ms** | 34.9 MB → **1.23 MB** |
| `/` mobile | 38 → **78** | 42.19 s → **4.74 s** | 3 561 ms → **272 ms** | 19.1 MB → **0.94 MB** |
| `/our-work` desktop | 0 (NO_FCP) → **92** | — → **1.91 s** | — → **26 ms** | 77.4 MB → **5.9 MB** |
| `/our-work` mobile | 0 (NO_FCP) → **73** | — → **5.19 s** | — → **333 ms** | 77.2 MB → **6.0 MB** |

Accessibility 90 / 95, Best Practices 100, SEO 100, CLS 0 on all four.

`our-work` fails the baseline run outright: the v1 page shipped 79 MB of print-resolution
imagery and twelve autoplaying videos, so Chrome never produced a first contentful paint
inside Lighthouse's window.

## Where the weight went

| Change | Effect |
|---|---|
| `scripts/optimise-images.mjs` — every portfolio asset to WebP at display width | `public/assets` 97.8 MB → 2.8 MB |
| Cloudinary delivery transform `q_auto,w_720` on all 12 video embeds | case study 12.2 MB → 3.2 MB, reels similarly |
| Font Awesome 6.4.0 self-hosted and subset to the 27 icons in use | 100 KB CSS → 12 KB, bundled into the site CSS (one render-blocking request instead of two) |
| Poppins + Manrope via `next/font` | no `fonts.googleapis.com` request, no FOUT shift |
| `fetchPriority="high"` on the hero illustration, `loading="lazy"` + intrinsic `width`/`height` below the fold | LCP image requested first; no layout shift when lazy images arrive |
| Tawk.to deferred to first interaction (D6) | removes third-party JS from the load path |

## Reproducing

```bash
npm run build
npm run start                       # port 3000
npx lighthouse http://localhost:3000/ \
  --output=json --output-path=docs/lighthouse-after/home-mobile.report.json \
  --only-categories=performance,accessibility,best-practices,seo \
  --chrome-flags="--headless=new --no-sandbox"
```

`summary.json` is the machine-readable comparison against
`docs/baseline/lighthouse/summary.json`. `runs/` keeps the repeat runs used to
check variance — mobile LCP lands in one of two ~800 ms clusters depending on
when the hero's entrance animation completes, so single runs can read 70–78.

## Follow-up: gallery images at 1000 px

`/our-work` gallery cards render at ~344 CSS px (4-column masonry inside
1600 px), so the 1400 px WebPs were 4x display width. Re-encoded to 1000 px
(2.9x, still covers the lightbox): gallery 1.97 → 1.56 MB, `public/assets`
2.8 → 2.2 MB.

Lighthouse 12, mobile, same machine: total transfer 6 116 → 5 693 KB (image
transfer in the new run: 1 648 KB). LCP stayed at 5.2 s and CLS at 0 — expected,
because the LCP element is the nav logo, not a gallery image. The 67 vs 73
performance score is run-to-run TBT variance, not a regression (see `runs/`).

Sampled pixel diff against v1 for a gallery card: 0.12%. Full-page parity:
1.93% desktop / 3.58% mobile, with the autoplaying case-study video accounting
for most of it.

## Known remaining cost

- `/our-work`: the case-study video autoplays, then gallery reels load as they
  scroll into view (`preload="none"`). 3.2 MB + posters is the floor until the
  client supplies lighter cuts or we add poster frames (D8).
- GA4 + GTM together add ~300 KB and most of the residual TBT. `lazyOnload` was
  measured and made TBT *worse* (the tags then run inside the interactive
  window), so both stay `afterInteractive` until the client decides whether to
  keep two tags (open question 3).
- `/our-work` mobile LCP is the nav logo — the page's first screen is a
  full-bleed video, so there is no large static image to paint early.
