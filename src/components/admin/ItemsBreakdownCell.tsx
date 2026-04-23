'use client'

import React, { useMemo } from 'react'
import { useRelationshipTitles } from './useRelationshipTitles'

type Item = {
  product?: any
  quantity?: number
  actualQty?: number
}

const productId = (p: Item['product']): string | null => {
  if (!p) return null
  if (typeof p === 'object') return p.id !== undefined ? String(p.id) : null
  return String(p)
}

const productLabelFromObject = (p: Item['product']): string | null => {
  if (p && typeof p === 'object') {
    return p.title || p.name || p.slug || null
  }
  return null
}

const itemQty = (it: Item): number => {
  if (typeof it.quantity === 'number') return it.quantity
  if (typeof it.actualQty === 'number') return it.actualQty
  return 0
}

const ItemsBreakdownCell: React.FC<{ cellData?: Item[] | null }> = ({ cellData }) => {
  const items = Array.isArray(cellData) ? cellData : []
  const ids = useMemo(
    () => items.map((it) => productId(it.product)).filter((x): x is string => Boolean(x)),
    [items],
  )
  const titles = useRelationshipTitles('products', ids)
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
      {items.map((it, idx) => {
        const id = productId(it.product)
        const label =
          productLabelFromObject(it.product) ||
          (id ? titles[id] : '') ||
          id ||
          '—'
        const qty = itemQty(it)
        return (
          <li
            key={idx}
            style={{
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              maxWidth: 320,
            }}
            title={`${label} — ${qty}`}
          >
            <span>{label}</span>
            <span style={{ color: 'var(--theme-elevation-500, #666)' }}> — </span>
            <strong>{qty}</strong>
          </li>
        )
      })}
    </ul>
  )
}

export default ItemsBreakdownCell
