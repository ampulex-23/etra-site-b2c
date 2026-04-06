import pg from 'pg'
const { Client } = pg

const DATABASE_URL = 'postgresql://gen_user:Fk5L^s@Yqw^XX;@de5da695d6c895f89bec5d5e.twc1.net:5432/default_db'

const client = new Client({ connectionString: DATABASE_URL })

async function checkTables() {
  await client.connect()
  
  // Проверим все таблицы в БД
  const result = await client.query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    ORDER BY table_name
  `)
  
  console.log('📋 All tables in database:')
  result.rows.forEach(row => {
    console.log(`  - ${row.table_name}`)
  })
  
  // Проверим структуру reviews
  console.log('\n📋 Reviews table columns:')
  const reviewsCols = await client.query(`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'reviews' 
    ORDER BY ordinal_position
  `)
  reviewsCols.rows.forEach(r => console.log(`  - ${r.column_name} (${r.data_type})`))
  
  // Проверим структуру comments
  console.log('\n📋 Comments table columns:')
  const commentsCols = await client.query(`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'comments' 
    ORDER BY ordinal_position
  `)
  commentsCols.rows.forEach(r => console.log(`  - ${r.column_name} (${r.data_type})`))
  
  await client.end()
}

checkTables().catch(console.error)
