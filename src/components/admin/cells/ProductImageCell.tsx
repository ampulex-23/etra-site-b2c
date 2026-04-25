'use client'

import React from 'react'

/**
 * List-view Cell for the Products `images` array. Replaces Payload's
 * default "N Images" text with a thumbnail of the first image so the
 * Products table is actually scannable.
 */
type ImagesCellData =
  | Array<{
      id?: string
      image?:
        | string
        | number
        | {
            id?: string | number
            url?: string | null
            alt?: string | null
            mimeType?: string | null
            sizes?: { thumbnail?: { url?: string | null } }
          }
        | null
    }>
  | null
  | undefined

const ProductImageCell: React.FC<{ cellData?: ImagesCellData; rowData?: any }> = ({
  cellData,
  rowData,
}) => {
  const items = Array.isArray(cellData)
    ? cellData
    : Array.isArray(rowData?.images)
      ? rowData.images
      : []
  const first = items?.[0]?.image
  const count = items?.length || 0

  if (!first || typeof first !== 'object') {
    return (
      <span style={{ color: '#9ca3af', fontSize: 12 }}>
        {count > 0 ? `${count} изобр.` : '—'}
      </span>
    )
  }

  const url = first.sizes?.thumbnail?.url || first.url
  if (!url) {
    return <span style={{ color: '#9ca3af', fontSize: 12 }}>—</span>
  }

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={url}
        alt={first.alt || ''}
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
