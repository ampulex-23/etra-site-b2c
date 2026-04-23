import pg from 'pg'
const { Client } = pg

const conn = process.env.DATABASE_URL
if (!conn) throw new Error('DATABASE_URL missing')
const cleanConn = conn.replace(/[?&]sslmode=[^&]+/g, '')
const c = new Client({ connectionString: cleanConn, ssl: { rejectUnauthorized: false } })
await c.connect()

const statements = [
  `CREATE TABLE IF NOT EXISTS "orders_rels" (
     "id"          serial PRIMARY KEY,
     "order"       integer,
     "parent_id"   integer NOT NULL,
     "path"        varchar NOT NULL,
     "products_id" integer,
     "orders_id"   integer
   )`,
  `DO $$ BEGIN
     ALTER TABLE "orders_rels"
       ADD CONSTRAINT "orders_rels_parent_fk"
       FOREIGN KEY ("parent_id") REFERENCES "orders"("id") ON DELETE CASCADE;
   EXCEPTION WHEN duplicate_object THEN NULL; END $$`,
  `DO $$ BEGIN
     ALTER TABLE "orders_rels"
       ADD CONSTRAINT "orders_rels_products_fk"
       FOREIGN KEY ("products_id") REFERENCES "products"("id") ON DELETE CASCADE;
   EXCEPTION WHEN duplicate_object THEN NULL; END $$`,
  `DO $$ BEGIN
     ALTER TABLE "orders_rels"
       ADD CONSTRAINT "orders_rels_orders_fk"
       FOREIGN KEY ("orders_id") REFERENCES "orders"("id") ON DELETE CASCADE;
   EXCEPTION WHEN duplicate_object THEN NULL; END $$`,
  `CREATE INDEX IF NOT EXISTS "orders_rels_order_idx"       ON "orders_rels" ("order")`,
  `CREATE INDEX IF NOT EXISTS "orders_rels_parent_idx"      ON "orders_rels" ("parent_id")`,
  `CREATE INDEX IF NOT EXISTS "orders_rels_path_idx"        ON "orders_rels" ("path")`,
  `CREATE INDEX IF NOT EXISTS "orders_rels_products_id_idx" ON "orders_rels" ("products_id")`,
  `CREATE INDEX IF NOT EXISTS "orders_rels_orders_id_idx"   ON "orders_rels" ("orders_id")`,
  `ALTER TABLE "customers"
     ADD COLUMN IF NOT EXISTS "order_count"     numeric DEFAULT 0,
     ADD COLUMN IF NOT EXISTS "order_total_sum" numeric DEFAULT 0`,
]

for (const s of statements) {
  console.log('>', s.split('\n')[0].trim().slice(0, 80))
  await c.query(s)
}

const check = await c.query(`
  SELECT column_name, data_type FROM information_schema.columns
  WHERE table_schema='public' AND table_name='orders_rels'
  ORDER BY ordinal_position
`)
console.log('\norders_rels columns:')
console.table(check.rows)

await c.end()
console.log('Done.')
