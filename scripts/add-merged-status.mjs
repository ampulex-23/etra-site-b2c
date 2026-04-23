import pg from 'pg'
const conn = process.env.DATABASE_URL
const clean = conn.replace(/[?&]sslmode=[^&]+/g, '')
const c = new pg.Client({ connectionString: clean, ssl: { rejectUnauthorized: false } })
await c.connect()
await c.query(`ALTER TYPE enum_orders_status ADD VALUE IF NOT EXISTS 'merged'`)
const r = await c.query(`SELECT unnest(enum_range(NULL::enum_orders_status))::text AS v`)
console.log('enum_orders_status:', r.rows.map(x => x.v).join(', '))
await c.end()
