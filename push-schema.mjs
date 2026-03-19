/**
 * DB schema migration script.
 * Runs before the Next.js server starts to add missing columns/enums.
 * Uses pg directly — no Payload or tsx needed.
 */
import pg from 'pg'
const { Pool } = pg

const url = process.env.DATABASE_URL
if (!url) {
  console.log('[migrate] No DATABASE_URL, skipping')
  process.exit(0)
}

const ssl = { rejectUnauthorized: false }
const pool = new Pool({ connectionString: url, ssl })

async function getColumns(table) {
  const r = await pool.query(
    'SELECT column_name FROM information_schema.columns WHERE table_name = $1',
    [table],
  )
  return r.rows.map((row) => row.column_name)
}

async function tableExists(table) {
  const r = await pool.query(
    "SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = $1",
    [table],
  )
  return r.rows.length > 0
}

async function enumExists(name) {
  const r = await pool.query('SELECT 1 FROM pg_type WHERE typname = $1', [name])
  return r.rows.length > 0
}

async function addColumnsIfMissing(table, columns) {
  const existing = await getColumns(table)
  const toAdd = columns.filter((c) => !existing.includes(c.name))
  if (toAdd.length === 0) {
    console.log(`[migrate] ${table}: OK`)
    return
  }
  const alterParts = toAdd.map((c) => `ADD COLUMN "${c.name}" ${c.definition}`)
  await pool.query(`ALTER TABLE "${table}" ${alterParts.join(', ')}`)
  console.log(`[migrate] ${table}: added ${toAdd.map((c) => c.name).join(', ')}`)
}

