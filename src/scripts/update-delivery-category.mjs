import pg from 'pg'
const { Client } = pg

const DATABASE_URL = 'postgresql://gen_user:Fk5L^s@Yqw^XX;@de5da695d6c895f89bec5d5e.twc1.net:5432/default_db'

async function updateCategory() {
  const client = new Client({ connectionString: DATABASE_URL })
  await client.connect()

  try {
    console.log('🔄 Updating category for "Доставка и Оплата"...')

    await client.query(
      `UPDATE posts 
       SET category = $1, updated_at = NOW()
       WHERE slug = $2`,
      ['service', 'dostavka-i-oplata']
    )

    console.log('✅ Category updated to "service"')
    
    // Also update the existing article about zakvasku
    const zakvaskaResult = await client.query(
      'SELECT id, title, category FROM posts WHERE slug = $1',
      ['zakvaska-praenzim-polnoe-opisanie']
    )
    
    if (zakvaskaResult.rows.length > 0) {
      console.log('\n📝 Found existing article:', zakvaskaResult.rows[0].title)
      console.log('   Current category:', zakvaskaResult.rows[0].category)
      
      await client.query(
        `UPDATE posts 
         SET category = $1, updated_at = NOW()
         WHERE slug = $2`,
        ['products', 'zakvaska-praenzim-polnoe-opisanie']
      )
      console.log('✅ Updated to "products" category')
    }

  } catch (err) {
    console.error('❌ Error:', err.message)
  } finally {
    await client.end()
  }
}

updateCategory()
