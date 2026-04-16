'use client'

import React from 'react'

interface Product {
  id: number
  title: string
}

interface Item {
  product: Product | number
  quantity: number
}

interface StockMovementItemsCellProps {
  data: Item[]
}

export const StockMovementItemsCell: React.FC<StockMovementItemsCellProps> = ({ data }) => {
  if (!data || data.length === 0) {
    return <span style={{ color: '#999' }}>—</span>
  }

  return (
    <div style={{ fontSize: '13px', lineHeight: '1.4' }}>
      {data.map((item, idx) => {
        const productName = typeof item.product === 'object' ? item.product.title : `ID ${item.product}`
        return (
          <div key={idx} style={{ marginBottom: idx < data.length - 1 ? '4px' : 0 }}>
            {productName} — {item.quantity}
          </div>
        )
      })}
    </div>
  )
}
