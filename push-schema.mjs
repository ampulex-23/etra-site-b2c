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
      { name: 'selected_cohort_id', definition: 'integer' },
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
        "payment_online_enabled" boolean DEFAULT true,
        "payment_cash_enabled" boolean DEFAULT false,
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
      { name: 'payment_online_enabled', definition: 'boolean DEFAULT true' },
      { name: 'payment_cash_enabled', definition: 'boolean DEFAULT false' },
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

  // ---- PAYLOAD_LOCKED_DOCUMENTS_RELS: add columns for ALL collections ----
  if (await tableExists('payload_locked_documents_rels')) {
    await addColumnsIfMissing('payload_locked_documents_rels', [
      { name: 'users_id', definition: 'integer' },
      { name: 'media_id', definition: 'integer' },
      { name: 'products_id', definition: 'integer' },
      { name: 'categories_id', definition: 'integer' },
      { name: 'orders_id', definition: 'integer' },
      { name: 'customers_id', definition: 'integer' },
      { name: 'posts_id', definition: 'integer' },
      { name: 'promo_codes_id', definition: 'integer' },
      { name: 'deliveries_id', definition: 'integer' },
      { name: 'payments_id', definition: 'integer' },
      { name: 'recipes_id', definition: 'integer' },
      { name: 'warehouses_id', definition: 'integer' },
      { name: 'stock_movements_id', definition: 'integer' },
      { name: 'stock_levels_id', definition: 'integer' },
      { name: 'inventories_id', definition: 'integer' },
      { name: 'reviews_id', definition: 'integer' },
      { name: 'comments_id', definition: 'integer' },
      { name: 'infoproducts_id', definition: 'integer' },
      { name: 'course_cohorts_id', definition: 'integer' },
      { name: 'course_modules_id', definition: 'integer' },
      { name: 'course_days_id', definition: 'integer' },
      { name: 'enrollments_id', definition: 'integer' },
      { name: 'participant_reports_id', definition: 'integer' },
      { name: 'course_results_id', definition: 'integer' },
      { name: 'chat_rooms_id', definition: 'integer' },
      { name: 'messages_id', definition: 'integer' },
    ])
  }

  // ---- PAYLOAD_PREFERENCES_RELS: add columns for ALL collections ----
  if (await tableExists('payload_preferences_rels')) {
    await addColumnsIfMissing('payload_preferences_rels', [
      { name: 'users_id', definition: 'integer' },
    ])
  }

  // ==========================================
  // INFOPRODUCTS COLLECTIONS
  // ==========================================

  // ---- ENUM TYPES for infoproducts ----
  if (!(await enumExists('enum_infoproducts_type'))) {
    await pool.query("CREATE TYPE enum_infoproducts_type AS ENUM ('course', 'marathon', 'program', 'retreat')")
    console.log('[migrate] Created enum_infoproducts_type')
  }
  if (!(await enumExists('enum_infoproducts_status'))) {
    await pool.query("CREATE TYPE enum_infoproducts_status AS ENUM ('draft', 'active', 'archived')")
    console.log('[migrate] Created enum_infoproducts_status')
  }
  if (!(await enumExists('enum_course_cohorts_status'))) {
    await pool.query("CREATE TYPE enum_course_cohorts_status AS ENUM ('upcoming', 'active', 'completed', 'cancelled')")
    console.log('[migrate] Created enum_course_cohorts_status')
  }
  if (!(await enumExists('enum_course_modules_type'))) {
    await pool.query("CREATE TYPE enum_course_modules_type AS ENUM ('navigation', 'schedule', 'communication', 'broadcasts', 'qa', 'reports', 'results', 'sport', 'recipes', 'protocols', 'products', 'motivation', 'custom')")
    console.log('[migrate] Created enum_course_modules_type')
  }
  if (!(await enumExists('enum_course_days_broadcast_type'))) {
    await pool.query("CREATE TYPE enum_course_days_broadcast_type AS ENUM ('thematic', 'qa', 'intro')")
    console.log('[migrate] Created enum_course_days_broadcast_type')
  }
  if (!(await enumExists('enum_enrollments_status'))) {
    await pool.query("CREATE TYPE enum_enrollments_status AS ENUM ('pending', 'active', 'paused', 'completed', 'expelled', 'refunded')")
    console.log('[migrate] Created enum_enrollments_status')
  }
  if (!(await enumExists('enum_participant_reports_status'))) {
    await pool.query("CREATE TYPE enum_participant_reports_status AS ENUM ('submitted', 'late', 'missed')")
    console.log('[migrate] Created enum_participant_reports_status')
  }
  if (!(await enumExists('enum_course_results_type'))) {
    await pool.query("CREATE TYPE enum_course_results_type AS ENUM ('intermediate', 'final')")
    console.log('[migrate] Created enum_course_results_type')
  }
  if (!(await enumExists('enum_course_results_status'))) {
    await pool.query("CREATE TYPE enum_course_results_status AS ENUM ('pending', 'published', 'featured')")
    console.log('[migrate] Created enum_course_results_status')
  }
  if (!(await enumExists('enum_course_results_effects_category'))) {
    await pool.query("CREATE TYPE enum_course_results_effects_category AS ENUM ('weight_loss', 'food_addiction', 'psycho_emotional', 'lightness', 'conscious_eating', 'sleep', 'skin', 'body_volumes', 'health_issues', 'physical_performance', 'neurographics', 'community')")
    console.log('[migrate] Created enum_course_results_effects_category')
  }

  // ---- INFOPRODUCTS ----
  if (!(await tableExists('infoproducts'))) {
    await pool.query(`
      CREATE TABLE "infoproducts" (
        "id" serial PRIMARY KEY,
        "title" varchar NOT NULL,
        "slug" varchar UNIQUE NOT NULL,
        "type" enum_infoproducts_type DEFAULT 'course',
        "status" enum_infoproducts_status DEFAULT 'draft',
        "short_description" varchar,
        "description" jsonb,
        "cover_image_id" integer,
        "price" numeric,
        "old_price" numeric,
        "duration_days" numeric,
        "product_bundle_id" integer,
        "schedule_morning" jsonb,
        "schedule_day" jsonb,
        "schedule_evening" jsonb,
        "diet_recommendations" jsonb,
        "contraindications" jsonb,
        "rules" jsonb,
        "report_rules_max_missed" numeric DEFAULT 3,
        "report_rules_penalty" jsonb,
        "seo_title" varchar,
        "seo_description" varchar,
        "seo_og_image_id" integer,
        "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
        "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
      )
    `)
    console.log('[migrate] Created infoproducts table')
  }

  // ---- infoproducts_report_template (array sub-table) ----
  if (!(await tableExists('infoproducts_report_template'))) {
    await pool.query(`
      CREATE TABLE "infoproducts_report_template" (
        "_order" integer NOT NULL,
        "_parent_id" integer NOT NULL,
        "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
        "item" varchar,
        "emoji" varchar DEFAULT '✅'
      )
    `)
    await pool.query(`
      DO $$ BEGIN
        ALTER TABLE "infoproducts_report_template"
          ADD CONSTRAINT "infoproducts_report_template_parent_id_fk"
          FOREIGN KEY ("_parent_id") REFERENCES "infoproducts"("id") ON DELETE CASCADE;
      EXCEPTION WHEN duplicate_object THEN null;
      END $$
    `)
    await pool.query('CREATE INDEX IF NOT EXISTS "infoproducts_report_template_order_idx" ON "infoproducts_report_template" ("_order")')
    await pool.query('CREATE INDEX IF NOT EXISTS "infoproducts_report_template_parent_id_idx" ON "infoproducts_report_template" ("_parent_id")')
    console.log('[migrate] Created infoproducts_report_template table')
  }

  // ---- infoproducts_team (array sub-table) ----
  if (!(await tableExists('infoproducts_team'))) {
    await pool.query(`
      CREATE TABLE "infoproducts_team" (
        "_order" integer NOT NULL,
        "_parent_id" integer NOT NULL,
        "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
        "name" varchar,
        "role" varchar,
        "avatar_id" integer
      )
    `)
    await pool.query(`
      DO $$ BEGIN
        ALTER TABLE "infoproducts_team"
          ADD CONSTRAINT "infoproducts_team_parent_id_fk"
          FOREIGN KEY ("_parent_id") REFERENCES "infoproducts"("id") ON DELETE CASCADE;
      EXCEPTION WHEN duplicate_object THEN null;
      END $$
    `)
    await pool.query('CREATE INDEX IF NOT EXISTS "infoproducts_team_order_idx" ON "infoproducts_team" ("_order")')
    await pool.query('CREATE INDEX IF NOT EXISTS "infoproducts_team_parent_id_idx" ON "infoproducts_team" ("_parent_id")')
    console.log('[migrate] Created infoproducts_team table')
  }

  // ---- COURSE_COHORTS ----
  if (!(await tableExists('course_cohorts'))) {
    await pool.query(`
      CREATE TABLE "course_cohorts" (
        "id" serial PRIMARY KEY,
        "infoproduct_id" integer,
        "title" varchar NOT NULL,
        "status" enum_course_cohorts_status DEFAULT 'upcoming',
        "start_date" timestamp(3) with time zone NOT NULL,
        "end_date" timestamp(3) with time zone,
        "max_participants" numeric DEFAULT 0,
        "telegram_group_id" varchar,
        "invite_link" varchar,
        "notes" varchar,
        "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
        "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
      )
    `)
    await pool.query('CREATE INDEX IF NOT EXISTS "course_cohorts_infoproduct_idx" ON "course_cohorts" ("infoproduct_id")')
    console.log('[migrate] Created course_cohorts table')
  }

  // ---- COURSE_MODULES ----
  if (!(await tableExists('course_modules'))) {
    await pool.query(`
      CREATE TABLE "course_modules" (
        "id" serial PRIMARY KEY,
        "infoproduct_id" integer,
        "title" varchar NOT NULL,
        "slug" varchar UNIQUE NOT NULL,
        "type" enum_course_modules_type DEFAULT 'custom',
        "icon" varchar,
        "description" varchar,
        "content" jsonb,
        "order" numeric DEFAULT 0,
        "visible" boolean DEFAULT true,
        "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
        "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
      )
    `)
    await pool.query('CREATE INDEX IF NOT EXISTS "course_modules_infoproduct_idx" ON "course_modules" ("infoproduct_id")')
    console.log('[migrate] Created course_modules table')
  }

  // ---- COURSE_DAYS ----
  if (!(await tableExists('course_days'))) {
    await pool.query(`
      CREATE TABLE "course_days" (
        "id" serial PRIMARY KEY,
        "cohort_id" integer,
        "day_number" numeric NOT NULL,
        "date" timestamp(3) with time zone,
        "title" varchar,
        "morning_block" jsonb,
        "day_block" jsonb,
        "evening_block" jsonb,
        "special_notes" varchar,
        "broadcast_scheduled" boolean DEFAULT false,
        "broadcast_time" varchar,
        "broadcast_title" varchar,
        "broadcast_type" enum_course_days_broadcast_type,
        "broadcast_zoom_link" varchar,
        "broadcast_recording_url" varchar,
        "sport_program" jsonb,
        "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
        "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
      )
    `)
    await pool.query('CREATE INDEX IF NOT EXISTS "course_days_cohort_idx" ON "course_days" ("cohort_id")')
    console.log('[migrate] Created course_days table')
  }

  // ---- ENROLLMENTS ----
  if (!(await tableExists('enrollments'))) {
    await pool.query(`
      CREATE TABLE "enrollments" (
        "id" serial PRIMARY KEY,
        "customer_id" integer,
        "cohort_id" integer,
        "order_id" integer,
        "status" enum_enrollments_status DEFAULT 'pending',
        "hashtag" varchar,
        "enrolled_at" timestamp(3) with time zone,
        "completed_at" timestamp(3) with time zone,
        "current_day" numeric DEFAULT 0,
        "report_streak" numeric DEFAULT 0,
        "missed_reports" numeric DEFAULT 0,
        "notes" varchar,
        "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
        "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
      )
    `)
    await pool.query('CREATE INDEX IF NOT EXISTS "enrollments_customer_idx" ON "enrollments" ("customer_id")')
    await pool.query('CREATE INDEX IF NOT EXISTS "enrollments_cohort_idx" ON "enrollments" ("cohort_id")')
    console.log('[migrate] Created enrollments table')
  }

  // ---- PARTICIPANT_REPORTS ----
  if (!(await tableExists('participant_reports'))) {
    await pool.query(`
      CREATE TABLE "participant_reports" (
        "id" serial PRIMARY KEY,
        "enrollment_id" integer,
        "course_day_id" integer,
        "date" timestamp(3) with time zone NOT NULL,
        "completion_rate" numeric,
        "notes" varchar,
        "status" enum_participant_reports_status DEFAULT 'submitted',
        "submitted_at" timestamp(3) with time zone,
        "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
        "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
      )
    `)
    await pool.query('CREATE INDEX IF NOT EXISTS "participant_reports_enrollment_idx" ON "participant_reports" ("enrollment_id")')
    console.log('[migrate] Created participant_reports table')
  }

  // ---- participant_reports_items (array sub-table) ----
  if (!(await tableExists('participant_reports_items'))) {
    await pool.query(`
      CREATE TABLE "participant_reports_items" (
        "_order" integer NOT NULL,
        "_parent_id" integer NOT NULL,
        "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
        "label" varchar,
        "completed" boolean DEFAULT false
      )
    `)
    await pool.query(`
      DO $$ BEGIN
        ALTER TABLE "participant_reports_items"
          ADD CONSTRAINT "participant_reports_items_parent_id_fk"
          FOREIGN KEY ("_parent_id") REFERENCES "participant_reports"("id") ON DELETE CASCADE;
      EXCEPTION WHEN duplicate_object THEN null;
      END $$
    `)
    await pool.query('CREATE INDEX IF NOT EXISTS "participant_reports_items_order_idx" ON "participant_reports_items" ("_order")')
    await pool.query('CREATE INDEX IF NOT EXISTS "participant_reports_items_parent_id_idx" ON "participant_reports_items" ("_parent_id")')
    console.log('[migrate] Created participant_reports_items table')
  }

  // ---- COURSE_RESULTS ----
  if (!(await tableExists('course_results'))) {
    await pool.query(`
      CREATE TABLE "course_results" (
        "id" serial PRIMARY KEY,
        "enrollment_id" integer,
        "type" enum_course_results_type DEFAULT 'final',
        "text" varchar NOT NULL,
        "weight_before" numeric,
        "weight_after" numeric,
        "status" enum_course_results_status DEFAULT 'pending',
        "published_at" timestamp(3) with time zone,
        "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
        "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
      )
    `)
    await pool.query('CREATE INDEX IF NOT EXISTS "course_results_enrollment_idx" ON "course_results" ("enrollment_id")')
    console.log('[migrate] Created course_results table')
  }

  // ---- course_results_photos (array sub-table) ----
  if (!(await tableExists('course_results_photos'))) {
    await pool.query(`
      CREATE TABLE "course_results_photos" (
        "_order" integer NOT NULL,
        "_parent_id" integer NOT NULL,
        "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
        "image_id" integer,
        "caption" varchar
      )
    `)
    await pool.query(`
      DO $$ BEGIN
        ALTER TABLE "course_results_photos"
          ADD CONSTRAINT "course_results_photos_parent_id_fk"
          FOREIGN KEY ("_parent_id") REFERENCES "course_results"("id") ON DELETE CASCADE;
      EXCEPTION WHEN duplicate_object THEN null;
      END $$
    `)
    await pool.query('CREATE INDEX IF NOT EXISTS "course_results_photos_order_idx" ON "course_results_photos" ("_order")')
    await pool.query('CREATE INDEX IF NOT EXISTS "course_results_photos_parent_id_idx" ON "course_results_photos" ("_parent_id")')
    console.log('[migrate] Created course_results_photos table')
  }

  // ---- course_results_effects (array sub-table) ----
  if (!(await tableExists('course_results_effects'))) {
    await pool.query(`
      CREATE TABLE "course_results_effects" (
        "_order" integer NOT NULL,
        "_parent_id" integer NOT NULL,
        "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
        "category" enum_course_results_effects_category,
        "description" varchar
      )
    `)
    await pool.query(`
      DO $$ BEGIN
        ALTER TABLE "course_results_effects"
          ADD CONSTRAINT "course_results_effects_parent_id_fk"
          FOREIGN KEY ("_parent_id") REFERENCES "course_results"("id") ON DELETE CASCADE;
      EXCEPTION WHEN duplicate_object THEN null;
      END $$
    `)
    await pool.query('CREATE INDEX IF NOT EXISTS "course_results_effects_order_idx" ON "course_results_effects" ("_order")')
    await pool.query('CREATE INDEX IF NOT EXISTS "course_results_effects_parent_id_idx" ON "course_results_effects" ("_parent_id")')
    console.log('[migrate] Created course_results_effects table')
  }

  // ==========================================
  // MESSENGER COLLECTIONS (ChatRooms + Messages)
  // ==========================================

  // ---- ENUM TYPES for messenger ----
  if (!(await enumExists('enum_chat_rooms_type'))) {
    await pool.query("CREATE TYPE enum_chat_rooms_type AS ENUM ('general', 'support', 'broadcast')")
    console.log('[migrate] Created enum_chat_rooms_type')
  }
  if (!(await enumExists('enum_messages_sender_type'))) {
    await pool.query("CREATE TYPE enum_messages_sender_type AS ENUM ('customer', 'staff', 'system')")
    console.log('[migrate] Created enum_messages_sender_type')
  }

  // ---- CHAT_ROOMS ----
  if (!(await tableExists('chat_rooms'))) {
    await pool.query(`
      CREATE TABLE "chat_rooms" (
        "id" serial PRIMARY KEY,
        "cohort_id" integer,
        "title" varchar NOT NULL,
        "type" enum_chat_rooms_type DEFAULT 'general',
        "is_active" boolean DEFAULT true,
        "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
        "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
      )
    `)
    await pool.query('CREATE INDEX IF NOT EXISTS "chat_rooms_cohort_idx" ON "chat_rooms" ("cohort_id")')
    console.log('[migrate] Created chat_rooms table')
  }

  // ---- MESSAGES ----
  if (!(await tableExists('messages'))) {
    await pool.query(`
      CREATE TABLE "messages" (
        "id" serial PRIMARY KEY,
        "chat_room_id" integer,
        "sender_type" enum_messages_sender_type DEFAULT 'customer',
        "sender_customer_id" integer,
        "sender_user_id" integer,
        "text" varchar NOT NULL,
        "is_deleted" boolean DEFAULT false,
        "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
        "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
      )
    `)
    await pool.query('CREATE INDEX IF NOT EXISTS "messages_chat_room_idx" ON "messages" ("chat_room_id")')
    console.log('[migrate] Created messages table')
  }

  // ---- messages_attachments (array sub-table) ----
  if (!(await tableExists('messages_attachments'))) {
    await pool.query(`
      CREATE TABLE "messages_attachments" (
        "_order" integer NOT NULL,
        "_parent_id" integer NOT NULL,
        "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
        "file_id" integer
      )
    `)
    await pool.query(`
      DO $$ BEGIN
        ALTER TABLE "messages_attachments"
          ADD CONSTRAINT "messages_attachments_parent_id_fk"
          FOREIGN KEY ("_parent_id") REFERENCES "messages"("id") ON DELETE CASCADE;
      EXCEPTION WHEN duplicate_object THEN null;
      END $$
    `)
    await pool.query('CREATE INDEX IF NOT EXISTS "messages_attachments_order_idx" ON "messages_attachments" ("_order")')
    await pool.query('CREATE INDEX IF NOT EXISTS "messages_attachments_parent_id_idx" ON "messages_attachments" ("_parent_id")')
    console.log('[migrate] Created messages_attachments table')
  }

  // ==========================================
  // REFERRAL PROGRAM v2 MIGRATION
  // Удаление старых колонок/таблиц очков-уровней
  // ==========================================

  async function dropColumnIfExists(table, column) {
    const exists = await pool.query(
      'SELECT 1 FROM information_schema.columns WHERE table_name = $1 AND column_name = $2',
      [table, column],
    )
    if (exists.rows.length > 0) {
      await pool.query(`ALTER TABLE "${table}" DROP COLUMN "${column}"`)
      console.log(`[migrate] Dropped ${table}.${column}`)
    }
  }

  // Старая таблица referrals больше не нужна — заменяется на referral_events / commissions / referral_partners
  if (await tableExists('referrals')) {
    await pool.query('DROP TABLE IF EXISTS "referrals" CASCADE')
    console.log('[migrate] Dropped old referrals table')
  }

  // Удаляем старые колонки очков/уровней из customers
  if (await tableExists('customers')) {
    await dropColumnIfExists('customers', 'experience_points')
    await dropColumnIfExists('customers', 'referral_level')
    await dropColumnIfExists('customers', 'referral_discount')
    await dropColumnIfExists('customers', 'total_referrals')
    await dropColumnIfExists('customers', 'total_referral_orders')
    await dropColumnIfExists('customers', 'total_referral_revenue')
    await dropColumnIfExists('customers', 'referral_code')
    await dropColumnIfExists('customers', 'referred_by_id')
  }

  // Удаляем старые реферальные колонки из orders
  if (await tableExists('orders')) {
    await dropColumnIfExists('orders', 'referrer_id')
    await dropColumnIfExists('orders', 'referral_points_awarded')
    await dropColumnIfExists('orders', 'referral_discount')
  }

  // Удаляем старые глобалы, которые не соответствуют новой схеме
  // (Payload мигрирует оставшиеся поля автоматически при push:true)
  if (await tableExists('referral_settings')) {
    await dropColumnIfExists('referral_settings', 'points_per_order')
    await dropColumnIfExists('referral_settings', 'points_percent_of_order')
    await dropColumnIfExists('referral_settings', 'cookie_lifetime_days')
    await dropColumnIfExists('referral_settings', 'min_order_amount_for_points')
  }
  if (await tableExists('referral_settings_levels')) {
    await pool.query('DROP TABLE IF EXISTS "referral_settings_levels" CASCADE')
    console.log('[migrate] Dropped old referral_settings_levels table')
  }

  console.log('[migrate] Done')
} catch (err) {
  console.error('[migrate] Error:', err.message)
} finally {
  await pool.end()
}
