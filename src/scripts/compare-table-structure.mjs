import pg from 'pg'
const { Client } = pg

const DATABASE_URL = 'postgresql://gen_user:Fk5L^s@Yqw^XX;@de5da695d6c895f89bec5d5e.twc1.net:5432/default_db'

const client = new Client({ connectionString: DATABASE_URL })

async function compareStructure() {
  await client.connect()
  
  // Проверим структуру posts (рабочая таблица)
  console.log('📋 Posts table columns (working example):')
  const postsCols = await client.query(`
    SELECT column_name, data_type, is_nullable, column_default
    FROM information_schema.columns 
    WHERE table_name = 'posts' 
    ORDER BY ordinal_position
  `)
  postsCols.rows.forEach(r => {
    console.log(`  - ${r.column_name} (${r.data_type}) ${r.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'} ${r.column_default ? `DEFAULT ${r.column_default}` : ''}`)
  })
  
  console.log('\n📋 Reviews table columns (broken):')
  const reviewsCols = await client.query(`
    SELECT column_name, data_type, is_nullable, column_default
    FROM information_schema.columns 
    WHERE table_name = 'reviews' 
    ORDER BY ordinal_position
  `)
  reviewsCols.rows.forEach(r => {
    console.log(`  - ${r.column_name} (${r.data_type}) ${r.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'} ${r.column_default ? `DEFAULT ${r.column_default}` : ''}`)
  })
  
  await client.end()
}

compareStructure().catch(console.error)
