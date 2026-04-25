import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

/**
 * Folder discovery endpoint for the Media Explorer.
 *
 * - `GET /api/media/folders`               → flat list of every known folder
 * - `GET /api/media/folders?parent=<path>` → immediate subfolders + file count
 *   for the given parent (use empty/missing param for root).
 * - `POST /api/media/folders`              → create an empty folder, body
 *   `{ "path": "products/new-box" }`. Persisted via the `media-folders`
 *   collection so it survives navigation even without any files in it.
 *
 * Folders are discovered from TWO sources, merged server-side:
 *  1. The `folder` field on existing `media` documents (implicit).
 *  2. The `media-folders` collection (explicit, empty-folder support).
 *
 * Parent folders are always implicit (e.g. `products/bottles` also
 * registers `products`). An optional `mode=tree` query returns the full
 * folder tree as a sorted flat array.
 */
export async function GET(req: NextRequest) {
  try {
    const payload = await getPayload({ config })

    const { searchParams } = new URL(req.url)
    const parentRaw = searchParams.get('parent') ?? ''
    const mode = searchParams.get('mode') ?? 'children'

    const parent = normalizeFolder(parentRaw)

    // 1) Folders derived from media documents.
    const media = await payload.find({
      collection: 'media',
      limit: 10000,
      depth: 0,
      select: {
        folder: true,
      },
    })

    const allFolders = new Set<string>()
    const registerWithAncestors = (raw: string) => {
      const f = normalizeFolder(raw)
      if (!f) return
      const parts = f.split('/')
      let path = ''
      for (let i = 0; i < parts.length; i += 1) {
        path = i === 0 ? parts[i] : `${path}/${parts[i]}`
        allFolders.add(path)
      }
    }

    for (const doc of media.docs as Array<{ folder?: string | null }>) {
      registerWithAncestors(doc?.folder || '')
    }

    // 2) Explicitly persisted empty folders.
    try {
      const persisted = await payload.find({
        collection: 'media-folders',
        limit: 10000,
        depth: 0,
        select: { path: true },
      })
      for (const doc of persisted.docs as Array<{ path?: string | null }>) {
        registerWithAncestors(doc?.path || '')
      }
    } catch (err) {
      // The collection may not exist yet in older DB snapshots; fall back
      // gracefully so the Media Explorer keeps working with implicit folders.
      console.warn('[api/media/folders] media-folders lookup failed:', err)
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

/**
 * Persist an empty folder so it shows up in the Explorer sidebar without
 * needing a file uploaded to it first. Idempotent: creating an existing
 * path returns 200 with `{ created: false }`.
 */
export async function POST(req: NextRequest) {
  try {
    const payload = await getPayload({ config })

    // Require an authenticated admin user. Payload's getPayload doesn't do
    // auth by default, so we surface Payload's auth via the incoming
    // cookies/headers using the REST `me` endpoint.
    const authCheck = await payload.auth({
      headers: req.headers,
    })
    const user = authCheck?.user
    if (!user || user.collection !== 'users') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = (await req.json().catch(() => ({}))) as { path?: string }
    const path = normalizeFolder(body?.path || '')
    if (!path) {
      return NextResponse.json(
        { error: 'Field "path" is required' },
        { status: 400 },
      )
    }

    const existing = await payload.find({
      collection: 'media-folders',
      where: { path: { equals: path } },
      limit: 1,
      depth: 0,
    })

    if (existing.totalDocs > 0) {
      return NextResponse.json({ created: false, path })
    }

    await payload.create({
      collection: 'media-folders',
      data: { path },
    })

    return NextResponse.json({ created: true, path })
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error'
    console.error('[api/media/folders POST] Error:', error)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

function normalizeFolder(input: string): string {
  return (input || '')
    .trim()
    .replace(/^\/+|\/+$/g, '')
    .replace(/\/{2,}/g, '/')
    .toLowerCase()
}
