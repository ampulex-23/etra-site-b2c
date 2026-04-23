'use client'

import React from 'react'

/**
 * Cell renderer for the denormalised order stats on the customers list
 * (`orderCount` and `orderTotalSum`).
 *
 * Each cell wraps the number in a link to the Orders collection pre-filtered
 * by the current customer, so the admin can click through to the
 * underlying orders. Formatting differs by variant: count is a plain
 * integer, sum is formatted as roubles.
 */
type Props = {
  cellData?: number | null
  rowData?: { id?: string | number } | null
  variant: 'count' | 'sum'
}

const fmtCount = (n: number) => n.toLocaleString('ru-RU')
const fmtSum = (n: number) => `${Math.round(n).toLocaleString('ru-RU')} ₽`

export const CustomerStatCell: React.FC<Props> = ({ cellData, rowData, variant }) => {
  const raw = typeof cellData === 'number' ? cellData : 0
  const id = rowData?.id
  const isZero = raw === 0

  const content = variant === 'sum' ? fmtSum(raw) : fmtCount(raw)

  if (!id || isZero) {
    return <span style={{ color: '#bbb' }}>{content}</span>
  }

  // Build a link to the filtered orders list. Payload encodes list filters
  // via query-string params of the form `where[field][operator]=value`.
  const href = `/admin/collections/orders?where[customer][equals]=${encodeURIComponent(String(id))}`

  return (
    <a
      href={href}
      style={{ color: 'var(--theme-text, #111)', textDecoration: 'underline', textDecorationStyle: 'dotted' }}
      title={variant === 'sum' ? 'Открыть заказы клиента' : 'Открыть все заказы клиента'}
      onClick={(e) => {
        // Prevent the row's own default click-through (which would navigate
        // to the customer's edit page).
        e.stopPropagation()
      }}
    >
      {content}
    </a>
  )
}

export const CustomerOrderCountCell: React.FC<Omit<Props, 'variant'>> = (props) => (
  <CustomerStatCell {...props} variant="count" />
)

export const CustomerOrderTotalSumCell: React.FC<Omit<Props, 'variant'>> = (props) => (
  <CustomerStatCell {...props} variant="sum" />
)
