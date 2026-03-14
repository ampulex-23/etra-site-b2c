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
    ])
  }

  console.log('[migrate] Done')
} catch (err) {
  console.error('[migrate] Error:', err.message)
} finally {
  await pool.end()
}
