'use client'

import React from 'react'

/**
 * List-view Cell for boolean (checkbox) fields. Shows a green check when
 * truthy and nothing when falsy / empty -- much cleaner than Payload's
 * default "Правда / Ложь" labels in dense product tables.
 */
const BoolCheckCell: React.FC<{ cellData?: unknown }> = ({ cellData }) => {
  const isTruthy = cellData === true || cellData === 'true' || cellData === 1
  if (!isTruthy) {
    return <span style={{ color: '#d1d5db' }}>—</span>
  }
  return (
    <span
      aria-label="Да"
      title="Да"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 20,
        height: 20,
        borderRadius: '50%',
        background: '#22c55e',
        color: '#fff',
        fontSize: 12,
        fontWeight: 700,
        lineHeight: 1,
      }}
    >
      ✓
    </span>
  )
}

export default BoolCheckCell
