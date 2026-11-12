import { postgresAdapter } from '@payloadcms/db-postgres'
import { nodemailerAdapter } from '@payloadcms/email-nodemailer'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { cloudStoragePlugin } from '@payloadcms/plugin-cloud-storage'
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
import { HomePage } from './globals/HomePage.js'
import { createCloudinaryAdapter } from './lib/cloudinaryAdapter.js'
import { isCloudinaryConfigured } from './lib/cloudinary.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const cloudinaryEnabled = isCloudinaryConfigured()
const emailEnabled = Boolean(
  process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS
)

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
    meta: {
      titleSuffix: ' — StillLoud',
    },
    components: {
      afterNavLinks: ['/components/admin/InviteUserLink#InviteUserLink'],
      views: {
        invite: {
          Component: '/components/admin/views/InviteUser#InviteUser',
          path: '/invite',
        },
      },
    },
  },

  collections: [Users, Media, Pages, Posts, Categories, Projects, Testimonials, Redirects],

  globals: [HomePage],

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

  /* Uploads go to Cloudinary when CLOUDINARY_* is configured. The plugin is
     always installed with `alwaysInsertFields` so the media schema (url,
     _objectKey) does not change between environments; with no credentials it
     is disabled and Payload keeps writing to public/media. */
  plugins: [
    cloudStoragePlugin({
      enabled: cloudinaryEnabled,
      alwaysInsertFields: true,
      collections: {
        media: {
          adapter: createCloudinaryAdapter(),
          disablePayloadAccessControl: true,
        },
      },
    }),
  ],

  /* Invitations and password resets are sent through SMTP when configured.
     Without it Payload falls back to its console logger. */
  ...(emailEnabled
    ? {
        email: nodemailerAdapter({
          defaultFromAddress: process.env.EMAIL_FROM || 'team.stillloud@gmail.com',
          defaultFromName: process.env.EMAIL_FROM_NAME || 'StillLoud',
          transportOptions: {
            host: process.env.SMTP_HOST,
            port: Number(process.env.SMTP_PORT || 587),
            secure: Number(process.env.SMTP_PORT) === 465,
            auth: {
              user: process.env.SMTP_USER,
              pass: process.env.SMTP_PASS,
            },
          },
        }),
      }
    : {}),

  // Server URL used for absolute links in emails and the admin UI.
  serverURL: process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000',
})
