# Deployment

Everything below assumes the repository is pushed to GitHub and imported into
Vercel. Nothing here is done yet - it is the checklist for going live.

## 1. Neon

The project already points at Neon (`nameless-breeze-26271088`). Two connection
strings matter:

| Variable | Host | Used by |
|---|---|---|
| `DATABASE_URL` | `...-pooler...` | the running app (PgBouncer, safe for serverless) |
| `DATABASE_URL_UNPOOLED` | direct host | migrations and long scripts |

Rules:

- Never put the direct string in `DATABASE_URL`. Vercel functions are
  short-lived and would exhaust Postgres connections without the pooler.
- `sslmode=require` is fine today; the driver treats it as `verify-full`.
- Branch-first: create a Neon branch for schema experiments, run
  `payload migrate` against it, then merge. The production branch is the only
  one the deployed app talks to.

## 2. Environment variables

Copy `.env.example` and fill it in. On Vercel set the same names for
Production, Preview and Development (Preview can point at a Neon branch).

Required:

- `DATABASE_URL`
- `PAYLOAD_SECRET` - 32+ characters. The local one is currently 18; generate a
  fresh one for production.
- `NEXT_PUBLIC_SERVER_URL` - `https://stillloud.in`, no trailing slash.

Required for uploads:

- `BLOB_READ_WRITE_TOKEN` - created by connecting a Blob store to the project
  (Vercel dashboard -> Storage -> Create -> Blob). The token is injected
  automatically when the store is connected.

Without the Blob token Payload writes to `public/media`. That works locally but
Vercel's filesystem is read-only in production, so uploads will fail there.

## 3. Build

Vercel defaults are correct:

- Framework preset: Next.js
- Install: `npm install`
- Build: `npm run build`
- Node: 22.x

`npm run build` also runs Payload's admin bundle. If an admin component or the
import map changes, run `npm run generate:importmap` first and commit the result.

## 4. Database migrations

Payload's Postgres adapter only auto-pushes schema in development. Production
expects migrations:

```bash
npm run payload -- migrate:create
npm run payload -- migrate        # with DATABASE_URL_UNPOOLED exported
```

The current schema was created by dev pushes and already exists in Neon, so the
first deploy needs no migration. Any later change to a collection needs one.

## 5. After the first deploy

1. Open `https://stillloud.in/admin/create-first-user` and create the admin
   account. The first-user hook forces `role: admin`.
2. Upload a test image through Media and confirm the URL is on
   `*.public.blob.vercel-storage.com` (not `/media/...`).
3. Check the checklist below, then delete the test image and post.

## 6. Verification checklist

All of these must pass on the production domain:

| Check | Expected |
|---|---|
| `/` | 200, hero renders |
| `/our-work` | 200 |
| `/blog` | 200 |
| `/blog/<slug>` | 200 for a published post |
| `/our-work.html` | 308 -> `/our-work` |
| `/index.html` | 308 -> `/` |
| `/admin` | login page (200) |
| `/sitemap.xml` | 200, every `<loc>` on `https://stillloud.in` |
| `/robots.txt` | 200, `Host:` without scheme, AI crawlers allowed |
| `/llms.txt` | 200 |
| `/blog/rss.xml` | 200, valid XML |
| unknown URL | 404 with the branded page |
| any page | `og:url`, `og:site_name`, `og:image` (1200x630), `twitter:card=summary_large_image` |
| any page | canonical + JSON-LD `@id`s use `https://stillloud.in` |

Grep the HTML for `localhost` before signing off - a stray one means
`NEXT_PUBLIC_SERVER_URL` was missing at build time.

Social cards: paste `/our-work` into the LinkedIn Post Inspector and the X card
validator once. The image is `public/og/og-default.jpg`; regenerate with
`npm run generate:og` if the logo or palette changes.

## 7. Caching and revalidation

`Posts` and `Pages` trigger `revalidatePath` through `lib/revalidate.js`.
Blog routes also revalidate on a 60 s timer, sitemap/RSS/llms.txt on 3600 s, so
content changes surface even if the hook misses (e.g. a direct DB edit).

## 8. Rollback

Vercel keeps every deployment; promote the previous one from the dashboard.
Database schema changes are not rolled back automatically - revert with
`payload migrate:down` only after checking what the migration touched.

## 9. Still open

- Ownership of the two Cloudinary accounts (`n4d0qen2`, `tebtzfn8`).
- Blob store has not been created yet, so no production upload test exists.
- `Projects` and `Testimonials` collections are not read by the frontend yet;
  they need media uploads (or a seed of `public/assets`) before they can replace
  the hardcoded gallery.
- Client questions in `docs/DECISIONS.md` (reel posters, contact form, GA4 + GTM
  duplication, `publishingEnabled` policy).
