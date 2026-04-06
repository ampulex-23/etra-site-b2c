import pg from 'pg'
const { Client } = pg

// Используем DATABASE_URL с сервера Timeweb (из env переменных приложения)
const DATABASE_URL = 'postgresql://gen_user:Fk5L^s@Yqw^XX;@de5da695d6c895f89bec5d5e.twc1.net:5432/default_db'

const client = new Client({ connectionString: DATABASE_URL })

async function createTables() {
  console.log('🔧 Creating missing tables on Timeweb DB...')
  console.log('DB:', DATABASE_URL.replace(/:[^:@]+@/, ':***@'))
  
  await client.connect()
  console.log('✅ Connected to DB')

  try {
    // Сначала проверим, существуют ли таблицы
    const checkReviews = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'reviews'
      )
    `)
    console.log(`\nreviews table exists: ${checkReviews.rows[0].exists}`)

    const checkComments = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'comments'
      )
    `)
    console.log(`comments table exists: ${checkComments.rows[0].exists}`)

    // Create reviews table
    if (!checkReviews.rows[0].exists) {
      console.log('\n📝 Creating reviews table...')
      await client.query(`
        CREATE TABLE reviews (
          id SERIAL PRIMARY KEY,
          title VARCHAR,
          text TEXT NOT NULL,
          rating NUMERIC NOT NULL,
          customer_id INTEGER REFERENCES customers(id),
          product_id INTEGER REFERENCES products(id),
          order_id INTEGER REFERENCES orders(id),
          status VARCHAR DEFAULT 'pending',
          admin_reply TEXT,
          source VARCHAR DEFAULT 'site',
          featured BOOLEAN DEFAULT false,
          published_at TIMESTAMP WITH TIME ZONE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
      `)
      console.log('✅ reviews table created')
    } else {
      console.log('⏭️  reviews table already exists')
    }

    // Create comments table
    if (!checkComments.rows[0].exists) {
      console.log('\n📝 Creating comments table...')
      await client.query(`
        CREATE TABLE comments (
          id SERIAL PRIMARY KEY,
          text TEXT NOT NULL,
          author_customer_id INTEGER REFERENCES customers(id),
          author_user_id INTEGER REFERENCES users(id),
          author_display_name VARCHAR,
          content_type VARCHAR NOT NULL,
          post_id INTEGER REFERENCES posts(id),
          recipe_id INTEGER REFERENCES recipes(id),
          parent_id INTEGER REFERENCES comments(id),
          status VARCHAR DEFAULT 'pending',
          likes NUMERIC DEFAULT 0,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
      `)
      console.log('✅ comments table created')
    } else {
      console.log('⏭️  comments table already exists')
    }

    console.log('\n🎉 Done!')

  } catch (err) {
    console.error('❌ Error:', err.message)
    console.error(err)
    throw err
  } finally {
    await client.end()
  }
}

createTables().catch(err => {
  console.error('Failed:', err)
  process.exit(1)
})
