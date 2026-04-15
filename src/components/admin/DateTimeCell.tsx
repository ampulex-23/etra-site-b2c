'use client'

import React from 'react'

export const DateTimeCell: React.FC<{ value?: string | null }> = ({ value }) => {
  if (!value) {
    return <span style={{ color: '#999' }}>—</span>
  }
  
  const date = new Date(value)
  const formatted = date.toLocaleString('ru-RU', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).replace(/(\d{2})\.(\d{2})\.(\d{4}), (\d{2}):(\d{2})/, '$3-$2-$1 $4:$5')
  
  return <span>{formatted}</span>
}
