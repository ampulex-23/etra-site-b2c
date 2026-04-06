import pg from 'pg'
const { Client } = pg

const DATABASE_URL = 'postgresql://gen_user:Fk5L^s@Yqw^XX;@de5da695d6c895f89bec5d5e.twc1.net:5432/default_db'

async function checkArticle() {
  const client = new Client({ connectionString: DATABASE_URL })
  await client.connect()
  
  const result = await client.query(`
    SELECT id, title, slug, content 
    FROM posts 
    WHERE slug = 'zakvaska-praenzim-polnoe-opisanie'
  `)
  
  if (result.rows.length > 0) {
    const article = result.rows[0]
    console.log('📄 Article:', article.title)
    console.log('\n📝 Content structure:')
    console.log(JSON.stringify(article.content, null, 2))
  } else {
    console.log('❌ Article not found')
  }
  
  await client.end()
}

checkArticle().catch(console.error)
