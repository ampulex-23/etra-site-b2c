import fetch from 'node-fetch'

const url = 'https://etraproject.ru/api/articles/zakvaska-praenzim-polnoe-opisanie'

async function checkContent() {
  try {
    const res = await fetch(url)
    const data = await res.json()
    
    console.log('📄 Article:', data.article.title)
    console.log('\n📝 Content structure:')
    console.log(JSON.stringify(data.article.content, null, 2))
    
    // Find video nodes
    const findNodes = (obj, type) => {
      const results = []
      const search = (node) => {
        if (node && typeof node === 'object') {
          if (node.type === type) results.push(node)
          if (node.children) node.children.forEach(search)
        }
      }
      search(obj)
      return results
    }
    
    const videos = findNodes(data.article.content, 'block')
    const uploads = findNodes(data.article.content, 'upload')
    
    console.log('\n🎥 Video blocks found:', videos.length)
    if (videos.length > 0) {
      console.log(JSON.stringify(videos, null, 2))
    }
    
    console.log('\n🖼️ Upload blocks found:', uploads.length)
    if (uploads.length > 0) {
      console.log(JSON.stringify(uploads, null, 2))
    }
    
  } catch (err) {
    console.error('Error:', err.message)
  }
}

checkContent()
