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
| 7 | Invitation-only auth (manual links + optional Brevo email) | `collections/Users.js`, `collections/Invitations.js`, `lib/invitations.js`, `lib/email.js`, `lib/rateLimit.js`, `components/admin/views/UserManagement.js`, `app/(frontend)/accept-invite/page.js`, `components/AcceptInviteForm.js` |
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

### Projects and case studies

`collections/Projects.js` covers the full brief: title, slug, client, category,
description, rich-text story, structured case-study sections (objective,
challenge, strategy, creative process, final solution), services, completion
date, cover image/video plus poster, gallery, video gallery, an `externalLinks`
array, a `relatedProjects` selection, featured flag, ordering, SEO fields and
drafts.

`/projects/<slug>` renders the sections as headings above the gallery, lists
external links in the facts panel and shows up to three related projects. A
manual `relatedProjects` selection wins; an empty selection falls back to
same-category published work. Draft projects can never appear in either list.
Changes revalidate the listing, the detail page, the homepage and `/sitemap.xml`.

### Invitation-only auth

Accounts are invitation-only. There is no public registration and no email
dependency: an administrator generates a link, copies it and shares it privately.

**Invitation model** (`collections/Invitations.js`, `lib/invitations.js`)

- An invitation stores email, optional name, role, expiry (default 24 h, max
  30 days), status (`pending` / `accepted` / `revoked`) and a **SHA-256 hash** of
  a 256-bit `crypto.randomBytes` token. The raw token is never stored.
- Creating an invitation does **not** create a user. The account only exists
  after `/accept-invite` succeeds.
- Endpoints are admin-only and rate-limited:
  `POST /api/invitations/{generate,validate,accept,revoke,resend}`.
- `generate` and `resend` return the full link **once**, in the response body.
  Later reads of the collection never include the token or its hash.
- Issuing a new link for the same address revokes the previous pending one.
- Accepting marks the record `accepted`, stores `acceptedAt` / `acceptedUser`
  and creates the user with the role **from the invitation**, never from the
  request body.
- Token hashes are kept after accept/revoke so a reused link reports
  "already used" / "revoked" instead of "invalid". Status still prevents reuse.

**`/accept-invite`** (`app/(frontend)/accept-invite/page.js`)

- The token is validated on the server before any HTML is rendered. Invalid,
  expired, revoked and used links never see the form.
- The page shows the intended email read-only; the visitor sets name, password
  and confirmation. The role is displayed but not selectable.
- On success the account is active immediately, then the browser is sent to
  `/admin/login`. The token is stripped from the address bar.

**Roles and server-side enforcement**

- `admin` — full access, user management, invitations, roles, system config.
- `editor` — content only. Cannot invite, read invitations, change roles,
  flip `active` / `publishingEnabled`, delete users, or read other users'
  sessions. Field access plus `beforeChange` guards enforce this on the server;
  hiding admin links is convenience only.
- The first account created on an empty database is forced to `admin`.

