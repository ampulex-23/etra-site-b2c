import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

export async function GET() {
  try {
    const payload = await getPayload({ config })

    // Get all media files
    const media = await payload.find({
      collection: 'media',
      limit: 10000,
      depth: 0,
    })

    // Extract unique folders
    const foldersSet = new Set<string>()
    
    media.docs.forEach((doc: any) => {
      if (doc.folder) {
        foldersSet.add(doc.folder)
        
        // Also add parent folders
        const parts = doc.folder.split('/')
        let path = ''
        parts.forEach((part: string, index: number) => {
          path = index === 0 ? part : `${path}/${part}`
          foldersSet.add(path)
        })
      }
    })

    const folders = Array.from(foldersSet).sort()

    return NextResponse.json({ folders })
  } catch (error: any) {
    console.error('[api/media/folders] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch folders' },
      { status: 500 },
    )
  }
}