try {
  console.log('[migrate] Starting DB schema sync...')

  // ---- ENUM TYPES ----
  if (!(await enumExists('enum_users_role'))) {
    await pool.query("CREATE TYPE enum_users_role AS ENUM ('admin', 'manager', 'warehouse', 'content')")
    console.log('[migrate] Created enum_users_role')
  }
  if (!(await enumExists('enum_customers_role'))) {
    await pool.query("CREATE TYPE enum_customers_role AS ENUM ('customer', 'vip', 'blocked')")
    console.log('[migrate] Created enum_customers_role')
  }
  if (!(await enumExists('enum_customers_source'))) {
    await pool.query("CREATE TYPE enum_customers_source AS ENUM ('site', 'telegram_bot', 'import', 'amocrm')")
    console.log('[migrate] Created enum_customers_source')
  }
  if (!(await enumExists('enum_orders_source'))) {
    await pool.query("CREATE TYPE enum_orders_source AS ENUM ('site', 'telegram_bot', 'import')")
    console.log('[migrate] Created enum_orders_source')
  }

  // ---- USERS ----
  if (await tableExists('users')) {
    await addColumnsIfMissing('users', [
      { name: 'name', definition: 'varchar' },
      { name: 'role', definition: "enum_users_role DEFAULT 'admin'" },
      { name: 'active', definition: 'boolean DEFAULT true' },
      { name: 'phone', definition: 'varchar' },
      { name: 'position', definition: 'varchar' },
      { name: 'invite_token', definition: 'varchar' },
      { name: 'invite_expires', definition: 'timestamp(3) with time zone' },
    ])
  }

  // ---- CUSTOMERS ----
  if (await tableExists('customers')) {
    const cols = await getColumns('customers')

    // Rename telegram_id -> telegram_chat_id if old column exists
    if (cols.includes('telegram_id') && !cols.includes('telegram_chat_id')) {
      await pool.query('ALTER TABLE customers RENAME COLUMN telegram_id TO telegram_chat_id')
      console.log('[migrate] customers: renamed telegram_id -> telegram_chat_id')
    }

    await addColumnsIfMissing('customers', [
      { name: 'telegram_chat_id', definition: 'varchar' },
      { name: 'telegram_username', definition: 'varchar' },
      { name: 'telegram_first_name', definition: 'varchar' },
      { name: 'telegram_last_name', definition: 'varchar' },
      { name: 'telegram_phone', definition: 'varchar' },
      { name: 'telegram_photo_url', definition: 'varchar' },
      { name: 'role', definition: "enum_customers_role DEFAULT 'customer'" },
      { name: 'amo_crm_contact_id', definition: 'numeric' },
      { name: 'bonus_balance', definition: 'numeric DEFAULT 0' },
      { name: 'source', definition: "enum_customers_source DEFAULT 'site'" },
      { name: 'puzzle_bot_id', definition: 'varchar' },
      { name: 'imported_at', definition: 'timestamp(3) with time zone' },
      { name: 'email_verified', definition: 'boolean DEFAULT false' },
      { name: 'avatar_id', definition: 'integer' },
    ])
  }

  // ---- ORDERS ----
  if (await tableExists('orders')) {
    await addColumnsIfMissing('orders', [
      { name: 'source', definition: "enum_orders_source DEFAULT 'site'" },
      { name: 'puzzle_bot_order_id', definition: 'varchar' },
      { name: 'imported_at', definition: 'timestamp(3) with time zone' },
      { name: 'amo_crm_deal_id', definition: 'numeric' },
      { name: 'linked_delivery_id', definition: 'integer' },
      { name: 'linked_payment_id', definition: 'integer' },
    ])
  }

  // ---- PRODUCTS: ensure bundle columns ----
  if (await tableExists('products')) {
    await addColumnsIfMissing('products', [
      { name: 'is_bundle', definition: 'boolean DEFAULT false' },
    ])
  }

  // ---- PRODUCTS_BUNDLE_ITEMS (Payload array table for bundleItems) ----
  if (!(await tableExists('products_bundle_items'))) {
    await pool.query(`
      CREATE TABLE "products_bundle_items" (
        "_order" integer NOT NULL,
        "_parent_id" integer NOT NULL,
        "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
        "product_id" integer,
        "quantity" numeric DEFAULT 1
      )
    `)
    await pool.query(`
      DO $$ BEGIN
        ALTER TABLE "products_bundle_items"
          ADD CONSTRAINT "products_bundle_items_parent_id_fk"
          FOREIGN KEY ("_parent_id") REFERENCES "products"("id") ON DELETE CASCADE;
      EXCEPTION WHEN duplicate_object THEN null;
      END $$
    `)
    await pool.query(`
      CREATE INDEX IF NOT EXISTS "products_bundle_items_order_idx" ON "products_bundle_items" ("_order")
    `)
    await pool.query(`
      CREATE INDEX IF NOT EXISTS "products_bundle_items_parent_id_idx" ON "products_bundle_items" ("_parent_id")
    `)
    console.log('[migrate] Created products_bundle_items table')
  }

  // ---- STOCK_MOVEMENTS: remove old product/quantity columns if items table exists ----
  if (await tableExists('stock_movements')) {
    // Drop old single-product columns if they exist (replaced by items array)
    const smCols = await getColumns('stock_movements')
    if (smCols.includes('product_id') && !(await tableExists('stock_movements_items'))) {
      // Migrate existing data: create items sub-table first, then move data
      await pool.query(`
        CREATE TABLE "stock_movements_items" (
          "_order" integer NOT NULL,
          "_parent_id" integer NOT NULL,
          "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
          "product_id" integer,
          "quantity" numeric DEFAULT 1
        )
      `)
      await pool.query(`
        DO $$ BEGIN
          ALTER TABLE "stock_movements_items"
            ADD CONSTRAINT "stock_movements_items_parent_id_fk"
            FOREIGN KEY ("_parent_id") REFERENCES "stock_movements"("id") ON DELETE CASCADE;
        EXCEPTION WHEN duplicate_object THEN null;
        END $$
      `)
      await pool.query('CREATE INDEX IF NOT EXISTS "stock_movements_items_order_idx" ON "stock_movements_items" ("_order")')
      await pool.query('CREATE INDEX IF NOT EXISTS "stock_movements_items_parent_id_idx" ON "stock_movements_items" ("_parent_id")')
      // Migrate existing rows: copy product_id+quantity into items sub-table
      await pool.query(`
        INSERT INTO "stock_movements_items" ("_order", "_parent_id", "product_id", "quantity")
        SELECT 1, "id", "product_id", "quantity"
        FROM "stock_movements"
        WHERE "product_id" IS NOT NULL
      `)
      // Drop old columns
      await pool.query('ALTER TABLE "stock_movements" DROP COLUMN IF EXISTS "product_id"')
      await pool.query('ALTER TABLE "stock_movements" DROP COLUMN IF EXISTS "quantity"')
      console.log('[migrate] Migrated stock_movements: product+quantity -> items array')
    }
  }

  // ---- STOCK_MOVEMENTS_ITEMS sub-table (if not yet created) ----
  if (!(await tableExists('stock_movements_items'))) {
    await pool.query(`
      CREATE TABLE "stock_movements_items" (
        "_order" integer NOT NULL,
        "_parent_id" integer NOT NULL,
        "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
        "product_id" integer,
        "quantity" numeric DEFAULT 1
      )
    `)
    await pool.query(`
      DO $$ BEGIN
        ALTER TABLE "stock_movements_items"
          ADD CONSTRAINT "stock_movements_items_parent_id_fk"
          FOREIGN KEY ("_parent_id") REFERENCES "stock_movements"("id") ON DELETE CASCADE;
      EXCEPTION WHEN duplicate_object THEN null;
      END $$
    `)
    await pool.query('CREATE INDEX IF NOT EXISTS "stock_movements_items_order_idx" ON "stock_movements_items" ("_order")')
    await pool.query('CREATE INDEX IF NOT EXISTS "stock_movements_items_parent_id_idx" ON "stock_movements_items" ("_parent_id")')
    console.log('[migrate] Created stock_movements_items table')
  }

  // ---- APPEARANCE_SETTINGS (Payload internal global) ----
  if (!(await tableExists('appearance_settings'))) {
    await pool.query(`
      CREATE TABLE "appearance_settings" (
        "id" serial PRIMARY KEY,
        "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
        "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
      )
    `)
    await pool.query('INSERT INTO "appearance_settings" ("id") VALUES (1)')
    console.log('[migrate] Created appearance_settings table')
  }

  // ---- DELIVERY_SETTINGS global ----
  if (!(await tableExists('delivery_settings'))) {
    await pool.query(`
      CREATE TABLE "delivery_settings" (
        "id" serial PRIMARY KEY,
        "delivery_pickup_enabled" boolean DEFAULT true,
        "delivery_pickup_address" varchar,
        "cdek_enabled" boolean DEFAULT false,
        "cdek_account" varchar,
        "cdek_secure_password" varchar,
        "cdek_test_mode" boolean DEFAULT true,
        "cdek_sender_city" varchar DEFAULT '44',
        "cdek_tariff_code" numeric DEFAULT 139,
        "cdek_sender_name" varchar DEFAULT 'ЭТРА',
        "cdek_sender_phone" varchar,
        "cdek_sender_address" varchar,
        "cdek_default_weight" numeric DEFAULT 500,
        "cdek_webhook_url" varchar,
        "russian_post_enabled" boolean DEFAULT false,
        "russian_post_token" varchar,
        "russian_post_login" varchar,
        "russian_post_password" varchar,
        "russian_post_sender_index" varchar,
        "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
        "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
      )
    `)
    await pool.query('INSERT INTO "delivery_settings" ("id") VALUES (1)')
    console.log('[migrate] Created delivery_settings table')
  } else {
    await addColumnsIfMissing('delivery_settings', [
      { name: 'delivery_pickup_enabled', definition: 'boolean DEFAULT true' },
      { name: 'delivery_pickup_address', definition: 'varchar' },
      { name: 'cdek_enabled', definition: 'boolean DEFAULT false' },
      { name: 'cdek_account', definition: 'varchar' },
      { name: 'cdek_secure_password', definition: 'varchar' },
      { name: 'cdek_test_mode', definition: 'boolean DEFAULT true' },
      { name: 'cdek_sender_city', definition: "varchar DEFAULT '44'" },
      { name: 'cdek_tariff_code', definition: 'numeric DEFAULT 139' },
      { name: 'cdek_sender_name', definition: "varchar DEFAULT 'ЭТРА'" },
      { name: 'cdek_sender_phone', definition: 'varchar' },
      { name: 'cdek_sender_address', definition: 'varchar' },
      { name: 'cdek_default_weight', definition: 'numeric DEFAULT 500' },
      { name: 'cdek_webhook_url', definition: 'varchar' },
      { name: 'russian_post_enabled', definition: 'boolean DEFAULT false' },
      { name: 'russian_post_token', definition: 'varchar' },
      { name: 'russian_post_login', definition: 'varchar' },
      { name: 'russian_post_password', definition: 'varchar' },
      { name: 'russian_post_sender_index', definition: 'varchar' },
    ])
  }

  // ---- delivery_settings_pickup_points (array sub-table) ----
  if (!(await tableExists('delivery_settings_pickup_points'))) {
    await pool.query(`
      CREATE TABLE "delivery_settings_pickup_points" (
        "_order" integer NOT NULL,
        "_parent_id" integer NOT NULL,
        "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
        "name" varchar,
        "address" varchar,
        "city" varchar,
        "phone" varchar,
        "working_hours" varchar,
        "lat" numeric,
        "lng" numeric,
        "active" boolean DEFAULT true
      )
    `)
    await pool.query(`
      DO $$ BEGIN
        ALTER TABLE "delivery_settings_pickup_points"
          ADD CONSTRAINT "delivery_settings_pickup_points_parent_id_fk"
          FOREIGN KEY ("_parent_id") REFERENCES "delivery_settings"("id") ON DELETE CASCADE;
      EXCEPTION WHEN duplicate_object THEN null;
      END $$
    `)
    await pool.query('CREATE INDEX IF NOT EXISTS "delivery_settings_pickup_points_order_idx" ON "delivery_settings_pickup_points" ("_order")')
    await pool.query('CREATE INDEX IF NOT EXISTS "delivery_settings_pickup_points_parent_id_idx" ON "delivery_settings_pickup_points" ("_parent_id")')
    console.log('[migrate] Created delivery_settings_pickup_points table')
  }

  // ---- AI_SETTINGS global ----
  if (!(await tableExists('ai_settings'))) {
    await pool.query(`
      CREATE TABLE "ai_settings" (
        "id" serial PRIMARY KEY,
        "ai_api_url" varchar DEFAULT 'https://api.polza.ai/v1/chat/completions',
        "ai_api_key" varchar,
        "ai_text_model" varchar DEFAULT 'openai/gpt-4.1-mini',
        "ai_image_model" varchar DEFAULT 'google/gemini-3-pro-image-preview',
        "ai_temperature" numeric DEFAULT 0.7,
        "ai_max_tokens" numeric DEFAULT 2000,
        "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
        "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
      )
    `)
    await pool.query('INSERT INTO "ai_settings" ("id") VALUES (1)')
    console.log('[migrate] Created ai_settings table')
  } else {
    await addColumnsIfMissing('ai_settings', [
      { name: 'ai_api_url', definition: "varchar DEFAULT 'https://api.polza.ai/v1/chat/completions'" },
      { name: 'ai_api_key', definition: 'varchar' },
      { name: 'ai_text_model', definition: "varchar DEFAULT 'openai/gpt-4.1-mini'" },
      { name: 'ai_image_model', definition: "varchar DEFAULT 'google/gemini-3-pro-image-preview'" },
      { name: 'ai_temperature', definition: 'numeric DEFAULT 0.7' },
      { name: 'ai_max_tokens', definition: 'numeric DEFAULT 2000' },
    ])
  }

  // ---- SHOP_SETTINGS global ----
  if (!(await tableExists('shop_settings'))) {
    await pool.query(`
      CREATE TABLE "shop_settings" (
        "id" serial PRIMARY KEY,
        "telegram_bot_token" varchar,
        "telegram_bot_username" varchar,
        "payment_enabled" boolean DEFAULT false,
        "payment_provider" varchar,
        "payment_api_key" varchar,
        "payment_shop_id" varchar,
        "min_order_amount" numeric DEFAULT 0,
        "free_delivery_threshold" numeric DEFAULT 0,
        "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
        "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
      )
    `)
    await pool.query('INSERT INTO "shop_settings" ("id") VALUES (1)')
    console.log('[migrate] Created shop_settings table')
  } else {
    await addColumnsIfMissing('shop_settings', [
      { name: 'telegram_bot_token', definition: 'varchar' },
      { name: 'telegram_bot_username', definition: 'varchar' },
      { name: 'payment_enabled', definition: 'boolean DEFAULT false' },
      { name: 'payment_provider', definition: 'varchar' },
      { name: 'payment_api_key', definition: 'varchar' },
      { name: 'payment_shop_id', definition: 'varchar' },
      { name: 'min_order_amount', definition: 'numeric DEFAULT 0' },
      { name: 'free_delivery_threshold', definition: 'numeric DEFAULT 0' },
    ])
  }

  // ---- LANDING_SETTINGS global ----
  if (!(await tableExists('landing_settings'))) {
    await pool.query(`
      CREATE TABLE "landing_settings" (
        "id" serial PRIMARY KEY,
        "hero_title" varchar,
        "hero_subtitle" varchar,
        "hero_cta" varchar,
        "hero_cta_link" varchar,
        "hero_secondary_cta_text" varchar,
        "hero_secondary_cta_link" varchar,
        "hero_bg_image_id" integer,
        "science_label" varchar,
        "science_title" varchar,
        "science_desc" varchar,
        "science_image_id" integer,
        "catalog_label" varchar,
        "catalog_title" varchar,
        "catalog_desc" varchar,
        "catalog_show_featured" boolean DEFAULT true,
        "catalog_max_items" numeric DEFAULT 6,
        "process_label" varchar,
        "process_title" varchar,
        "process_desc" varchar,
        "testimonials_label" varchar,
        "testimonials_title" varchar,
        "join_title" varchar,
        "join_desc" varchar,
        "join_button_text" varchar,
        "footer_desc" varchar,
        "footer_email" varchar,
        "footer_phone" varchar,
        "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
        "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
      )
    `)
    await pool.query('INSERT INTO "landing_settings" ("id") VALUES (1)')
    console.log('[migrate] Created landing_settings table')
  } else {
    await addColumnsIfMissing('landing_settings', [
      { name: 'hero_title', definition: 'varchar' },
      { name: 'hero_subtitle', definition: 'varchar' },
      { name: 'hero_cta', definition: 'varchar' },
      { name: 'hero_cta_link', definition: 'varchar' },
      { name: 'hero_secondary_cta_text', definition: 'varchar' },
      { name: 'hero_secondary_cta_link', definition: 'varchar' },
      { name: 'hero_bg_image_id', definition: 'integer' },
      { name: 'science_label', definition: 'varchar' },
      { name: 'science_title', definition: 'varchar' },
      { name: 'science_desc', definition: 'varchar' },
      { name: 'science_image_id', definition: 'integer' },
      { name: 'catalog_label', definition: 'varchar' },
      { name: 'catalog_title', definition: 'varchar' },
      { name: 'catalog_desc', definition: 'varchar' },
      { name: 'catalog_show_featured', definition: 'boolean DEFAULT true' },
      { name: 'catalog_max_items', definition: 'numeric DEFAULT 6' },
      { name: 'process_label', definition: 'varchar' },
      { name: 'process_title', definition: 'varchar' },
      { name: 'process_desc', definition: 'varchar' },
      { name: 'testimonials_label', definition: 'varchar' },
      { name: 'testimonials_title', definition: 'varchar' },
      { name: 'join_title', definition: 'varchar' },
      { name: 'join_desc', definition: 'varchar' },
      { name: 'join_button_text', definition: 'varchar' },
      { name: 'footer_desc', definition: 'varchar' },
      { name: 'footer_email', definition: 'varchar' },
      { name: 'footer_phone', definition: 'varchar' },
    ])
  }

  // ---- landing_settings array sub-tables ----
  const landingArrayTables = [
    {
      name: 'landing_settings_stats',
      columns: '"number" varchar, "label" varchar',
    },
    {
      name: 'landing_settings_science_features',
      columns: '"icon" varchar, "title" varchar, "description" varchar',
    },
    {
      name: 'landing_settings_process_steps',
      columns: '"title" varchar, "description" varchar',
    },
    {
      name: 'landing_settings_testimonials',
      columns: '"text" varchar, "name" varchar, "role" varchar, "avatar_id" integer, "rating" numeric DEFAULT 5',
    },
    {
      name: 'landing_settings_social_links',
      columns: '"platform" varchar, "url" varchar',
    },
  ]
  for (const t of landingArrayTables) {
    if (!(await tableExists(t.name))) {
      await pool.query(`
        CREATE TABLE "${t.name}" (
          "_order" integer NOT NULL,
          "_parent_id" integer NOT NULL,
          "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
          ${t.columns}
        )
      `)
      await pool.query(`
        DO $$ BEGIN
          ALTER TABLE "${t.name}"
            ADD CONSTRAINT "${t.name}_parent_id_fk"
            FOREIGN KEY ("_parent_id") REFERENCES "landing_settings"("id") ON DELETE CASCADE;
        EXCEPTION WHEN duplicate_object THEN null;
        END $$
      `)
      await pool.query(`CREATE INDEX IF NOT EXISTS "${t.name}_order_idx" ON "${t.name}" ("_order")`)
      await pool.query(`CREATE INDEX IF NOT EXISTS "${t.name}_parent_id_idx" ON "${t.name}" ("_parent_id")`)
      console.log(`[migrate] Created ${t.name} table`)
    }
  }

  console.log('[migrate] Done')
} catch (err) {
  console.error('[migrate] Error:', err.message)
} finally {
  await pool.end()
}