**Sessions and tokens** (Payload's own auth, nothing custom)

- Passwords are hashed by Payload; JWTs are signed by Payload and delivered in
  `HttpOnly` cookies (`SameSite=Lax`, `Secure` in production). No token is ever
  written to `localStorage` or `sessionStorage`.
- `useSessions: true` adds a server-side session id to each JWT. Disabling an
  account clears `sessions`, so an already-issued cookie stops working at once.
- JWT lifetime is 2 hours; password-reset tokens expire after 1 hour.
- 5 failed logins lock the account for 15 minutes (`maxLoginAttempts`,
  `lockTime`). `proxy.js` additionally throttles login, forgot-password and
  reset-password by client IP.
- `cors`, `csrf` and `serverURL` are pinned to `NEXT_PUBLIC_SERVER_URL`, so
  cookie-authenticated writes are refused from other origins.
- Nothing sensitive is logged: invitation URLs, tokens, passwords and JWTs are
  never printed by the app.

**Email stays optional** (`lib/email.js`)

- If `BREVO_SMTP_*` (or `SMTP_*`) is configured, invitations, password resets
  and the welcome mail are sent through `@payloadcms/email-nodemailer`.
- Without it the workflow still works: the admin copies the link. A send failure
  is logged as a generic message and never blocks link generation.
- Placeholders live in `.env.example`: `BREVO_SMTP_HOST`, `BREVO_SMTP_PORT=587`,
  `BREVO_SMTP_USER`, `BREVO_SMTP_KEY`, `EMAIL_FROM`, `EMAIL_FROM_NAME`.

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
- `migrations/20261112_102753_add_invitations_and_project_case_study.*` is the
  next diff migration: the `invitations` collection, the project case-study
  columns, `projects_external_links`, `projects_video_gallery` and the related
  version/relationship tables. It is recorded as applied (batch 2). Verified
  with `migrate:create verify_invitations --skipEmpty` → no statements.
- On a **fresh** database, `npm run payload -- migrate` creates the whole schema
  in order.
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
- Invitation email delivery needs `BREVO_SMTP_HOST`, `BREVO_SMTP_PORT`,
  `BREVO_SMTP_USER`, `BREVO_SMTP_KEY` and `EMAIL_FROM`. Without them nothing is
  emailed and no token is written to the log — the admin copies the generated
  link instead. **A real inbox delivery has not been tested.**
- Invitation security suite (`scripts/test-invitations.mjs`, 45 checks):
  no public registration, login/logout, cookie flags, 24 h default expiry,
  link creation/copy/validate/accept, role taken from the invitation (a body
  `role: admin` is ignored), reused/expired/revoked links rejected with the
  correct state, replacement links invalidating the old one, editor blocked
  from invitations and role/active changes, account lockout after repeated
  failures, and disabled users losing live sessions.
- Draft preview is session-based; a shared preview link is useless to a visitor
  (it returns 401). There is no `PREVIEW_SECRET` requirement.
- Redirects are applied in `proxy.js` with true 301/302 codes.
- Smoke tests create clearly-labelled `ZZ Test` records and remove them again:

  ```bash
  node --env-file=.env scripts/test-cms.mjs          # create + verify
  node --env-file=.env scripts/test-cms.mjs --clean  # remove
  node --env-file=.env scripts/test-auth.mjs         # invitation → account → deactivate
  node --env-file=.env scripts/test-invitations.mjs  # 45-check auth/invitation matrix
  node --env-file=.env scripts/test-draft.mjs        # draft privacy
  node --env-file=.env scripts/test-redirect.mjs     # 301/302
  node --env-file=.env scripts/test-redirect.mjs --clean
  node --env-file=.env scripts/test-cloudinary.mjs   # real uploads, self-cleaning
  node --env-file=.env scripts/test-project-media.mjs # case study + related + media + revalidation
  node --env-file=.env scripts/test-homepage.mjs     # homepage global revalidation
  ```

### Manual testing

1. `npm run build && npm run start`, sign in at `/admin` as the admin account.
2. Open **User management** (admin-only link). Generate an invitation for a test
   address, choose **Editor**, copy the link. Confirm no user appears yet.
3. Open the link in a private window: the intended email is shown read-only and
   there is no role selector. Set a name/password and activate.
4. Sign in as the new editor. Confirm `/admin/user-management` shows the
   no-access message and that invitations cannot be read.
5. Back as admin, disable the editor. Their open tab is signed out on the next
   request. Reactivate, then use **New link** on a pending invitation and confirm
   the old link reports "revoked".
6. Open a used link: it reports "already used". Delete the test invitations and
   user when finished.


## Status

Working and verified against the real Neon database:

- production build (`npm run build`) and the Proxy (Middleware) bundle;
- `/`, `/our-work`, `/projects`, `/projects/<slug>`, `/blog`,
  `/blog/<slug>`, `/blog/category/<slug>`, `/<slug>`, `/sitemap.xml`,
  `/llms.txt`, `/robots.txt`, branded 404;
- published-only queries: draft pages/posts/projects 404 publicly;
- sitemap and `llms.txt` include projects, pages, categories and posts;
- invitation-only auth: public registration 403, anonymous/admin invitation
  endpoints, copyable link, `/accept-invite` in a clean browser, role fixed by
  the invitation, reused/expired/revoked links rejected, editor boundaries,
  account lockout and session revocation on disable (45/45 checks);
- invitations and auth smoke test (`scripts/test-auth.mjs`) pass end to end;
- project case study fields, external links and related projects render on
  `/projects/<slug>` through the REST/admin path, with listing and sitemap
  revalidation (17/17 checks);
- homepage global edits revalidate `/` immediately (5/5 checks);
- editable redirects return real 301/302;
- real Cloudinary round trip: image upload in all folders, generated size,
  replacement, video metadata/poster, delete with no orphans (72/72 checks);
- frontend media + revalidation through the REST/admin path: a published
  project appears on `/projects/<slug>`, the static `/projects` listing and
  `/sitemap.xml` immediately, and disappears again after delete;
- baseline and invitation/case-study migrations recorded as applied, no schema
  drift;
- server logs contain no invitation URLs, tokens, passwords or JWTs;
- database left clean: no test users, invitations or content — only the
  original admin account(s) and the draft `hello` page remain.

Known limitations / pending:

- Real SMTP delivery through Brevo has not been tested (no credentials yet);
  manual links are the working path.
- Vercel deployment has not been performed (no project/token in this
  environment).

## Production checklist

1. Add `CLOUDINARY_*` and the Brevo `BREVO_SMTP_*` + `EMAIL_FROM` variables to
   the deployment environment. Without Cloudinary, media stays on ephemeral local
   disk; without Brevo, invitations are copy-link only.
2. Record the baseline on the existing database once
   (`scripts/mark-baseline-applied.mjs`, see above), then run
   `npm run payload -- migrate` on future releases.
3. Set `NEXT_PUBLIC_SERVER_URL` to the public origin so canonical URLs,
   invitation links, CSRF and Open Graph images are absolute.
4. Sign in at `/admin`, open **User management**, generate an invitation for the
   client's editor and share the copied link privately. Enable **Allow
   publishing** only for people who should publish.
5. Add projects, testimonials and pages; upload media into the matching
   Cloudinary folder; use **Preview** to check drafts before publishing.
