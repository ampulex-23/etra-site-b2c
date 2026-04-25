import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Adds the `triggering_payment_id` column to `commissions` — missing on prod
 * because push:true did not apply the schema change (this happens when a
 * previous deploy failed before sync). Without it, the admin list view
 * crashes with `column "triggering_payment_id" does not exist`.
 *
 * Mirrors the relationship `triggeringPayment -> payments` on the
 * Commissions collection.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "commissions"
      ADD COLUMN IF NOT EXISTS "triggering_payment_id" integer;
  `)

  await db.execute(sql`
    DO $$ BEGIN
      ALTER TABLE "commissions"
        ADD CONSTRAINT "commissions_triggering_payment_id_fk"
        FOREIGN KEY ("triggering_payment_id") REFERENCES "payments"("id") ON DELETE SET NULL;
    EXCEPTION WHEN duplicate_object THEN NULL; END $$;
  `)

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS "commissions_triggering_payment_id_idx"
      ON "commissions" ("triggering_payment_id");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "commissions"
      DROP COLUMN IF EXISTS "triggering_payment_id";
  `)
}
