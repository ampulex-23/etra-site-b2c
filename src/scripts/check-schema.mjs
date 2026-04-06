import pg from 'pg'
const { Client } = pg

const client = new Client({
  connectionString: 'postgresql://gen_user:Fk5L%5Es%40Yqw%5EXX%3B@de5da695d6c895f89bec5d5e.twc1.net:5432/default_db'
})

async function check() {
  await client.connect()
  const res = await client.query(`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'infoproducts' 
    ORDER BY ordinal_position
  `)
  console.log('=== INFOPRODUCTS COLUMNS ===')
  res.rows.forEach(r => console.log(`${r.column_name} (${r.data_type})`))
  
  const res2 = await client.query(`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'course_modules' 
    ORDER BY ordinal_position
  `)
  console.log('\n=== COURSE_MODULES COLUMNS ===')
  res2.rows.forEach(r => console.log(`${r.column_name} (${r.data_type})`))
  
  await client.end()
}

check().catch(console.error)
