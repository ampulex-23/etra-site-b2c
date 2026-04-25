import React, { cache } from 'react'
import { getPayload } from 'payload'
import config from '@payload-config'

/**
 * Server-rendered list-view Cell for the Products `images` array.
 * Renders a thumbnail of the first image instead of Payload's default
 * "N Images" label.
 *
 * Payload's admin list query uses depth: 0, so `cellData` typically
 * contains just media IDs; we resolve the first one via `findByID`.
 * React's `cache()` dedupes lookups across cells in the same request.
 */

type MediaDoc = {
  id?: string | number
  url?: string | null
  alt?: string | null
  filename?: string | null
  mimeType?: string | null
  sizes?: {
    thumbnail?: { url?: string | null }
    card?: { url?: string | null }
  } | null
}

const loadMedia = cache(async (id: string | number): Promise<MediaDoc | null> => {
  try {
    const payload = await getPayload({ config })
    const doc = await payload.findByID({
      collection: 'media',
      id,
      depth: 0,
      disableErrors: true,
    })
    return (doc as MediaDoc) || null
  } catch {
    return null
  }
})

const ProductImageCell = async ({
  cellData,
  rowData,
}: {
  cellData?: unknown
  rowData?: { images?: Array<{ image?: unknown }> | null }
}) => {
  const items = Array.isArray(cellData)
    ? (cellData as Array<{ image?: unknown }>)
    : Array.isArray(rowData?.images)
      ? rowData.images
      : []

  const count = items.length
  const firstRaw = items[0]?.image

  let media: MediaDoc | null = null
  if (firstRaw && typeof firstRaw === 'object') {
    media = firstRaw as MediaDoc
  } else if (firstRaw != null && (typeof firstRaw === 'string' || typeof firstRaw === 'number')) {
    media = await loadMedia(firstRaw)
  }

  const url = media?.sizes?.thumbnail?.url || media?.url || null

  if (!url) {
    return (
      <span style={{ color: '#9ca3af', fontSize: 12 }}>
        {count > 0 ? `${count} изобр.` : '—'}
      </span>
    )
  }

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={url}
        alt={media?.alt || media?.filename || ''}
        loading="lazy"
        style={{
          width: 40,
          height: 40,
          objectFit: 'cover',
          borderRadius: 4,
          background: '#f3f4f6',
          display: 'block',
        }}
      />
      {count > 1 ? (
        <span style={{ color: '#6b7280', fontSize: 12 }}>+{count - 1}</span>
      ) : null}
    </div>
  )
}

export default ProductImageCell
