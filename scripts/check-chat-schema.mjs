import 'dotenv/config'
import pg from 'pg'

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL })
try {
  for (const tbl of ['chat_rooms', 'messages']) {
    const { rows } = await pool.query(
      `SELECT column_name, data_type, is_nullable, column_default
       FROM information_schema.columns
       WHERE table_schema='public' AND table_name=$1
       ORDER BY ordinal_position`,
      [tbl],
    )
    console.log(`\n=== ${tbl} (${rows.length} cols) ===`)
    for (const r of rows) {
      console.log(` ${r.column_name.padEnd(30)} ${r.data_type.padEnd(25)} nullable=${r.is_nullable} default=${r.column_default ?? ''}`)
    }
  }
} finally {
  await pool.end()
}
