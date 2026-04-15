import type { CollectionConfig } from 'payload'
import { stockMovementAfterChange } from '../hooks/stockMovementAfterChange'

export const StockMovements: CollectionConfig = {
  slug: 'stock-movements',
  labels: {
    singular: 'Движение товара',
    plural: 'Движения товаров',
  },
  hooks: {
    afterChange: [stockMovementAfterChange],
  },
  admin: {
    useAsTitle: 'operationType',
    defaultColumns: ['operationType', 'warehouse', 'status', 'operator', 'createdAt'],
    group: 'Склад',
    description: 'Журнал всех операций: производство, перемещение, отправка, списание',
  },
  access: {
    read: () => true,
    create: ({ req: { user } }) => {
      if (!user) return false
      const role = (user as any).role
      return role === 'admin' || role === 'manager' || role === 'warehouse'
    },
    update: ({ req: { user } }) => {
      if (!user) return false
      const role = (user as any).role
      return role === 'admin' || role === 'warehouse'
    },
    delete: ({ req: { user } }) => {
      if (!user) return false
      return (user as any).role === 'admin'
    },
  },
  fields: [
    {
      name: 'operationType',
      type: 'select',
      required: true,
      label: 'Тип операции',
      options: [
        { label: '🟢 Произведено', value: 'produced' },
        { label: '🔵 Отправлено в СДЭК', value: 'sent_to_logistics' },
        { label: '✅ Принято в СДЭК', value: 'received_at_logistics' },
        { label: '📦 Отправлено клиентам', value: 'shipped_to_customers' },
        { label: '🏪 Реализация (точка продаж)', value: 'retail_shipment' },
        { label: '👤 Выдача сотруднику', value: 'employee_issue' },
        { label: '❌ Списание (утрата/брак)', value: 'write_off' },
        { label: '📥 Возврат на склад', value: 'return_to_stock' },
        { label: '📋 Корректировка (инвентаризация)', value: 'inventory_adjustment' },
      ],
    },
    {
      name: 'items',
      type: 'array',
      required: true,
      minRows: 1,
      label: 'Товары',
      labels: { singular: 'Позиция', plural: 'Позиции' },
      admin: {
        description: 'Товары и количество для этой операции. Наборы раскладываются автоматически.',
      },
      fields: [
        {
          name: 'product',
          type: 'relationship',
          relationTo: 'products',
          required: true,
          label: 'Товар',
        },
        {
          name: 'quantity',
          type: 'number',
          required: true,
          min: 1,
          defaultValue: 1,
          label: 'Количество',
        },
      ],
    },
    {
      name: 'warehouse',
      type: 'relationship',
      relationTo: 'warehouses',
      required: true,
      label: 'Склад',
      admin: {
        description: 'Склад, на котором выполняется операция',
      },
    },
    {
      name: 'targetWarehouse',
      type: 'relationship',
      relationTo: 'warehouses',
      label: 'Целевой склад',
      admin: {
        description: 'Только для перемещений — куда отправляется товар',
        condition: (data) =>
          data?.operationType === 'sent_to_logistics' ||
          data?.operationType === 'return_to_stock',
      },
    },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'completed',
      label: 'Статус операции',
      options: [
        { label: 'Выполнена', value: 'completed' },
        { label: 'В транзите', value: 'in_transit' },
        { label: 'Отменена', value: 'cancelled' },
      ],
      admin: { position: 'sidebar' },
    },
    {
      name: 'operator',
      type: 'relationship',
      relationTo: 'users',
      label: 'Кто выполнил',
      admin: { position: 'sidebar' },
    },
    {
      name: 'order',
      type: 'relationship',
      relationTo: 'orders',
      label: 'Связанный заказ',
      admin: {
        description: 'Если операция связана с конкретным заказом',
      },
    },
    {
      name: 'bundle',
      type: 'relationship',
      relationTo: 'products',
      label: 'Исходный набор',
      admin: {
        description: 'Если товар был автоматически разложен из набора',
        readOnly: true,
      },
    },
    {
      name: 'retailPoint',
      type: 'text',
      label: 'Точка реализации',
      admin: {
        description: 'Например: Гранат, ярмарка и т.д.',
        condition: (data) => data?.operationType === 'retail_shipment',
      },
    },
    {
      name: 'employeeName',
      type: 'text',
      label: 'Сотрудник (получатель)',
      admin: {
        condition: (data) => data?.operationType === 'employee_issue',
      },
    },
    {
      name: 'reason',
      type: 'textarea',
      label: 'Причина / комментарий',
      admin: {
        description: 'Причина списания, примечание к операции',
      },
    },
    {
      name: 'date',
      type: 'date',
      required: true,
      label: 'Дата операции',
      defaultValue: () => new Date().toISOString(),
      admin: {
        position: 'sidebar',
        date: {
          displayFormat: 'yyyy-MM-dd',
        },
      },
    },
  ],
}
