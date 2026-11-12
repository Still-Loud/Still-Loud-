# StillLoud

Website and CMS for StillLoud, a branding and digital design studio. The public
site is a Next.js App Router frontend; the content is managed in an embedded
Payload CMS with invitation-only accounts, Cloudinary media and Pages/Projects/
Posts/Testimonials.

This is an additive upgrade of the original site: the existing pages, markup and
CSS from `v1/` are preserved, not rebuilt.

## Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16 (App Router, `proxy.js` instead of middleware) |
| CMS | Payload 3.93 (Local API + REST + GraphQL) |
| Database | PostgreSQL on Neon (`@payloadcms/db-postgres`) |
| Media | Cloudinary through `@payloadcms/plugin-cloud-storage` |
| Editor | Lexical (`@payloadcms/richtext-lexical`) |
| Email | `@payloadcms/email-nodemailer` (Brevo SMTP, optional) |
| Language | JavaScript (no TypeScript in app code) |
| Node | >= 20.9 |

## Features

**Content**
- Homepage global with fixed layout: hero, about, services, featured projects,
  testimonials, pricing, CTA, contact and SEO. Copy, media and section
  visibility are editable; the design is not.
- Projects / case studies with objective, challenge, strategy, creative process,
  final solution, services, gallery, video gallery, external links, related
  projects, featured flag and drafts.
- Blog with posts, categories, tags, search, pagination, related posts and RSS.
- Testimonials with rating, image and drafts.
- Custom pages built from a controlled block set (text, image + text, gallery,
  video, FAQ, CTA). Slugs colliding with real routes are rejected.
- Editable redirects served as true 301/302.
- Draft preview through `/api/preview`, guarded by the Payload session cookie.

**Accounts and security**
- Invitation-only: no public registration.
- Admin generates a link (or Brevo emails it), the invitee sets name + password
  at `/accept-invite`, and the account is created with the role the admin chose.
- Invitation tokens are 256-bit random values; only a SHA-256 hash is stored.
  Links expire (24 h default) and are single-use. Revoking or re-issuing
  invalidates earlier links.
- Payload JWT in `HttpOnly`, `SameSite=Lax`, `Secure`-in-production cookies.
  Nothing is stored in `localStorage` / `sessionStorage`.
- Server-side sessions: disabling an account invalidates issued tokens.
- Per-account lockout (5 failures / 15 min) plus IP throttling on login and
  password-reset endpoints.
- Roles enforced server-side: `admin` (everything) and `editor` (content only —
  no invitations, role changes, publishing without the flag, or user management).
- CSRF/CORS pinned to `NEXT_PUBLIC_SERVER_URL`.

**Media and SEO**
- Every image and video is uploaded to Cloudinary with alt text, caption,
  preview, replacement and delete.
- Per-document `seoField` (title, description, canonical, share image, no-index,
  no-follow) applied to real `<head>` metadata.
- Dynamic `/sitemap.xml`, `robots.txt`, `llms.txt`, RSS, and
  Organization / WebSite / BlogPosting / FAQPage / BreadcrumbList JSON-LD.
- Content changes revalidate the affected pages on demand (homepage, listings,
  detail pages, categories, sitemap, `llms.txt`, RSS).

## Quick start

```bash
# 1. Install
npm install

# 2. Configure
cp .env.example .env        # Windows: copy .env.example .env
# fill DATABASE_URL, DATABASE_URL_UNPOOLED, PAYLOAD_SECRET,
# NEXT_PUBLIC_SERVER_URL, CLOUDINARY_* (and BREVO_* when ready)

# 3. Create/refresh the schema
npm run payload -- migrate

# 4. Run
npm run dev                 # http://localhost:3000
```

On an empty database the first account created at `/admin` becomes an
administrator. After that, add people through **User management**.

## Environment variables

| Variable | Required | Purpose |
|---|---|---|
| `DATABASE_URL` | yes | Pooled Neon connection used at runtime. |
| `DATABASE_URL_UNPOOLED` | yes | Direct connection for migrations and scripts. |
| `DATABASE_URI` / `DATABASE_URI_DIRECT` | no | Fallback names read by `payload.config.js`. |
| `PAYLOAD_SECRET` | yes | Signs JWTs and sessions (32+ random chars). |
| `NEXT_PUBLIC_SERVER_URL` | yes | Public origin, no trailing slash. Drives canonicals, invitation links, CSRF and Open Graph. |
| `CLOUDINARY_CLOUD_NAME` / `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET` | prod | Cloudinary uploads. Without them media falls back to local disk. |
| `BREVO_SMTP_HOST` / `BREVO_SMTP_PORT` / `BREVO_SMTP_USER` / `BREVO_SMTP_KEY` | no | Brevo SMTP. Without them invitation links are copy-only. |
| `EMAIL_FROM` / `EMAIL_FROM_NAME` | no | From address and display name for transactional mail. |
| `BLOB_READ_WRITE_TOKEN` | no | Optional Vercel Blob fallback when Cloudinary is off. |

