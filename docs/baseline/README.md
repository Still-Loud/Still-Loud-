# Phase 0 — Baseline Audit

Reference capture of the **existing** stillloud.in site before migration.
This directory is the source of truth for "pixel-for-pixel" verification in Phase 7.

Captured: 2026-11-11
Source: `arc/v1/still-loud-web` @ `fa9c7dc` (clean, `main`, in sync with origin)

---

## How this was captured

| Item | Value |
|---|---|
| Server | `python -m http.server 8123 --bind 127.0.0.1` in `arc/v1/still-loud-web` |
| Browser | System Chrome (`C:\Program Files\Google\Chrome\Application\chrome.exe`) via `puppeteer-core`, headless |
| Viewports | 1440×900 · 1024×768 · 768×1024 · 390×844 (DPR 1) |
| Screenshots | Full page, PNG |
| Cache | Disabled per page load, so byte counts reflect a cold visit |
| Lighthouse | `lighthouse` CLI against the same local server, default simulated throttling; mobile + desktop preset |

### Determinism rules

Screenshots must be repeatable, otherwise a pixel diff is meaningless. For every capture:

1. `window.setInterval` is patched **before page scripts run** so the testimonial carousel's
   `setInterval(…, 4500)` autoplay never fires — the carousel is frozen at slide 0.
2. A freeze stylesheet pauses CSS animations (marquee) and disables transitions, so the ticker
   is captured at its start position.
3. `document.fonts.ready` is awaited, then two animation frames.
4. The page is scrolled top→bottom→top to force every `loading="lazy"` image to load,
   then full-page captured from scroll 0.

**Any Phase 7 comparison must replay these same four steps**, or differences will be false positives.

---

## Routes captured

| URL | File | What it contains |
|---|---|---|
| `/` | `index.html` | Single page: hero, about, services, portfolio, testimonials, marquee, pricing, footer |
| `/our-work.html` | `our-work.html` | Portfolio: hero, featured case study, filter tabs, 48-card gallery, lightbox, CTA, footer |
| `/404.html` | `404.html` | Self-contained error page (inline CSS, `noindex`) |

Anchors on `/`: `#home`, `#about`, `#services`, `#work`, `#reviews`, `#pricing`, `#contact`.

> There is **no** `/about`, `/services`, `/portfolio` or `/contact` route. Those are fragments.
> The migration keeps this shape and adds `/blog` as the only new URL family.

---

## Screenshots

`docs/baseline/screenshots/`

```
home-desktop-1440.png      our-work-desktop-1440.png      404-desktop-1440.png
home-laptop-1024.png       our-work-laptop-1024.png       404-laptop-1024.png
home-tablet-768.png        our-work-tablet-768.png        404-tablet-768.png
home-mobile-390.png        our-work-mobile-390.png        404-mobile-390.png
```

---

## Headline numbers (cold load, cache disabled)

| Page | Desktop transfer | Mobile transfer | DOM nodes | Images | Videos | Height |
|---|---|---|---|---|---|---|
| `/` | 34.7 MB | 19.6 MB | 531 / 463 | 23 / 19 | 0 | 6 349 / 10 558 px |
| `/our-work.html` | 65.7 MB | 65.7 MB | 492 / 492 | 41 | 12 | 7 425 / 8 745 px |

Values are desktop 1440×900 / mobile 390×844.

Machine-readable detail: `metrics.json` (per viewport: byte counts by initiator, heaviest
resources, overflow checks, console errors, failed requests).

**Nothing on either page emits horizontal overflow at any of the four widths** — that is
currently correct and must stay correct.

---

## Asset inventory

See `inventory.json` for the full machine-readable list.

- 66 files under `assets/`, **109.6 MB** total
- **11 files (26.5 MB) are never referenced** — see below
- 0 `srcset` attributes · 0 `width`/`height` attributes on `<img>` · 43 `loading="lazy"`
- 0 `<form>` elements (all conversion is external links)

### Heaviest referenced assets

| Asset | Size | Used by |
|---|---|---|
| `Testemonial_Logos/mahakali-industries-logo.png` | 14.7 MB | testimonial avatar (rendered ~60 px) |
| `OUR WORK page/Creatives/pin_52072939437629503.png` | 10.1 MB | gallery card |
| `1.svg` | 7.2 MB | home portfolio card |
| `OUR WORK page/Printables/Main.png` | 4.9 MB | gallery card |
| `3.svg` | 4.4 MB | home portfolio card |
| `FrontPage design.svg` | 1.65 MB | **hero illustration (LCP)** |
| `5.svg` | 1.2 MB | services puzzle |
| `Brain.svg` | 1.13 MB | about card |
| `Packages/1-3.svg` | 1.93 MB combined | pricing |

### Unreferenced (safe to drop from the new build; still in git history)

| Asset | Size |
|---|---|
| `BG_only.svg` | 15.1 MB |
| `OUR WORK page/Reel Cover/1-6.svg` | 11.8 MB combined (1.99 / 2.02 / 0.68 / 2.58 / 2.13 / 2.45) |
| `Testemonial_Logos/Wllcraft_Logo.jpg` | 124 KB |
| `reel.png` | 32 KB |
| `Testemonial_Logos/Glowframezy.jpg` | 28 KB |
| `whatsapp.png` | 23 KB |

