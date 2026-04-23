import pg from 'pg'
import 'dotenv/config'
const { Client } = pg

const conn = process.env.DATABASE_URL
if (!conn) throw new Error('DATABASE_URL missing')

// Strip sslmode from connection string to avoid pg-connection-string forcing verify-full
const cleanConn = conn.replace(/[?&]sslmode=[^&]+/g, '')
const c = new Client({ connectionString: cleanConn, ssl: { rejectUnauthorized: false } })
await c.connect()

const tables = await c.query(`
  SELECT tablename FROM pg_tables
  WHERE schemaname='public' AND tablename LIKE '%_rels'
  ORDER BY tablename
`)
console.log('=== *_rels tables ===')
console.log(tables.rows.map(r => r.tablename).join('\n'))

// Pick a sample rels table to dump schema
const sample = tables.rows.find(r => r.tablename === 'customers_rels') || tables.rows[0]
if (sample) {
  console.log(`\n=== columns of ${sample.tablename} ===`)
  const cols = await c.query(`
    SELECT column_name, data_type, is_nullable, column_default
    FROM information_schema.columns
    WHERE table_schema='public' AND table_name=$1
    ORDER BY ordinal_position
  `, [sample.tablename])
  console.table(cols.rows)

  const idx = await c.query(`
    SELECT indexname, indexdef FROM pg_indexes
    WHERE schemaname='public' AND tablename=$1
  `, [sample.tablename])
  console.log('\nIndexes:')
  idx.rows.forEach(r => console.log(r.indexdef))
}

const exists = await c.query(`
  SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='orders_rels'
`)
console.log('\norders_rels exists:', exists.rowCount > 0)

await c.end()
