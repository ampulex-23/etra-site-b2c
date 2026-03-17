import type { CollectionConfig } from 'payload'

export const Inventories: CollectionConfig = {
  slug: 'inventories',
  labels: {
    singular: 'Инвентаризация',
    plural: 'Инвентаризации',
  },
  admin: {
    useAsTitle: 'warehouse',
    defaultColumns: ['warehouse', 'status', 'conductor', 'date', 'createdAt'],
    group: 'Склад',
    description: 'Фиксация фактических остатков и расхождений',
  },
  access: {
    read: ({ req: { user } }) => Boolean(user),
  },
  fields: [
    {
      name: 'warehouse',
      type: 'relationship',
      relationTo: 'warehouses',
      required: true,
      label: 'Склад',
    },
    {
      name: 'date',
      type: 'date',
      required: true,
      label: 'Дата инвентаризации',
      defaultValue: () => new Date().toISOString(),
    },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'draft',
      label: 'Статус',
      options: [
        { label: 'Черновик', value: 'draft' },
        { label: 'В процессе', value: 'in_progress' },
        { label: 'Завершена', value: 'completed' },
        { label: 'Отменена', value: 'cancelled' },
      ],
      admin: { position: 'sidebar' },
    },
    {
      name: 'conductor',
      type: 'relationship',
      relationTo: 'users',
      label: 'Проводивший',
      admin: { position: 'sidebar' },
    },
    {
      name: 'items',
      type: 'array',
      required: true,
      label: 'Позиции',
      fields: [
        {
          name: 'product',
          type: 'relationship',
          relationTo: 'products',
          required: true,
          label: 'Товар',
        },
        {
          name: 'calculatedQty',
          type: 'number',
          required: true,
          label: 'Расчётный остаток',
          admin: {
            readOnly: true,
            description: 'Из системы на момент инвентаризации',
          },
        },
        {
          name: 'actualQty',
          type: 'number',
          required: true,
          label: 'Фактический остаток',
          admin: {
            description: 'Посчитанное количество',
          },
        },
        {
          name: 'discrepancy',
          type: 'number',
          label: 'Расхождение',
          admin: {
            readOnly: true,
            description: 'actual - calculated',
          },
        },
        {
          name: 'note',
          type: 'text',
          label: 'Примечание',
        },
      ],
    },
    {
      name: 'notes',
      type: 'textarea',
      label: 'Общий комментарий',
    },
  ],
}
