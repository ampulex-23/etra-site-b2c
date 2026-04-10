import type { CollectionConfig } from 'payload'

export const Warehouses: CollectionConfig = {
  slug: 'warehouses',
  labels: {
    singular: 'Склад',
    plural: 'Склады',
  },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'type', 'responsible', 'active'],
    group: 'Склад',
  },
  access: {
    read: () => true,
    create: ({ req: { user } }) => {
      if (!user) return false
      const role = (user as any).role
      return role === 'admin' || role === 'warehouse'
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
      name: 'name',
      type: 'text',
      required: true,
      label: 'Название',
      admin: {
        description: 'Например: Склад производства, Склад СДЭК',
      },
    },
    {
      name: 'type',
      type: 'select',
      required: true,
      label: 'Тип склада',
      options: [
        { label: 'Производство', value: 'production' },
        { label: 'Логистика (СДЭК)', value: 'logistics' },
        { label: 'Розница', value: 'retail' },
      ],
      admin: { position: 'sidebar' },
    },
    {
      name: 'responsible',
      type: 'relationship',
      relationTo: 'users',
      label: 'Ответственный',
      admin: {
        description: 'Сотрудник, ответственный за склад',
      },
    },
    {
      name: 'address',
      type: 'textarea',
      label: 'Адрес',
      admin: {
        components: {
          Field: '@/components/admin/AddressAutocomplete',
        },
      },
    },
    {
      name: 'active',
      type: 'checkbox',
      defaultValue: true,
      label: 'Активен',
      admin: { position: 'sidebar' },
    },
    {
      name: 'notes',
      type: 'textarea',
      label: 'Примечание',
    },
  ],
}
