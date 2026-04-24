import pg from 'pg'
const conn = process.env.DATABASE_URL
const clean = conn.replace(/[?&]sslmode=[^&]+/g, '')
const c = new pg.Client({ connectionString: clean, ssl: { rejectUnauthorized: false } })
await c.connect()

const before = await c.query(`
  SELECT column_name, is_nullable
  FROM information_schema.columns
  WHERE table_schema='public' AND table_name='media' AND column_name='alt'
`)
console.log('before:', before.rows)

if (before.rows[0]?.is_nullable === 'NO') {
  await c.query(`ALTER TABLE "media" ALTER COLUMN "alt" DROP NOT NULL`)
  console.log('dropped NOT NULL on media.alt')
} else {
  console.log('media.alt is already nullable')
}

const after = await c.query(`
  SELECT column_name, is_nullable
  FROM information_schema.columns
  WHERE table_schema='public' AND table_name='media' AND column_name='alt'
`)
console.log('after:', after.rows)
await c.end()
