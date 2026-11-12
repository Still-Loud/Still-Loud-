# Deployment

The app is a standard Next.js project backed by Neon Postgres and Cloudinary, so
it deploys to Vercel without custom infrastructure. This file is the checklist
for the first deploy and for every release after it.

## 1. Neon

The project uses a Neon Postgres database. Two connection strings matter:

| Variable | Host | Used by |
|---|---|---|
| `DATABASE_URL` | `...-pooler...` | the running app (PgBouncer, safe for serverless) |
| `DATABASE_URL_UNPOOLED` | direct host | migrations and long scripts |

Rules:

- Never put the direct string in `DATABASE_URL`. Vercel functions are
  short-lived and would exhaust Postgres connections without the pooler.
- `sslmode=require` is fine today; the driver treats it as `verify-full`.
- Branch-first: create a Neon branch for schema experiments, run
  `payload migrate` against it, then merge. Production talks only to the
  production branch.
- `DATABASE_URL_UNPOOLED` is not needed by the deployed app; keep it locally
  (or as a CI secret) for migrations.

## 2. Environment variables

Set every variable in **Vercel -> Project -> Settings -> Environment Variables**
for **Production**, **Preview** and **Development**. They must be present at
**build time**, not just at runtime: the static homepage, listings, sitemap,
`llms.txt` and RSS are prerendered during `next build` and query Payload while
building.

| Variable | Required | Notes |
|---|---|---|
| `DATABASE_URL` | yes | Pooled Neon connection string. |
| `PAYLOAD_SECRET` | yes | 32+ random characters. Signs JWTs and sessions. |
| `NEXT_PUBLIC_SERVER_URL` | yes | Public origin, no trailing slash, e.g. `https://stillloud.in`. Inlined at build time. |
| `CLOUDINARY_CLOUD_NAME` | yes | Media uploads. |
| `CLOUDINARY_API_KEY` | yes | |
| `CLOUDINARY_API_SECRET` | yes | |
| `BREVO_SMTP_HOST` | no | Invitations and password resets are emailed only when set. |
| `BREVO_SMTP_PORT` | no | `587` |
| `BREVO_SMTP_USER` | no | |
| `BREVO_SMTP_KEY` | no | |
| `EMAIL_FROM` | no | From address for transactional mail. |
| `EMAIL_FROM_NAME` | no | Display name, e.g. `StillLoud`. |
| `DATABASE_URL_UNPOOLED` | no | Only for running migrations. |
| `BLOB_READ_WRITE_TOKEN` | no | Legacy fallback; unused while Cloudinary is configured. |

Generate a secret (never reuse the local one, never commit it):

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Changing an environment variable does **not** update existing deployments.
Always trigger a new deployment after editing variables.

### Troubleshooting: "missing secret key"

```
Error: missing secret key. A secret key is needed to secure Payload.
Error occurred prerendering page "/"
```

This is not a code error. The build environment could not see
`PAYLOAD_SECRET`. Fix it in this order:

1. Confirm `PAYLOAD_SECRET` exists in Vercel for the environment being built
   (Production vs Preview are separate scopes).
2. Generate a fresh 32+ character value and paste it in, without spaces or
   quotes.
3. Redeploy — **Redeploy with existing Build Cache** is not enough if the
   variable was added after the build started; use a fresh deployment.
4. If it still fails, check the build log for the variable list at build start;
   a variable scoped only to "Development" will not exist in a Production build.

The same rule applies to `DATABASE_URL`: after the secret is accepted, the build
will connect to Neon to prerender pages. A missing or unreachable database shows
up as a connection error during the same step.

## 3. Build

Vercel defaults are correct:

- Framework preset: Next.js
- Install command: `npm install`
- Build command: `npm run build`
- Node: 22.x

`npm run build` starts with `scripts/check-env.mjs`, which prints every expected
variable as `set` or `missing` (never its value) plus the Vercel environment and
repository. If a required variable is absent it stops immediately with the
missing names, before Next tries to prerender. Use that list to fix the Vercel
environment instead of guessing from the Payload error.

`npm run build` also builds Payload's admin bundle. If an admin component or the
import map changes, run `npm run generate:importmap` first and commit
`app/(payload)/admin/importMap.js`.

Migrations are **not** run automatically during the Vercel build. Run them
separately (see below) so a schema change can be reviewed before it reaches the
production database.

## 4. Database migrations