> The six `Reel Cover` SVGs were evidently built as poster frames for the reel cards, which
> currently render as plain black boxes (`preload="none"`, no `poster`). Wiring them up would
> improve first paint **but changes what is currently displayed** — so it is a decision, not a
> free fix. Recorded in the migration decision log.

---

## Third-party integrations to preserve

| Service | Identifier | Pages |
|---|---|---|
| Google Tag Manager | `GTM-M4KFX8KF` | all |
| Google Analytics 4 | `G-35L8G4ZZBE` | `/`, `/our-work` |
| Tawk.to live chat | `6a50a992a6558f1d451fe2fa/1jt5hcpjs` | `/` |
| Pinterest verification | `1b63087bd2df1cd9a3970c29069d5872` | `/`, `/our-work` |
| Google Search Console | `6RRXaTkZvHy-WpPjVwNahqLwI9GJXORKH29Aqt2O5xc` | `/`, `/our-work` |
| Cloudinary (Kubes video) | account `n4d0qen2` | `/our-work` |
| Cloudinary (reels ×10) | account `tebtzfn8` | `/our-work` |
| Calendly | `calendly.com/team-stillloud/30min` | both |
| WhatsApp | `wa.me/8866119607`, `wa.me/6351139179` | both |
| Google Fonts | Poppins 700/800/900 + Manrope 400–800 | all |
| FontAwesome 6.4.0 | cdnjs (full bundle) | `/`, `/our-work` |

⚠️ Two separate Cloudinary accounts. Ownership must be confirmed before launch or the
reels break if either account lapses.

---

## Lighthouse baseline

Reports: `docs/baseline/lighthouse/` (JSON + HTML). Summary: `lighthouse/summary.json`.

| Audit | Perf | A11y | Best Prac. | SEO | FCP | LCP | TBT | CLS | Page weight |
|---|---|---|---|---|---|---|---|---|---|
| `/` — mobile, simulated 4G | **38** | 90 | 96 | 92 | 1.9 s | **42.2 s** | 3561 ms | 0.009 | 19.5 MB |
| `/` — desktop | **43** | 90 | 96 | 92 | 0.9 s | 6.3 s | 763 ms | 0.043 | 35.7 MB |
| `/our-work.html` — mobile, unthrottled ⚠️ | 83* | 95 | 100 | 92 | 0.8 s | 2.1 s | 608 ms | 0.009 | **79.3 MB** |
| `/our-work.html` — desktop | **failed** | 95 | 100 | 92 | — | — | — | 0.001 | 79.3 MB |

\* Localhost, no network or CPU throttling — not comparable to the simulated-4G rows. It only
proves the page is fast when the network is free; the 79 MB payload is the real constraint.

**`/our-work.html` cannot be audited under Lighthouse's simulated throttling.** Both mobile and
desktop runs return `NO_FCP`: *"The page did not paint any content."* The desktop run fails even
unthrottled. At 79 MB with 12 videos, first paint never lands inside the audit window. This is
the most severe finding in the baseline and the clearest thing the migration must fix.

### Targets vs baseline

| Metric | Target | Now (`/` mobile) |
|---|---|---|
| Performance | 90+ | 38 |
| SEO | 95+ | 92 |
| Accessibility | 90+ | 90 |
| Best Practices | 95+ | 96 |
| LCP | ≤ 2.5 s | 42.2 s |
| INP (TBT proxy) | ≤ 200 ms | 3561 ms |
| CLS | ≤ 0.1 | 0.009 ✅ |

CLS is the only metric already passing. Everything else needs the asset and third-party work.

**Existing LCP culprit:** the hero illustration `assets/FrontPage design.svg` (1.65 MB) is painted
above the fold with no `fetchpriority`, no preload, and no responsive variants. On `/our-work.html`
the eager `bg_only.png` (879 KB) inside the phone mockup fills the same role.

---

## Known defects found in the baseline (preserve or fix — see decision log)

1. **`sitemap.xml` lists fragments as URLs** (`/#about`, `/#services`, `/#reviews`, `/#contact`).
   Fragments are not pages; this is invalid sitemap content.
2. **`sitemap.xml` `lastmod` is `2026-07-26` for every entry** — a future date, which search
   engines discount.
3. **`data-category="branding"` matches zero gallery cards**; the Branding filter aliases to
   `logo`, so it shows only the 9 logos instead of both.
4. **No `og:image`, no `og:url`, no Twitter card, no canonical** on any page.
5. **`404.html` duplicates the design tokens inline** instead of importing `style.css`.
6. **Reel cards render as empty black boxes** until clicked (no `poster`).
7. **Broken background reference.** `css/style.css:748` points at
   `url('/v2/assets/BG_only.svg')` — an absolute path with a `/v2/` segment that does not exist.
   Every page load 404s it 4× (14 requests across this capture). The intended decorative
   background layer `.premium-bg-wrapper::before` is therefore **invisible on the live site**.
   The same rule sets `opacity: 15` (invalid — should be `0.15`, clamped to 1) and
   `background-attachment: fixed`, a known scroll-performance killer.
8. **`/favicon.ico` 404s** on any page that does not declare an icon (`404.html`).
9. **Tawk.to fails to load in any non-production origin** (CORS on
   `embed.tawk.to/6a50a992a6558f1d451fe2fa/1jt5hcpjs`). Expected locally, but it means the chat
   widget must be verified on the staging domain — a local baseline cannot confirm it works.
10. **`<html lang="en">` but no locale/hreflang metadata** — acceptable for a single-locale site.
