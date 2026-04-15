import type { CollectionConfig } from 'payload'

export const StockLevels: CollectionConfig = {
  slug: 'stock-levels',
  labels: {
    singular: 'Остаток',
    plural: 'Остатки',
  },
  admin: {
    useAsTitle: 'product',
    defaultColumns: ['product', 'warehouse', 'calculated', 'actual', 'reserved', 'inTransit', 'available', 'updatedAt'],
    group: 'Склад',
    description: 'Текущие остатки товаров по складам',
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
        components: {
          Cell: '@/components/admin/NumberCell#NumberCell',
        },
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
        date: {
          displayFormat: 'yyyy-MM-dd',
        },
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
