import { postgresAdapter } from '@payloadcms/db-postgres'
import { nodemailerAdapter } from '@payloadcms/email-nodemailer'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { cloudStoragePlugin } from '@payloadcms/plugin-cloud-storage'
import path from 'path'
import { buildConfig } from 'payload'
import sharp from 'sharp'
import { fileURLToPath } from 'url'

import { Categories } from './collections/Categories.js'
import { Invitations } from './collections/Invitations.js'
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
import { emailFrom, emailFromName, emailConfigured, smtpSettings } from './lib/email.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const cloudinaryEnabled = isCloudinaryConfigured()
const smtp = smtpSettings()
const emailEnabled = emailConfigured()

/* Public origin: the local domain in development, the real domain in
   production. It drives invitation links, CSRF, CORS and absolute metadata. */
const serverURL = (process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000').replace(
  /\/+$/,
  ''
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
      afterNavLinks: ['/components/admin/UserManagementLink#UserManagementLink'],
      views: {
        'user-management': {
          Component: '/components/admin/views/UserManagement#UserManagement',
          path: '/user-management',
        },
      },
    },
  },

  collections: [
    Users,
    Invitations,
    Media,
    Pages,
    Posts,
    Categories,
    Projects,
    Testimonials,
    Redirects,
  ],

  globals: [HomePage],

  editor: lexicalEditor(),

  secret: process.env.PAYLOAD_SECRET || '',

  /* Cookie-authenticated requests must come from the site itself. Payload
     validates the Origin header against this list (CSRF protection). */
  cors: [serverURL],
  csrf: [serverURL],
  serverURL,

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

  /* Invitations and password resets are sent through Brevo SMTP when
     configured. Without it Payload falls back to its console logger and the
     admin still copies invitation links manually. */
  ...(emailEnabled
    ? {
        email: nodemailerAdapter({
          defaultFromAddress: emailFrom(),
          defaultFromName: emailFromName(),
          transportOptions: {
            host: smtp.host,
            port: smtp.port,
            secure: smtp.secure,
            auth: smtp.auth,
          },
        }),
      }
    : {}),
})
