import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

/**
 * Folder discovery endpoint for the Media Explorer.
 *
 * - `GET /api/media/folders`               → flat list of every known folder
 * - `GET /api/media/folders?parent=<path>` → immediate subfolders + file count
 *   for the given parent (use empty/missing param for root).
 *
 * Folders are derived from the `folder` field on existing media documents.
 * Parent folders are implicit (e.g. `products/bottles` also registers
 * `products`). An optional `mode=tree` query returns the full folder tree
 * as a sorted flat array.
 */
export async function GET(req: NextRequest) {
  try {
    const payload = await getPayload({ config })

    const { searchParams } = new URL(req.url)
    const parentRaw = searchParams.get('parent') ?? ''
    const mode = searchParams.get('mode') ?? 'children'

    const parent = normalizeFolder(parentRaw)

    // Pull just the folder strings (kept deliberately small: the list can
    // grow to tens of thousands of files, but only the distinct set matters).
    const media = await payload.find({
      collection: 'media',
      limit: 10000,
      depth: 0,
      select: {
        folder: true,
      },
    })

    const allFolders = new Set<string>()
    for (const doc of media.docs as Array<{ folder?: string | null }>) {
      const f = normalizeFolder(doc?.folder || '')
      if (!f) continue
      allFolders.add(f)
      // Register every ancestor so empty parents show up as clickable crumbs.
      const parts = f.split('/')
      let path = ''
      for (let i = 0; i < parts.length; i += 1) {
        path = i === 0 ? parts[i] : `${path}/${parts[i]}`
        allFolders.add(path)
      }
    }

    if (mode === 'tree') {
      return NextResponse.json({
        folders: Array.from(allFolders).sort(),
      })
    }

    // Immediate children of `parent`. `parent === ''` → top-level folders.
    const prefix = parent ? `${parent}/` : ''
    const childNames = new Set<string>()

    for (const folder of allFolders) {
      if (parent) {
        if (!folder.startsWith(prefix)) continue
        const remainder = folder.slice(prefix.length)
        if (!remainder) continue
        const next = remainder.split('/')[0]
        if (next) childNames.add(next)
      } else {
        const next = folder.split('/')[0]
        if (next) childNames.add(next)
      }
    }

    const subfolders = Array.from(childNames)
      .sort((a, b) => a.localeCompare(b, 'ru'))
      .map((name) => ({
        name,
        path: parent ? `${parent}/${name}` : name,
      }))

    return NextResponse.json({
      parent,
      subfolders,
    })
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error'
    console.error('[api/media/folders] Error:', error)
    return NextResponse.json(
      { error: msg || 'Failed to fetch folders' },
      { status: 500 },
    )
  }
}

function normalizeFolder(input: string): string {
  return (input || '')
    .trim()
    .replace(/^\/+|\/+$/g, '')
    .replace(/\/{2,}/g, '/')
    .toLowerCase()
}
