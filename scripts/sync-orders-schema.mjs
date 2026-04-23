import pg from 'pg'
const { Client } = pg

const conn = process.env.DATABASE_URL
if (!conn) throw new Error('DATABASE_URL missing')
const cleanConn = conn.replace(/[?&]sslmode=[^&]+/g, '')
const c = new Client({ connectionString: cleanConn, ssl: { rejectUnauthorized: false } })
await c.connect()

// Dump current orders columns
const got = await c.query(`
  SELECT column_name FROM information_schema.columns
  WHERE table_schema='public' AND table_name='orders'
  ORDER BY column_name
`)
const have = new Set(got.rows.map(r => r.column_name))
console.log('Existing orders columns:', [...have].join(', '))

// Expected columns (from Orders.ts + payload-types.ts). Name mapping camelCase -> snake_case.
const expected = [
  ['allow_top_up', 'boolean DEFAULT true'],
  ['merged_into_id', 'integer'],
  ['payment_method', 'varchar'],
  ['payment_transaction_id', 'varchar'],
  ['payment_status', 'varchar'],
  ['payment_paid_at', 'timestamp with time zone'],
  ['delivery_method', 'varchar'],
  ['delivery_address', 'varchar'],
  ['delivery_tracking_number', 'varchar'],
  ['linked_delivery_id', 'integer'],
  ['linked_payment_id', 'integer'],
  ['selected_cohort_id', 'integer'],
  ['promo_code_id', 'integer'],
  ['source', 'varchar'],
  ['puzzle_bot_order_id', 'varchar'],
  ['imported_at', 'timestamp with time zone'],
  ['amo_crm_deal_id', 'varchar'],
  ['notes', 'varchar'],
  ['referral_partner_id', 'integer'],
  ['promo_code_applied', 'boolean DEFAULT false'],
  ['customer_discount_applied', 'boolean DEFAULT false'],
  ['is_partner_purchase', 'boolean DEFAULT false'],
  ['partner_discount_applied', 'boolean DEFAULT false'],
  ['referral_commissions_created', 'boolean DEFAULT false'],
]

const missing = expected.filter(([n]) => !have.has(n))
console.log('\nMissing columns:', missing.map(([n]) => n).join(', ') || '(none)')

for (const [name, type] of missing) {
  const sql = `ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "${name}" ${type}`
  console.log('>', sql)
  await c.query(sql)
}

await c.end()
console.log('Done.')
