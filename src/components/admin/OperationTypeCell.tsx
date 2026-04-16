'use client'

import React from 'react'

interface OperationTypeCellProps {
  data: string
}

const typeLabels: Record<string, string> = {
  produced: '🟢 Произведено',
  sent_to_logistics: '🔵 Отправлено в СДЭК',
  received_at_logistics: '✅ Принято в СДЭК',
  shipped_to_customers: '📦 Отправлено клиентам',
  retail_shipment: '🏪 Реализация',
  employee_issue: '👤 Выдача сотруднику',
  write_off: '❌ Списание',
  return_to_stock: '📥 Возврат на склад',
  inventory_adjustment: '📋 Корректировка',
}

export const OperationTypeCell: React.FC<OperationTypeCellProps> = ({ data }) => {
  return <span>{typeLabels[data] || '—'}</span>
}
