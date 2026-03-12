import type { CollectionConfig } from 'payload'

export const StockLevels: CollectionConfig = {
  slug: 'stock-levels',
  labels: {
    singular: 'Остаток',
    plural: 'Остатки',
  },
  admin: {
    useAsTitle: 'product',
    defaultColumns: ['product', 'warehouse', 'calculated', 'actual', 'reserved', 'updatedAt'],
    group: '🏭 Склад',
    description: 'Текущие остатки товаров по складам',
  },
  access: {
    read: ({ req: { user } }) => Boolean(user),
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
      name: 'warehouse',
      type: 'relationship',
      relationTo: 'warehouses',
      required: true,
      label: 'Склад',
    },
    {
      name: 'calculated',
      type: 'number',
      required: true,
      defaultValue: 0,
      label: 'Расчётный остаток',
      admin: {
        description: 'Автоматически рассчитывается из журнала движений',
      },
    },
    {
      name: 'actual',
      type: 'number',
      label: 'Фактический остаток',
      admin: {
        description: 'Заполняется вручную при инвентаризации',
      },
    },
    {
      name: 'reserved',
      type: 'number',
      defaultValue: 0,
      label: 'Зарезервировано',
      admin: {
        description: 'Товар, зарезервированный под заказы',
      },
    },
    {
      name: 'inTransit',
      type: 'number',
      defaultValue: 0,
      label: 'В транзите',
      admin: {
        description: 'Товар в пути между складами',
      },
    },
    {
      name: 'available',
      type: 'number',
      defaultValue: 0,
      label: 'Доступно',
      admin: {
        description: 'calculated - reserved - inTransit',
        readOnly: true,
      },
    },
    {
      name: 'lastInventoryDate',
      type: 'date',
      label: 'Последняя инвентаризация',
      admin: {
        readOnly: true,
        position: 'sidebar',
      },
    },
    {
      name: 'discrepancy',
      type: 'number',
      label: 'Расхождение',
      admin: {
        description: 'actual - calculated (заполняется при инвентаризации)',
        readOnly: true,
        position: 'sidebar',
      },
    },
  ],
}
