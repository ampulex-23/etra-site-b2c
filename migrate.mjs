import pg from 'pg'
const { Pool } = pg

async function migrate() {
  const url = process.env.DATABASE_URL
  if (!url) {
    console.log('[migrate] No DATABASE_URL, skipping')
    return
  }

  const ssl = process.env.DATABASE_CA_PATH
    ? { ca: (await import('fs')).readFileSync(process.env.DATABASE_CA_PATH, 'utf-8') }
    : { rejectUnauthorized: false }

  const pool = new Pool({ connectionString: url, ssl })

  try {
    const { rows } = await pool.query(
      "SELECT column_name FROM information_schema.columns WHERE table_name = 'users'"
    )
    const cols = rows.map(r => r.column_name)

    if (cols.includes('role')) {
      console.log('[migrate] users table already has role column, skipping')
      await pool.end()
      return
    }

    console.log('[migrate] Adding missing columns to users table...')

    const typeExists = await pool.query(
      "SELECT 1 FROM pg_type WHERE typname = 'enum_users_role'"
    )
    if (typeExists.rows.length === 0) {
      await pool.query(
        "CREATE TYPE enum_users_role AS ENUM ('admin', 'manager', 'warehouse', 'content')"
      )
      console.log('[migrate] Created enum_users_role type')
    }

    const alterParts = []
    if (!cols.includes('name')) alterParts.push('ADD COLUMN name varchar')
    if (!cols.includes('role')) alterParts.push("ADD COLUMN role enum_users_role DEFAULT 'admin'")
    if (!cols.includes('active')) alterParts.push('ADD COLUMN active boolean DEFAULT true')
    if (!cols.includes('phone')) alterParts.push('ADD COLUMN phone varchar')
    if (!cols.includes('position')) alterParts.push('ADD COLUMN position varchar')

    if (alterParts.length > 0) {
      await pool.query(`ALTER TABLE users ${alterParts.join(', ')}`)
      console.log('[migrate] Added columns:', alterParts.length)
    }

    // Also check ai_settings columns
    const { rows: aiRows } = await pool.query(
      "SELECT column_name FROM information_schema.columns WHERE table_name = 'ai_settings'"
    )
    const aiCols = aiRows.map(r => r.column_name)

    if (aiCols.length > 0 && aiCols.includes('ai_text_model')) {
      // Check if it's varchar (old) vs enum (new) — if it's already there, skip
      console.log('[migrate] ai_settings table OK')
    }

    console.log('[migrate] Migration complete')
  } catch (err) {
    console.error('[migrate] Error:', err.message)
    // Don't crash — let the server start anyway
  } finally {
    await pool.end()
  }
}

migrate()
