import pg from 'pg'
const conn = process.env.DATABASE_URL
const clean = conn.replace(/[?&]sslmode=[^&]+/g, '')
const c = new pg.Client({ connectionString: clean, ssl: { rejectUnauthorized: false } })
await c.connect()

await c.query(`
  CREATE TABLE IF NOT EXISTS "media_folders" (
    "id"          serial PRIMARY KEY,
    "path"        varchar NOT NULL,
    "updated_at"  timestamp(3) with time zone DEFAULT now() NOT NULL,
    "created_at"  timestamp(3) with time zone DEFAULT now() NOT NULL
  )
`)
await c.query(`
  CREATE UNIQUE INDEX IF NOT EXISTS "media_folders_path_idx" ON "media_folders" ("path")
`)
await c.query(`
  CREATE INDEX IF NOT EXISTS "media_folders_updated_at_idx" ON "media_folders" ("updated_at")
`)
await c.query(`
  CREATE INDEX IF NOT EXISTS "media_folders_created_at_idx" ON "media_folders" ("created_at")
`)

const r = await c.query(`
  SELECT column_name, data_type, is_nullable
  FROM information_schema.columns
  WHERE table_schema='public' AND table_name='media_folders'
  ORDER BY ordinal_position
`)
console.log('media_folders columns:')
console.table(r.rows)
await c.end()
