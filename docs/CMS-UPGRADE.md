# CMS upgrade — plan, migration and testing notes

Extends the existing Next.js + Payload site. Nothing is rebuilt from scratch: the
live routes (`/`, `/our-work`, `/blog`) keep their markup and CSS, and every
change is additive. All work is JavaScript (no TypeScript).

## Before the upgrade

| Area | State |
|---|---|
| Payload | 3.93.0, Postgres/Neon, local API singleton in `lib/payload.js` |
| Collections | `users` (1 admin), `media` (empty), `pages` (1 doc, slug `hello`), `posts`, `categories`, `projects`, `testimonials`, `redirects` |
| Frontend | `/`, `/our-work` (hardcoded gallery), `/blog`, `/blog/<slug>`; no custom page route, no project detail route |
| SEO | `lib/metadata.js`, `app/sitemap.js`, `app/robots.js`, `llms.txt`, RSS, Organization/WebSite/BlogPosting JSON-LD |
| Media | local disk (`public/media`); Cloudinary used only for remote video URLs hardcoded in `components/work-gallery-data.js` |
| Auth | Payload built-in; no invite flow, no `active` flag, no email adapter |
| Revalidation | hooks on `posts` and `pages` only |
| Migrations | none committed — the dev database had been schema-pushed |

## What was added

| # | Stage | Main files |
|---|---|---|
| 1 | Cloudinary media library | `lib/cloudinary.js`, `lib/cloudinaryAdapter.js`, `collections/Media.js`, `components/admin/MediaPreview.js` |
| 2 | Projects + `/projects` + `/projects/<slug>` | `collections/Projects.js`, `app/(frontend)/projects/**`, `components/projects/**`, `styles/projects.css` |
| 3 | Testimonials (drafts, rating, images) | `collections/Testimonials.js`, `components/Testimonials.js` |
| 4 | Homepage global (fixed layout, editable copy/media/toggles) | `globals/HomePage.js`, `components/{Hero,About,Services,Portfolio,Pricing,Footer}.js` |
| 5 | Pages with controlled blocks | `collections/Pages.js`, `app/(frontend)/[slug]/page.js`, `components/pages/**`, `lib/reserved-slugs.js` |
| 6 | Blog search, pagination, categories, tags, related posts | `app/(frontend)/blog/**`, `components/blog/BlogArchive.js` |
| 7 | Invitation-only auth | `collections/Users.js`, `components/admin/views/InviteUser.js`, `components/admin/InviteUserLink.js` |
| 8 | SEO/AEO, redirects, sitemap, JSON-LD | `lib/seo.js`, `collections/fields/seo.js`, `app/sitemap.js`, `app/llms.txt/route.js`, `proxy.js`, `app/(frontend)/[...notfound]/page.js` |
| 9 | Admin UX (preview, public URL, SEO checklist, thumbnails) | `components/admin/**`, collection `admin` config |
| 10 | Automatic revalidation | `lib/revalidate.js` + hooks in each collection/global |
| 11 | End-to-end tests | `scripts/test-*.mjs` |

### Drafts and public visibility

`projects`, `testimonials`, `pages`, `posts` and the Homepage global all support
drafts. Public pages query with `overrideAccess: false` and
`_status: { equals: 'published' }`, so a draft is a real 404/omission even if the
slug is known. Admins preview drafts through `/api/preview`, which checks the
Payload session cookie (anonymous requests get 401), enables Next draft mode, and
shows a warning banner on the page. `/api/exit-preview` clears it.

### Cloudinary media

- Custom adapter on the official `@payloadcms/plugin-cloud-storage` with the
  official `cloudinary` SDK. Credentials are server-only
  (`CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`).
- Folders: `stillloud/projects`, `stillloud/testimonials`, `stillloud/blogs`,
  `stillloud/homepage`, `stillloud/pages`, chosen per upload.
- Deterministic public IDs (`<folder>/<docId>-<filename>-<ext>`) mean the
  delivery URL can be rebuilt, image sizes resolve, replacements overwrite the
  same asset, and delete removes exactly one asset.
- Videos keep duration, width, height, format and bytes; a poster frame can be
  derived for admin previews.
- Without credentials the adapter is disabled and uploads go to `public/media`,
  so local development works with no cloud account.

### Invitation-only auth

- No public registration. `POST /api/users/invite` is admin-only and creates the
  account with a discarded random password, then triggers Payload's
  password-reset email so the person sets their own password. Links expire.
- Roles: `admin` (everything) and `editor` (content; publishing only when
  `publishingEnabled` is on).
- `active: false` blocks login with a readable 403. Admins can revoke access at
  any time without deleting content.
- Payload's built-in login throttling (attempts + lock time) is configured on the
  Users collection.
- Email uses `@payloadcms/email-nodemailer` when `SMTP_*` is present; otherwise
  Payload logs messages to the console.

### SEO / AEO

- One reusable `seoField` (title, description, canonical, share image, no-index,
  no-follow) used by posts, pages, projects and categories, applied to real
  `<head>` metadata through `lib/seo.js`.
- Dynamic `/sitemap.xml` (published posts, projects, pages, categories; skips
  no-index), `robots.txt` that allows AI crawlers, `/llms.txt`, RSS, and
  Organization / WebSite / BlogPosting / FAQPage / BreadcrumbList JSON-LD.
- Editable redirects apply as true 301/302 in `proxy.js` (Next 16's middleware
  replacement), cached for 60 seconds. `[...notfound]` keeps a 308 fallback and
  branded 404.

