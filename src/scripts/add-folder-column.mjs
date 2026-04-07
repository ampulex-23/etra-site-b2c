import pg from 'pg'
const { Client } = pg

const DATABASE_URL = 'postgresql://gen_user:Fk5L^s@Yqw^XX;@de5da695d6c895f89bec5d5e.twc1.net:5432/default_db'

async function addFolderColumn() {
  const client = new Client({ connectionString: DATABASE_URL })
  await client.connect()

  try {
    console.log('🔍 Checking if folder column exists...')

    // Check if column already exists
    const checkColumn = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'media' AND column_name = 'folder'
    `)

    if (checkColumn.rows.length > 0) {
      console.log('✅ Column "folder" already exists')
      return
    }

    console.log('➕ Adding "folder" column to media table...')

    // Add folder column
    await client.query(`
      ALTER TABLE media 
      ADD COLUMN folder TEXT
    `)

    console.log('✅ Column "folder" added successfully!')

    // Optional: Create index for faster queries
    console.log('📊 Creating index on folder column...')
    await client.query(`
      CREATE INDEX IF NOT EXISTS media_folder_idx ON media(folder)
    `)

    console.log('✅ Index created!')

  } catch (err) {
    console.error('❌ Error:', err.message)
  } finally {
    await client.end()
  }
}

addFolderColumn()
