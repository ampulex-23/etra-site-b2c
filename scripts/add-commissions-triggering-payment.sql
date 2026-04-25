-- Migration: add commissions.triggering_payment_id (idempotent)
-- Run: psql "$DATABASE_URL" -f scripts/add-commissions-triggering-payment.sql

BEGIN;

ALTER TABLE "commissions"
  ADD COLUMN IF NOT EXISTS "triggering_payment_id" integer;

DO $$ BEGIN
  ALTER TABLE "commissions"
    ADD CONSTRAINT "commissions_triggering_payment_id_fk"
    FOREIGN KEY ("triggering_payment_id") REFERENCES "payments"("id") ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE INDEX IF NOT EXISTS "commissions_triggering_payment_id_idx"
  ON "commissions" ("triggering_payment_id");

-- Verification
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'commissions' AND column_name = 'triggering_payment_id';

COMMIT;