### Revalidation

`lib/revalidate.js` maps each content type to affected paths (home, listings,
detail pages, sitemap, `llms.txt`, RSS) and calls `revalidatePath`. Hooks run on
create, update, publish, unpublish and delete for projects, testimonials, posts,
categories, pages and the Homepage global. Outside the Next runtime the import is
a no-op, so CLI scripts still work; pages fall back to their ISR window.

## Migration notes

The project had **no committed migrations** before this upgrade; the database was
created with Payload dev push. To make deployment repeatable:

- `migrations/20261112_084113_initial_cms_schema.*` is a **full baseline** of the
  current schema (all collections, globals, blocks, version tables, indexes).
- It is recorded as **applied** (batch 1) on the existing database, because those
  tables already exist. Confirmed with
  `payload migrate:create verify_empty --skipEmpty` → no statements generated.
- On a **fresh** database, `npm run payload -- migrate` creates the whole schema.
- On the **existing** production database, record the baseline once before
  deploying, so `migrate` does not try to re-create tables:

  ```bash
  node --env-file=.env scripts/mark-baseline-applied.mjs 20261112_084113_initial_cms_schema
  ```

- Future schema changes: generate a normal diff migration and commit both files:

  ```bash
  PAYLOAD_CONFIG_PATH=payload.config.js NODE_ENV=production \
    npm run payload -- migrate:create <name>
  ```

`PAYLOAD_CONFIG_PATH=payload.config.js` is required for the Payload CLI in this
repo; without it the CLI fails with `Cannot read properties of null`.

### Data that must survive

- `pages.hello` keeps every legacy home-copy field. Those fields live in a hidden
  "Legacy" tab (`admin.condition: () => false`) so the columns and data survive.
  The record contained only placeholder copy ("yes"), so nothing was copied into
  the Homepage global and it starts empty (components provide the original copy).
  The doc is a draft, so it never becomes a public `/hello`.
- No collection or existing row was deleted. `projects` and `testimonials` gained
  drafts and fields only.

## Testing notes

- Real Cloudinary uploads were tested against the live account: image upload in
  all five folders, generated size, replacement (old asset and old size
  removed), video upload with duration/dimensions/format/bytes, poster frame,
  delivery URLs, and delete with no orphans. Run it with:

  ```bash
  node --env-file=.env scripts/test-cloudinary.mjs
  ```
- Invitation emails need `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` and
  optionally `EMAIL_FROM`. Without them Payload logs the message (including the
  setup link), which still allows the flow to be tested. **A real inbox delivery
  has not been tested.**
- Draft preview is session-based; a shared preview link is useless to a visitor
  (it returns 401). There is no `PREVIEW_SECRET` requirement.
- Redirects are applied in `proxy.js` with true 301/302 codes.
- Smoke tests create clearly-labelled `ZZ Test` records and remove them again:

  ```bash
  node --env-file=.env scripts/test-cms.mjs          # create + verify
  node --env-file=.env scripts/test-cms.mjs --clean  # remove
  node --env-file=.env scripts/test-auth.mjs         # invite/deactivate, self-cleaning
  node --env-file=.env scripts/test-draft.mjs        # draft privacy
  node --env-file=.env scripts/test-redirect.mjs     # 301/302
  node --env-file=.env scripts/test-redirect.mjs --clean
  node --env-file=.env scripts/test-cloudinary.mjs   # real uploads, self-cleaning
  node --env-file=.env scripts/test-project-media.mjs # media on the site + revalidation
  ```

## Status

Working and verified against the real Neon database:

- production build (`npm run build`) and the Proxy (Middleware) bundle;
- `/`, `/our-work`, `/projects`, `/projects/<slug>`, `/blog`,
  `/blog/<slug>`, `/blog/category/<slug>`, `/<slug>`, `/sitemap.xml`,
  `/llms.txt`, `/robots.txt`, branded 404;
- published-only queries: draft pages/posts/projects 404 publicly;
- sitemap and `llms.txt` include projects, pages, categories and posts;
- invite endpoint (403 anonymous, 200 admin), admin invite screen, deactivated
  login returns 403 with a readable message;
- editable redirects return real 301/302;
- real Cloudinary round trip: image upload in all folders, generated size,
  replacement, video metadata/poster, delete with no orphans (72/72 checks);
- frontend media + revalidation through the REST/admin path: a published
  project appears on `/projects/<slug>`, the static `/projects` listing and
  `/sitemap.xml` immediately, and disappears again after delete (12/12 checks);
- baseline migration recorded as applied, no schema drift;
- database left clean: 1 admin user, 1 draft legacy page, no test content.

Blocked on credentials / deployment target:

- real SMTP delivery of invite/reset mail;
- Vercel deployment (no project/token available in this environment).

## Production checklist

1. Add `CLOUDINARY_*` and `SMTP_*` to the deployment environment. Without
   Cloudinary, media stays on ephemeral local disk.
2. Record the baseline on the existing database once
   (`scripts/mark-baseline-applied.mjs`, see above), then run
   `npm run payload -- migrate` on future releases.
3. Set `NEXT_PUBLIC_SERVER_URL` to the public origin so canonical URLs, emails
   and Open Graph images are absolute.
4. Sign in at `/admin`, open **Invite user**, and create the client's editor
   account. Enable **Allow publishing** only for people who should publish.
5. Add projects, testimonials and pages; upload media into the matching
   Cloudinary folder; use **Preview** to check drafts before publishing.
