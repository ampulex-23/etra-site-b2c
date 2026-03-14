import type { CollectionConfig } from 'payload'

export const Users: CollectionConfig = {
  slug: 'users',
  labels: {
    singular: 'Пользователь',
    plural: 'Пользователи',
  },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'email', 'role', 'active'],
    group: '⚙️ Система',
  },
  auth: true,
  access: {
    read: ({ req: { user } }) => Boolean(user),
    create: ({ req: { user } }) => {
      if (!user) return false
      return (user as any).role === 'admin'
    },
    update: ({ req: { user } }) => {
      if (!user) return false
      if ((user as any).role === 'admin') return true
      return { id: { equals: user.id } }
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
      label: 'Имя',
    },
    {
      name: 'role',
      type: 'select',
      required: true,
      defaultValue: 'manager',
      label: 'Роль',
      options: [
        { label: 'Администратор', value: 'admin' },
        { label: 'Менеджер', value: 'manager' },
        { label: 'Кладовщик', value: 'warehouse' },
        { label: 'Контент-менеджер', value: 'content' },
      ],
      admin: {
        position: 'sidebar',
        description: 'Администратор — полный доступ. Менеджер — заказы, клиенты, каталог. Кладовщик — склад. Контент — статьи, рецепты, лендинг.',
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
      name: 'phone',
      type: 'text',
      label: 'Телефон',
    },
    {
      name: 'position',
      type: 'text',
      label: 'Должность',
    },
  ],
}
