import pg from 'pg'
const conn = process.env.DATABASE_URL
const clean = conn.replace(/[?&]sslmode=[^&]+/g, '')
const c = new pg.Client({ connectionString: clean, ssl: { rejectUnauthorized: false } })
await c.connect()

await c.query(`
  ALTER TABLE "payload_locked_documents_rels"
    ADD COLUMN IF NOT EXISTS "media_folders_id" integer
`)
await c.query(`
  DO $$ BEGIN
    ALTER TABLE "payload_locked_documents_rels"
      ADD CONSTRAINT "payload_locked_documents_rels_media_folders_fk"
      FOREIGN KEY ("media_folders_id") REFERENCES "media_folders"("id") ON DELETE CASCADE;
  EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; END $$;
`)
await c.query(`
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_media_folders_id_idx"
    ON "payload_locked_documents_rels" ("media_folders_id")
`)

// payload_preferences_rels has the same shape
await c.query(`
  ALTER TABLE "payload_preferences_rels"
    ADD COLUMN IF NOT EXISTS "media_folders_id" integer
`)
await c.query(`
  CREATE INDEX IF NOT EXISTS "payload_preferences_rels_media_folders_id_idx"
    ON "payload_preferences_rels" ("media_folders_id")
`)

const r = await c.query(`
  SELECT table_name, column_name FROM information_schema.columns
  WHERE table_schema='public' AND column_name='media_folders_id'
  ORDER BY table_name
`)
console.log(r.rows)
await c.end()