Payload's Postgres adapter only pushes schema automatically in development.
Production uses the committed migrations:

| Migration | Contents |
|---|---|
| `20261112_084113_initial_cms_schema` | Full baseline: users, media, pages, posts, categories, projects, testimonials, redirects, homepage, blocks, version tables. |
| `20261112_102753_add_invitations_and_project_case_study` | `invitations`, project case-study columns, external links, video gallery, related-project relationships. |

The existing Neon database already has both recorded as applied (batches 1 and
2). On a **fresh** database, run them in order.

```bash
# Uses the direct (unpooled) connection; override DATABASE_URL for the CLI.
DATABASE_URL="$DATABASE_URL_UNPOOLED" \
  PAYLOAD_CONFIG_PATH=payload.config.js NODE_ENV=production \
  npm run payload -- migrate
```

Windows PowerShell:

```powershell
$env:DATABASE_URL = $env:DATABASE_URL_UNPOOLED
$env:PAYLOAD_CONFIG_PATH = 'payload.config.js'
$env:NODE_ENV = 'production'
npm run payload -- migrate
```

- `PAYLOAD_CONFIG_PATH=payload.config.js` is required by the CLI in this repo.
- `migrate:create` also needs `NODE_ENV=production` and `--skipEmpty`.
- If a `dev` marker (batch `-1`) exists in `payload_migrations`, `migrate` asks
  for confirmation; that marker comes from schema push during development.
- Recording an already-applied migration:
  `node --env-file=.env scripts/mark-baseline-applied.mjs <migration-name>`.

## 5. After the first deploy

1. Open `https://<domain>/admin/create-first-user` and create the administrator.
   The first account is forced to `role: admin`.
2. Open **User management**, generate an invitation for the client's editor and
   copy the link. If Brevo is configured the invitation is also emailed.
3. Upload a test image through **Media** and confirm the URL is on
   `res.cloudinary.com` (not `/api/media/file/...`).
4. Publish a project and confirm it appears on `/projects`, `/projects/<slug>`,
   `/our-work` and `/sitemap.xml` without a redeploy.
5. Delete the test content and invitation.

## 6. Verification checklist

All of these must pass on the production domain:

| Check | Expected |
|---|---|
| `/` | 200, hero renders, no `localhost` in the HTML |
| `/our-work` | 200 |
| `/projects`, `/projects/<slug>` | 200 for a published project |
| `/blog`, `/blog/<slug>` | 200 for a published post |
| `/accept-invite` (no token) | 200 with "Invitation unavailable", `noindex` |
| `/admin` | login page (200) |
| `/sitemap.xml` | 200, every `<loc>` on the public origin |
| `/robots.txt` | 200, AI crawlers allowed |
| `/llms.txt` | 200 |
| `/blog/rss.xml` | 200, valid XML |
| unknown URL | 404 with the branded page |
| any page | `og:url`, `og:site_name`, `og:image`, `twitter:card=summary_large_image` |
| any page | canonical + JSON-LD `@id`s use the public origin |

Grep the built HTML for `localhost`. A stray one means
`NEXT_PUBLIC_SERVER_URL` was missing when the build ran.

Social cards: paste `/our-work` into the LinkedIn Post Inspector and the X card
validator once. The image is `public/og/og-default.jpg`; regenerate with
`npm run generate:og` if the logo or palette changes.

## 7. Caching and revalidation

`lib/revalidate.js` maps each content type to its affected paths. Hooks fire on
create, update, publish, unpublish and delete for projects, testimonials, posts,
categories, pages and the Homepage global, so the homepage, listings, detail
pages, `/sitemap.xml`, `/llms.txt` and RSS update without a redeploy. Outside the
Next runtime the purge is a no-op, so CLI scripts still work; static routes also
keep an ISR window (5 minutes for content, 1 hour for feeds) as a fallback.

## 8. Rollback

Vercel keeps every deployment; promote a previous one from the dashboard.
Database schema changes are not rolled back automatically — revert with
`payload migrate:down` only after checking what that migration touched.

## 9. Still open

- Real Brevo SMTP delivery has not been tested. Invitations work without it via
  the copy-link flow.
- Ownership of the two Cloudinary accounts (`n4d0qen2`, `tebtzfn8`).
- Client questions in `docs/DECISIONS.md` (reel posters, contact form, GA4 + GTM
  duplication, `publishingEnabled` policy).
