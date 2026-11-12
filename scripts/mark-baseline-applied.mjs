/**
 * Marks the baseline migration as already applied.
 *
 * The existing database was created with `payload` dev push, so there is no
 * migration history. The baseline migration describes the full schema; this
 * script records it as applied instead of re-creating the tables.
 *
 *   node --env-file=.env scripts/mark-baseline-applied.mjs <migration-name>
 */
import { Client } from 'pg'

const name = process.argv[2]
if (!name) {
  console.error('Usage: node scripts/mark-baseline-applied.mjs <migration-name>')
  process.exit(1)
}

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
})
await client.connect()

const existing = await client.query('select id from payload_migrations where name = $1', [name])
if (existing.rowCount === 0) {
  await client.query('insert into payload_migrations (name, batch) values ($1, 1)', [name])
  console.log(`marked ${name} as applied`)
} else {
  console.log(`${name} is already recorded`)
}

await client.end()
