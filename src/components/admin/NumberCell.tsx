'use client'

import React from 'react'

export const NumberCell: React.FC<{ value?: number | null }> = ({ value }) => {
  if (value === null || value === undefined) {
    return <span style={{ color: '#999' }}>—</span>
  }
  return <span>{value}</span>
}
