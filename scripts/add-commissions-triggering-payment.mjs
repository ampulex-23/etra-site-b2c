import pg from 'pg'
const { Client } = pg

const conn = process.env.DATABASE_URL
if (!conn) throw new Error('DATABASE_URL missing')
const cleanConn = conn.replace(/[?&]sslmode=[^&]+/g, '')
const c = new Client({ connectionString: cleanConn, ssl: { rejectUnauthorized: false } })
await c.connect()

const log = (...a) => console.log('[commissions.triggering_payment_id]', ...a)

try {
  await c.query('BEGIN')

  await c.query(`
    ALTER TABLE "commissions"
      ADD COLUMN IF NOT EXISTS "triggering_payment_id" integer;
  `)
  log('column ensured')

  await c.query(`
    DO $$ BEGIN
      ALTER TABLE "commissions"
        ADD CONSTRAINT "commissions_triggering_payment_id_fk"
        FOREIGN KEY ("triggering_payment_id") REFERENCES "payments"("id") ON DELETE SET NULL;
    EXCEPTION WHEN duplicate_object THEN NULL; END $$;
  `)
  log('FK ensured')

  await c.query(`
    CREATE INDEX IF NOT EXISTS "commissions_triggering_payment_id_idx"
      ON "commissions" ("triggering_payment_id");
  `)
  log('index ensured')

  // Verify
  const { rows } = await c.query(`
    SELECT column_name, data_type
    FROM information_schema.columns
    WHERE table_name = 'commissions' AND column_name = 'triggering_payment_id'
  `)
  log('verify:', rows)

  await c.query('COMMIT')
  log('done.')
} catch (e) {
  await c.query('ROLLBACK')
  console.error('FAILED:', e)
  process.exitCode = 1
} finally {
  await c.end()
}
