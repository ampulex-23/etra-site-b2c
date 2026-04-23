'use client'

import React from 'react'

type Item = {
  product?: any
  quantity?: number
  actualQty?: number
}

const productLabel = (p: Item['product']): string => {
  if (!p) return '—'
  if (typeof p === 'object') {
    return p.title || p.name || p.slug || p.id || '—'
  }
  return String(p)
}

const itemQty = (it: Item): number => {
  if (typeof it.quantity === 'number') return it.quantity
  if (typeof it.actualQty === 'number') return it.actualQty
  return 0
}

const ItemsBreakdownCell: React.FC<{ cellData?: Item[] | null }> = ({ cellData }) => {
  const items = Array.isArray(cellData) ? cellData : []
  if (items.length === 0) {
    return <span style={{ color: 'var(--theme-elevation-400, #999)' }}>—</span>
  }

  return (
    <ul
      style={{
        margin: 0,
        padding: 0,
        listStyle: 'none',
        fontSize: 13,
        lineHeight: 1.35,
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
      }}
    >
      {items.map((it, idx) => (
        <li
          key={idx}
          style={{
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            maxWidth: 320,
          }}
          title={`${productLabel(it.product)} — ${itemQty(it)}`}
        >
          <span>{productLabel(it.product)}</span>
          <span style={{ color: 'var(--theme-elevation-500, #666)' }}> — </span>
          <strong>{itemQty(it)}</strong>
        </li>
      ))}
    </ul>
  )
}

export default ItemsBreakdownCell
