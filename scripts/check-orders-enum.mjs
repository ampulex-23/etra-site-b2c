import pg from 'pg'
const { Client } = pg
const conn = process.env.DATABASE_URL
const cleanConn = conn.replace(/[?&]sslmode=[^&]+/g, '')
const c = new Client({ connectionString: cleanConn, ssl: { rejectUnauthorized: false } })
await c.connect()
const r = await c.query(`SELECT unnest(enum_range(NULL::enum_orders_status))::text AS v`)
console.log('enum_orders_status values:', r.rows.map(x => x.v))
await c.end()
