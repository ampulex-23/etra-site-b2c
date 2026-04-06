import pg from 'pg'
const { Client } = pg

const DATABASE_URL = 'postgresql://gen_user:Fk5L%5Es%40Yqw%5EXX%3B@de5da695d6c895f89bec5d5e.twc1.net:5432/default_db'

const client = new Client({ connectionString: DATABASE_URL })

async function createTables() {
  console.log('🔧 Creating missing tables...')
  await client.connect()

  try {
    // Create reviews table
    console.log('Creating reviews table...')
    await client.query(`
      CREATE TABLE IF NOT EXISTS reviews (
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

    // Create comments table
    console.log('Creating comments table...')
    await client.query(`
      CREATE TABLE IF NOT EXISTS comments (
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

    console.log('\n🎉 All tables created successfully!')

  } catch (err) {
    console.error('❌ Error:', err.message)
    throw err
  } finally {
    await client.end()
  }
}

createTables().catch(err => {
  console.error('Failed:', err)
  process.exit(1)
})
