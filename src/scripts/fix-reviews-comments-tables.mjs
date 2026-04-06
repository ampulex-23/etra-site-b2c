import pg from 'pg'
const { Client } = pg

const DATABASE_URL = 'postgresql://gen_user:Fk5L^s@Yqw^XX;@de5da695d6c895f89bec5d5e.twc1.net:5432/default_db'

const client = new Client({ connectionString: DATABASE_URL })

async function fixTables() {
  console.log('🔧 Fixing reviews and comments tables...')
  await client.connect()

  try {
    // Drop existing tables
    console.log('\n🗑️  Dropping old tables...')
    await client.query('DROP TABLE IF EXISTS comments CASCADE')
    console.log('✅ Dropped comments')
    
    await client.query('DROP TABLE IF EXISTS reviews CASCADE')
    console.log('✅ Dropped reviews')

    // Create reviews with proper Payload structure
    console.log('\n📝 Creating reviews table with proper structure...')
    await client.query(`
      CREATE TABLE reviews (
        id SERIAL PRIMARY KEY,
        title VARCHAR,
        text TEXT NOT NULL,
        rating NUMERIC NOT NULL,
        customer_id INTEGER REFERENCES customers(id) ON DELETE SET NULL,
        product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
        order_id INTEGER REFERENCES orders(id) ON DELETE SET NULL,
        status VARCHAR DEFAULT 'pending',
        admin_reply TEXT,
        source VARCHAR DEFAULT 'site',
        featured BOOLEAN DEFAULT false,
        published_at TIMESTAMP WITH TIME ZONE,
        updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      )
    `)
    console.log('✅ reviews table created')

    // Create comments with proper Payload structure
    console.log('\n📝 Creating comments table with proper structure...')
    await client.query(`
      CREATE TABLE comments (
        id SERIAL PRIMARY KEY,
        text TEXT NOT NULL,
        author_customer_id INTEGER REFERENCES customers(id) ON DELETE SET NULL,
        author_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        author_display_name VARCHAR,
        content_type VARCHAR NOT NULL,
        post_id INTEGER REFERENCES posts(id) ON DELETE CASCADE,
        recipe_id INTEGER REFERENCES recipes(id) ON DELETE CASCADE,
        parent_id INTEGER REFERENCES comments(id) ON DELETE CASCADE,
        status VARCHAR DEFAULT 'pending',
        likes NUMERIC DEFAULT 0,
        updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      )
    `)
    console.log('✅ comments table created')

    // Create indexes for better performance
    console.log('\n📊 Creating indexes...')
    await client.query('CREATE INDEX idx_reviews_customer ON reviews(customer_id)')
    await client.query('CREATE INDEX idx_reviews_product ON reviews(product_id)')
    await client.query('CREATE INDEX idx_reviews_status ON reviews(status)')
    await client.query('CREATE INDEX idx_comments_post ON comments(post_id)')
    await client.query('CREATE INDEX idx_comments_recipe ON comments(recipe_id)')
    await client.query('CREATE INDEX idx_comments_status ON comments(status)')
    console.log('✅ Indexes created')

    console.log('\n🎉 All done! Tables are now properly structured.')

  } catch (err) {
    console.error('❌ Error:', err.message)
    throw err
  } finally {
    await client.end()
  }
}

fixTables().catch(err => {
  console.error('Failed:', err)
  process.exit(1)
})