Generate a secret with:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Never commit `.env`; it is gitignored. Use `.env.example` as the template.

## Routes

| Route | Description |
|---|---|
| `/` | Homepage (global content, ISR 5 min) |
| `/our-work` | Portfolio gallery |
| `/projects` | Project listing |
| `/projects/<slug>` | Project case study |
| `/blog` | Blog archive with search/pagination |
| `/blog/<slug>` | Post |
| `/blog/category/<slug>` | Category archive |
| `/<slug>` | Custom Page |
| `/accept-invite` | Invitation acceptance (token validated server-side) |
| `/admin` | Payload admin |
| `/api/*` | Payload REST + preview endpoints |
| `/sitemap.xml`, `/robots.txt`, `/llms.txt`, `/blog/rss.xml` | Generated SEO files |

## Content model

Collections: `users`, `invitations`, `media`, `pages`, `posts`, `categories`,
`projects`, `testimonials`, `redirects`.
Globals: `home-page`.

All content collections use drafts. Public queries pass `overrideAccess: false`
and `_status: 'published'`, so drafts are omitted (and 404 on detail routes)
even when the slug is known.

## Invitation workflow

1. Sign in at `/admin` as an administrator.
2. Open **User management** (admin-only link).
3. Enter the email (and optional name), choose `Editor` or `Administrator`, pick
   an expiry, then **Generate invitation**.
4. Copy the link shown once and send it privately. If Brevo is configured the
   invitation is also emailed.
5. The invitee opens the link, sees the intended email read-only, sets their
   name and password. The role is fixed by the invitation.
6. The account is active immediately; the invitee signs in at `/admin`.

The status table shows pending / accepted / expired / revoked. **New link**
issues a replacement and invalidates the previous one; **Revoke** kills access.
An administrator can also disable, reactivate, re-role or delete accounts.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Development server. |
| `npm run build` | Production build. |
| `npm run start` | Serve the production build. |
| `npm run payload -- <cmd>` | Payload CLI (migrations, import map, …). |
| `npm run generate:importmap` | Regenerate `app/(payload)/admin/importMap.js` after changing admin components. |
| `npm run generate:og` | Regenerate the social share image. |

Smoke tests (self-cleaning, need the dev server on `:3000` for HTTP checks):

```bash
node --env-file=.env scripts/test-invitations.mjs     # 45 auth/invitation checks
node --env-file=.env scripts/test-auth.mjs            # invite → account → deactivate
node --env-file=.env scripts/test-cms.mjs             # content create/verify
node --env-file=.env scripts/test-cms.mjs --clean     # remove test content
node --env-file=.env scripts/test-project-media.mjs   # projects + Cloudinary + revalidation
node --env-file=.env scripts/test-homepage.mjs        # homepage revalidation
node --env-file=.env scripts/test-draft.mjs           # draft privacy
node --env-file=.env scripts/test-redirect.mjs        # 301/302
node --env-file=.env scripts/test-cloudinary.mjs      # real Cloudinary round trip
```

## Project structure

```
app/(frontend)/     Public site routes
app/(payload)/      Admin, REST and GraphQL handlers
collections/        Payload collections + shared access rules
globals/            Homepage global
components/         Frontend sections, blog/project UI, admin views
lib/                Payload client, media, SEO, revalidation, invitations,
                    email, rate limiting
migrations/         Committed Payload migrations
scripts/            Smoke tests and one-off maintenance scripts
styles/             Site CSS (carried over from v1 where possible)
docs/               Upgrade notes, decisions, deployment guide
v1/                 Original static site, kept for reference
```

## Deployment

The step-by-step guide is in [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md):
Neon project, environment variables, build, migrations, first-admin setup,
verification and rollback.

Key points:

1. Add the database, Payload and Cloudinary variables (and Brevo when ready) to
   the hosting project.
2. Set `NEXT_PUBLIC_SERVER_URL` to the public origin. Invitation links and
   canonical URLs depend on it.
3. Run `npm run payload -- migrate` on release. Never rely on dev schema push in
   production.
4. Create the first administrator, then invite the client's editors from
   **User management**.

## Documentation

- [`docs/CMS-UPGRADE.md`](docs/CMS-UPGRADE.md) — what changed, migrations,
  testing, status and limitations.
- [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) — deploy, migrate, verify, roll back.
- [`docs/DECISIONS.md`](docs/DECISIONS.md) — version pins and delivery decisions.

## Known limitations

- Brevo SMTP delivery has not been exercised against a real inbox. Invitations
  work without it via copy-link.
- Rate limiting in `proxy.js` is in-memory: effective per instance, not a
  distributed guarantee. Payload's per-account lockout is the hard backstop.
- Without Cloudinary credentials, uploads are written to local disk and will not
  survive an ephemeral host.
