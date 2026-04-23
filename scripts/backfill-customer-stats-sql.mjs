import pg from 'pg'
const { Client } = pg

const conn = process.env.DATABASE_URL
if (!conn) throw new Error('DATABASE_URL missing')
const cleanConn = conn.replace(/[?&]sslmode=[^&]+/g, '')
const c = new Client({ connectionString: cleanConn, ssl: { rejectUnauthorized: false } })
await c.connect()

// Recompute order_count and order_total_sum for every customer from the
// orders table, ignoring merged orders (same rule as the runtime hook).
const res = await c.query(`
  WITH stats AS (
    SELECT customer_id AS cid,
           COUNT(*)::numeric              AS cnt,
           COALESCE(SUM(total), 0)::numeric AS sum
    FROM orders
    WHERE customer_id IS NOT NULL
      AND (status IS NULL OR status::text <> 'merged')
    GROUP BY customer_id
  )
  UPDATE customers c
  SET order_count     = COALESCE(s.cnt, 0),
      order_total_sum = COALESCE(s.sum, 0)
  FROM (
    SELECT c.id AS cid,
           COALESCE(s.cnt, 0) AS cnt,
           COALESCE(s.sum, 0) AS sum
    FROM customers c
    LEFT JOIN stats s ON s.cid = c.id
  ) s
  WHERE c.id = s.cid
  RETURNING c.id, c.order_count, c.order_total_sum
`)
console.log(`Updated ${res.rowCount} customer rows.`)

const sample = await c.query(`
  SELECT id, name, order_count, order_total_sum
  FROM customers
  WHERE order_count > 0
  ORDER BY order_total_sum DESC
  LIMIT 10
`)
console.log('\nTop 10 customers by total spent:')
console.table(sample.rows)

await c.end()
