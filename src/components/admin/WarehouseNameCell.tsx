'use client'

import React, { useMemo } from 'react'
import { useRelationshipTitles } from './useRelationshipTitles'

const WarehouseNameCell: React.FC<{ cellData?: unknown }> = ({ cellData }) => {
  const id = useMemo(() => {
    if (cellData === null || cellData === undefined || cellData === '') return null
    if (typeof cellData === 'object') {
      const obj = cellData as any
      return obj?.id !== undefined ? String(obj.id) : null
    }
    return String(cellData)
  }, [cellData])

  const titles = useRelationshipTitles('warehouses', id ? [id] : [])

  if (!id) return null

  // If cellData is an object already (populated), prefer it
  if (typeof cellData === 'object' && cellData !== null) {
    const obj = cellData as any
    const label = obj.name || obj.title || titles[id] || id
    return <span>{label}</span>
  }

  const label = titles[id] || ''
  if (!label) {
    // Not loaded yet — show placeholder that won't stay as ID forever
    return <span style={{ color: 'var(--theme-elevation-400, #999)' }}>…</span>
  }
  return <span>{label}</span>
}

export default WarehouseNameCell
