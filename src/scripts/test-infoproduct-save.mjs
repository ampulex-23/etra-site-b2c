import pg from 'pg'
const { Client } = pg

const DATABASE_URL = 'postgresql://gen_user:Fk5L^s@Yqw^XX;@de5da695d6c895f89bec5d5e.twc1.net:5432/default_db'

const client = new Client({ connectionString: DATABASE_URL })

async function testSave() {
  await client.connect()
  
  console.log('🔍 Checking infoproducts table structure...')
  
  // Проверим структуру таблицы infoproducts
  const cols = await client.query(`
    SELECT column_name, data_type, is_nullable
    FROM information_schema.columns 
    WHERE table_name = 'infoproducts' 
    ORDER BY ordinal_position
  `)
  
  console.log('\n📋 Infoproducts columns:')
  cols.rows.forEach(r => {
    console.log(`  - ${r.column_name} (${r.data_type}) ${r.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'}`)
  })
  
  // Проверим, существует ли запись с id=1
  const record = await client.query('SELECT id, title, slug FROM infoproducts WHERE id = 1')
  
  if (record.rows.length > 0) {
    console.log('\n✅ Found infoproduct:')
    console.log(`   ID: ${record.rows[0].id}`)
    console.log(`   Title: ${record.rows[0].title}`)
    console.log(`   Slug: ${record.rows[0].slug}`)
    
    // Попробуем обновить запись
    console.log('\n🔄 Testing UPDATE query...')
    try {
      await client.query(`
        UPDATE infoproducts 
        SET updated_at = NOW() 
        WHERE id = 1
      `)
      console.log('✅ UPDATE successful')
    } catch (err) {
      console.error('❌ UPDATE failed:', err.message)
    }
  } else {
    console.log('\n❌ No infoproduct with id=1 found')
  }
  
  await client.end()
}

testSave().catch(console.error)
