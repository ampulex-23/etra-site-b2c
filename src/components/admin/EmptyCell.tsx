'use client'

import React from 'react'

/**
 * Nothing-fancy cell for the admin list view.
 *
 * Payload's default cell renderer shows the string "Без метки" ("No label")
 * when a text/relationship field is empty — which is very noisy in lists.
 * This component renders an empty cell for nullish/empty values and
 * extracts a sensible label from relationship objects when populated.
 */
export const EmptyCell: React.FC<{ cellData?: unknown }> = ({ cellData }) => {
  if (cellData === null || cellData === undefined || cellData === '') {
    return null
  }
  if (typeof cellData === 'object') {
    const obj = cellData as Record<string, unknown>
    const label =
      (obj.name as string | undefined) ||
      (obj.title as string | undefined) ||
      (obj.username as string | undefined) ||
      (obj.email as string | undefined) ||
      (obj.id !== undefined ? String(obj.id) : '')
    if (!label) return null
    return <span>{label}</span>
  }
  return <span>{String(cellData)}</span>
}

export default EmptyCell
