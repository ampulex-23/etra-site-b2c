import type { CollectionConfig } from 'payload'

export const Customers: CollectionConfig = {
  slug: 'customers',
  auth: true,
  labels: {
    singular: 'Клиент',
    plural: 'Клиенты',
  },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'email', 'phone', 'role'],
    group: '🛒 Магазин',
  },
  access: {
    admin: ({ req: { user } }) => {
      if (!user) return false
      return user.collection === 'users'
    },
    read: ({ req: { user } }) => {
      if (!user) return false
      if (user.collection === 'users') return true
      return { id: { equals: user.id } }
    },
    create: ({ req: { user } }) => {
      if (!user) return false
      return true
    },
    update: ({ req: { user } }) => {
      if (!user) return false
      if (user.collection === 'users') return true
      return { id: { equals: user.id } }
    },
    delete: ({ req: { user } }) => {
      if (!user) return false
      return user.collection === 'users'
    },
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      label: 'Имя',
    },
    {
      name: 'phone',
      type: 'text',
      label: 'Телефон',
    },
    {
      name: 'avatar',
      type: 'upload',
      relationTo: 'media',
      label: 'Аватар',
    },
    {
      name: 'addresses',
      type: 'array',
      label: 'Адреса',
      fields: [
        {
          name: 'title',
          type: 'text',
          label: 'Название (дом, работа...)',
        },
        {
          name: 'city',
          type: 'text',
          label: 'Город',
        },
        {
          name: 'street',
          type: 'text',
          label: 'Улица, дом',
        },
        {
          name: 'apartment',
          type: 'text',
          label: 'Квартира / офис',
        },
        {
          name: 'zip',
          type: 'text',
          label: 'Индекс',
        },
      ],
    },
    {
      name: 'role',
      type: 'select',
      defaultValue: 'customer',
      label: 'Роль',
      options: [
        { label: 'Клиент', value: 'customer' },
        { label: 'VIP', value: 'vip' },
        { label: 'Заблокирован', value: 'blocked' },
      ],
      admin: { position: 'sidebar' },
    },
    {
      name: 'amoCrmContactId',
      type: 'number',
      label: 'ID контакта в amoCRM',
      admin: { position: 'sidebar', readOnly: true },
    },
    {
      name: 'bonusBalance',
      type: 'number',
      defaultValue: 0,
      min: 0,
      label: 'Бонусный баланс',
      admin: { position: 'sidebar' },
    },
    {
      name: 'favorites',
      type: 'relationship',
      relationTo: 'products',
      hasMany: true,
      label: 'Избранное',
    },
    {
      name: 'telegramId',
      type: 'text',
      unique: true,
      label: 'Telegram ID',
      admin: { position: 'sidebar', readOnly: true },
    },
    {
      name: 'telegramUsername',
      type: 'text',
      label: 'Telegram Username',
      admin: { position: 'sidebar', readOnly: true },
    },
    {
      name: 'emailVerified',
      type: 'checkbox',
      defaultValue: false,
      label: 'Email подтверждён',
      admin: { position: 'sidebar' },
    },
  ],
}
