'use client'

import React, { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'

/**
 * Client list-view Cell for the Products `images` array.
 * Renders a thumbnail of the first image instead of Payload's default
 * "N Images" label.
 *
 * NOTE: must be a client component. Async server components in admin
 * list cells break the row's title link wrapper, making the row
 * non-clickable. Payload's list query uses depth: 0, so when the first
 * image is just an ID we resolve it via REST.
 */

type MediaDoc = {
  id?: string | number
  url?: string | null
  alt?: string | null
  filename?: string | null
  sizes?: {
    thumbnail?: { url?: string | null }
    card?: { url?: string | null }
  } | null
}

// Module-level cache shared across all cells in the page.
const mediaCache = new Map<string, MediaDoc | null>()
const inflight = new Map<string, Promise<MediaDoc | null>>()

const fetchMedia = (id: string): Promise<MediaDoc | null> => {
  if (mediaCache.has(id)) return Promise.resolve(mediaCache.get(id) ?? null)
  const existing = inflight.get(id)
  if (existing) return existing
  const p = (async () => {
    try {
      const res = await fetch(`/api/media/${id}?depth=0`, {
        credentials: 'include',
        cache: 'no-store',
      })
      if (!res.ok) {
        mediaCache.set(id, null)
        return null
      }
      const doc = (await res.json()) as MediaDoc
      mediaCache.set(id, doc)
      return doc
    } catch {
      mediaCache.set(id, null)
      return null
    } finally {
      inflight.delete(id)
    }
  })()
  inflight.set(id, p)
  return p
}

const ProductImageCell: React.FC<{
  cellData?: unknown
  rowData?: { id?: string | number; images?: Array<{ image?: unknown }> | null }
}> = ({ cellData, rowData }) => {
  const items = useMemo<Array<{ image?: unknown }>>(() => {
    if (Array.isArray(cellData)) return cellData as Array<{ image?: unknown }>
    if (Array.isArray(rowData?.images)) return rowData!.images!
    return []
  }, [cellData, rowData])

  const count = items.length
  const firstRaw = items[0]?.image

  // Initialize from populated object if available
  const initialMedia: MediaDoc | null =
    firstRaw && typeof firstRaw === 'object' ? (firstRaw as MediaDoc) : null

  const [media, setMedia] = useState<MediaDoc | null>(initialMedia)

  useEffect(() => {
    if (initialMedia) {
      setMedia(initialMedia)
      return
    }
    if (firstRaw == null) {
      setMedia(null)
      return
    }
    if (typeof firstRaw === 'string' || typeof firstRaw === 'number') {
      let cancelled = false
      void fetchMedia(String(firstRaw)).then((doc) => {
        if (!cancelled) setMedia(doc)
      })
      return () => {
        cancelled = true
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [firstRaw])

  const url = media?.sizes?.thumbnail?.url || media?.url || null
  const id = rowData?.id
  const editHref = id != null ? `/admin/collections/products/${id}` : null

  const inner = !url ? (
    <span style={{ color: '#9ca3af', fontSize: 12 }}>
      {count > 0 ? `${count} изобр.` : '—'}
    </span>
  ) : (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
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
    </span>
  )

  if (!editHref) return inner

  return (
    <Link
      href={editHref}
      prefetch={false}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        textDecoration: 'none',
        color: 'inherit',
      }}
    >
      {inner}
    </Link>
  )
}

export default ProductImageCell
