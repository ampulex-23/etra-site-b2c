import pg from 'pg'
const conn = process.env.DATABASE_URL
const clean = conn.replace(/[?&]sslmode=[^&]+/g, '')
const c = new pg.Client({ connectionString: clean, ssl: { rejectUnauthorized: false } })
await c.connect()

// shop_settings: top-up feature columns
await c.query(`
  ALTER TABLE "shop_settings"
    ADD COLUMN IF NOT EXISTS "top_up_enabled"     boolean DEFAULT true,
    ADD COLUMN IF NOT EXISTS "top_up_window_days" numeric DEFAULT 14
`)

// commissions: triggering_payment relationship for referral_repeat
await c.query(`
  ALTER TABLE "commissions"
    ADD COLUMN IF NOT EXISTS "triggering_payment_id" integer
`)
await c.query(`
  CREATE INDEX IF NOT EXISTS "commissions_triggering_payment_idx"
    ON "commissions" ("triggering_payment_id")
`)
await c.query(`
  DO $$ BEGIN
    ALTER TABLE "commissions"
      ADD CONSTRAINT "commissions_triggering_payment_fk"
      FOREIGN KEY ("triggering_payment_id") REFERENCES "payments"("id") ON DELETE SET NULL;
  EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; END $$;
`)

const r = await c.query(`
  SELECT table_name, column_name, data_type
  FROM information_schema.columns
  WHERE table_schema='public'
    AND ((table_name='shop_settings'  AND column_name IN ('top_up_enabled','top_up_window_days'))
      OR (table_name='commissions'    AND column_name='triggering_payment_id'))
  ORDER BY table_name, column_name
`)
console.log(r.rows)
await c.end()
