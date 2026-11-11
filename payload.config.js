import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { buildConfig } from 'payload'
import sharp from 'sharp'
import { fileURLToPath } from 'url'

import { Categories } from './collections/Categories.js'
import { Media } from './collections/Media.js'
import { Pages } from './collections/Pages.js'
import { Posts } from './collections/Posts.js'
import { Projects } from './collections/Projects.js'
import { Redirects } from './collections/Redirects.js'
import { Testimonials } from './collections/Testimonials.js'
import { Users } from './collections/Users.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
    meta: {
      titleSuffix: ' — StillLoud',
    },
  },

  collections: [Users, Media, Pages, Posts, Categories, Projects, Testimonials, Redirects],

  editor: lexicalEditor(),

  secret: process.env.PAYLOAD_SECRET || '',

  db: postgresAdapter({
    pool: {
      // Pooled Neon connection (PgBouncer) — used at runtime by the app.
      // `neon init` writes DATABASE_URL; DATABASE_URI is kept as a fallback so
      // a pre-existing .env keeps working.
      connectionString:
        process.env.DATABASE_URL || process.env.DATABASE_URI || '',
    },
  }),

  sharp,

  // Server URL used for absolute links in emails and the admin UI.
  serverURL: process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000',
})
