import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Adds columns required by the support-chat feature (commit 5e0ef0f + 8eb3add):
 *   chat_rooms: customer_id, assignee_id, status, closed_at,
 *               last_message_text, last_message_at, last_message_sender_type,
 *               unread_by_staff, unread_by_customer
 *   messages:   read_at
 *
 * Idempotent: uses IF NOT EXISTS where possible so re-runs are safe.
 */
export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    DO $$ BEGIN
      CREATE TYPE enum_chat_rooms_status AS ENUM ('open', 'closed');
    EXCEPTION WHEN duplicate_object THEN NULL; END $$;
  `)

  await db.execute(sql`
    ALTER TABLE "chat_rooms"
      ADD COLUMN IF NOT EXISTS "customer_id"               integer,
      ADD COLUMN IF NOT EXISTS "assignee_id"               integer,
      ADD COLUMN IF NOT EXISTS "status"                    enum_chat_rooms_status DEFAULT 'open',
      ADD COLUMN IF NOT EXISTS "closed_at"                 timestamp with time zone,
      ADD COLUMN IF NOT EXISTS "last_message_text"         varchar,
      ADD COLUMN IF NOT EXISTS "last_message_at"           timestamp with time zone,
      ADD COLUMN IF NOT EXISTS "last_message_sender_type"  varchar,
      ADD COLUMN IF NOT EXISTS "unread_by_staff"           numeric DEFAULT 0,
      ADD COLUMN IF NOT EXISTS "unread_by_customer"        numeric DEFAULT 0;
  `)

  await db.execute(sql`
    ALTER TABLE "messages"
      ADD COLUMN IF NOT EXISTS "read_at" timestamp with time zone;
  `)

  // Foreign keys (guarded so re-runs don't fail)
  await db.execute(sql`
    DO $$ BEGIN
      ALTER TABLE "chat_rooms"
        ADD CONSTRAINT "chat_rooms_customer_id_customers_id_fk"
        FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE SET NULL;
    EXCEPTION WHEN duplicate_object THEN NULL; END $$;
  `)
  await db.execute(sql`
    DO $$ BEGIN
      ALTER TABLE "chat_rooms"
        ADD CONSTRAINT "chat_rooms_assignee_id_users_id_fk"
        FOREIGN KEY ("assignee_id") REFERENCES "users"("id") ON DELETE SET NULL;
    EXCEPTION WHEN duplicate_object THEN NULL; END $$;
  `)

  // Indexes used by access/queries/inbox sorting
  await db.execute(sql`CREATE INDEX IF NOT EXISTS "chat_rooms_customer_id_idx"      ON "chat_rooms" ("customer_id")`)
  await db.execute(sql`CREATE INDEX IF NOT EXISTS "chat_rooms_status_idx"           ON "chat_rooms" ("status")`)
  await db.execute(sql`CREATE INDEX IF NOT EXISTS "chat_rooms_last_message_at_idx"  ON "chat_rooms" ("last_message_at")`)
  await db.execute(sql`CREATE INDEX IF NOT EXISTS "chat_rooms_unread_by_staff_idx"  ON "chat_rooms" ("unread_by_staff")`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`DROP INDEX IF EXISTS "chat_rooms_customer_id_idx"`)
  await db.execute(sql`DROP INDEX IF EXISTS "chat_rooms_status_idx"`)
  await db.execute(sql`DROP INDEX IF EXISTS "chat_rooms_last_message_at_idx"`)
  await db.execute(sql`DROP INDEX IF EXISTS "chat_rooms_unread_by_staff_idx"`)

  await db.execute(sql`ALTER TABLE "chat_rooms" DROP CONSTRAINT IF EXISTS "chat_rooms_customer_id_customers_id_fk"`)
  await db.execute(sql`ALTER TABLE "chat_rooms" DROP CONSTRAINT IF EXISTS "chat_rooms_assignee_id_users_id_fk"`)

  await db.execute(sql`
    ALTER TABLE "chat_rooms"
      DROP COLUMN IF EXISTS "customer_id",
      DROP COLUMN IF EXISTS "assignee_id",
      DROP COLUMN IF EXISTS "status",
      DROP COLUMN IF EXISTS "closed_at",
      DROP COLUMN IF EXISTS "last_message_text",
      DROP COLUMN IF EXISTS "last_message_at",
      DROP COLUMN IF EXISTS "last_message_sender_type",
      DROP COLUMN IF EXISTS "unread_by_staff",
      DROP COLUMN IF EXISTS "unread_by_customer";
  `)
  await db.execute(sql`ALTER TABLE "messages" DROP COLUMN IF EXISTS "read_at"`)
  await db.execute(sql`DROP TYPE IF EXISTS enum_chat_rooms_status`)
}
