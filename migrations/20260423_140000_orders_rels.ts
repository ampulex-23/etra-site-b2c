import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Creates the `orders_rels` table expected by Payload's Drizzle Postgres adapter.
 *
 * Needed because Orders collection has:
 *   - items[].product (relationship inside an array) -> products_id
 *   - mergedFrom (hasMany: true, relationTo: orders)   -> orders_id
 *
 * Without this table, any query against the orders collection (list/detail
 * pages in admin) fails with: relation "orders_rels" does not exist.
 *
 * Schema modelled after existing *_rels tables (e.g. customers_rels).
 * Idempotent: uses IF NOT EXISTS everywhere.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "orders_rels" (
      "id"          serial PRIMARY KEY,
      "order"       integer,
      "parent_id"   integer NOT NULL,
      "path"        varchar NOT NULL,
      "products_id" integer,
      "orders_id"   integer
    );
  `)

  // Foreign keys (guarded for re-runs)
  await db.execute(sql`
    DO $$ BEGIN
      ALTER TABLE "orders_rels"
        ADD CONSTRAINT "orders_rels_parent_fk"
        FOREIGN KEY ("parent_id") REFERENCES "orders"("id") ON DELETE CASCADE;
    EXCEPTION WHEN duplicate_object THEN NULL; END $$;
  `)
  await db.execute(sql`
    DO $$ BEGIN
      ALTER TABLE "orders_rels"
        ADD CONSTRAINT "orders_rels_products_fk"
        FOREIGN KEY ("products_id") REFERENCES "products"("id") ON DELETE CASCADE;
    EXCEPTION WHEN duplicate_object THEN NULL; END $$;
  `)
  await db.execute(sql`
    DO $$ BEGIN
      ALTER TABLE "orders_rels"
        ADD CONSTRAINT "orders_rels_orders_fk"
        FOREIGN KEY ("orders_id") REFERENCES "orders"("id") ON DELETE CASCADE;
    EXCEPTION WHEN duplicate_object THEN NULL; END $$;
  `)

  await db.execute(sql`CREATE INDEX IF NOT EXISTS "orders_rels_order_idx"       ON "orders_rels" ("order")`)
  await db.execute(sql`CREATE INDEX IF NOT EXISTS "orders_rels_parent_idx"      ON "orders_rels" ("parent_id")`)
  await db.execute(sql`CREATE INDEX IF NOT EXISTS "orders_rels_path_idx"        ON "orders_rels" ("path")`)
  await db.execute(sql`CREATE INDEX IF NOT EXISTS "orders_rels_products_id_idx" ON "orders_rels" ("products_id")`)
  await db.execute(sql`CREATE INDEX IF NOT EXISTS "orders_rels_orders_id_idx"   ON "orders_rels" ("orders_id")`)

  // Denormalized stats columns on customers (added by Customers admin revamp)
  await db.execute(sql`
    ALTER TABLE "customers"
      ADD COLUMN IF NOT EXISTS "order_count"     numeric DEFAULT 0,
      ADD COLUMN IF NOT EXISTS "order_total_sum" numeric DEFAULT 0;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "customers"
      DROP COLUMN IF EXISTS "order_count",
      DROP COLUMN IF EXISTS "order_total_sum";
  `)
  await db.execute(sql`DROP TABLE IF EXISTS "orders_rels"`)
}
