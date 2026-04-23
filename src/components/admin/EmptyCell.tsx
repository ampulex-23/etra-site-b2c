'use client'

import React from 'react'

/**
 * Nothing-fancy text cell for the admin list view.
 *
 * Payload's default cell renderer shows the string "Без метки" ("No label")
 * when a text/relationship field is empty — which is very noisy in the
 * Клиенты list for fields like telegram.username that most customers
 * don't have. This component simply renders an em dash for empty values
 * instead of the default label.
 */
export const EmptyCell: React.FC<{ cellData?: unknown }> = ({ cellData }) => {
  const value =
    cellData === null || cellData === undefined || cellData === ''
      ? null
      : String(cellData)
  if (value === null) {
    return <span style={{ color: '#bbb' }}>—</span>
  }
  return <span>{value}</span>
}

export default EmptyCell
