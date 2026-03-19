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
    group: 'Магазин',
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
          admin: {
            components: {
              Field: '@/components/admin/AddressAutocomplete',
            },
          },
        },
        {
          name: 'street',
          type: 'text',
          label: 'Улица, дом',
          admin: {
            components: {
              Field: '@/components/admin/AddressAutocomplete',
            },
          },
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
      name: 'telegram',
      type: 'group',
      label: 'Telegram',
      admin: {
        description: 'Данные из Telegram (заполняются автоматически при авторизации или импорте)',
      },
      fields: [
        {
          name: 'chatId',
          type: 'text',
          unique: true,
          label: 'Chat ID (Telegram ID)',
          admin: { readOnly: true },
        },
        {
          name: 'username',
          type: 'text',
          label: 'Username',
          admin: { readOnly: true },
        },
        {
          name: 'firstName',
          type: 'text',
          label: 'Имя в Telegram',
          admin: { readOnly: true },
        },
        {
          name: 'lastName',
          type: 'text',
          label: 'Фамилия в Telegram',
          admin: { readOnly: true },
        },
        {
          name: 'phone',
          type: 'text',
          label: 'Телефон из Telegram',
          admin: { readOnly: true },
        },
        {
          name: 'photoUrl',
          type: 'text',
          label: 'Фото профиля (URL)',
          admin: { readOnly: true },
        },
      ],
    },
    {
      name: 'source',
      type: 'select',
      defaultValue: 'site',
      label: 'Источник',
      options: [
        { label: 'Сайт', value: 'site' },
        { label: 'Telegram-бот', value: 'telegram_bot' },
        { label: 'Импорт', value: 'import' },
        { label: 'amoCRM', value: 'amocrm' },
      ],
      admin: { position: 'sidebar' },
    },
    {
      name: 'puzzleBotId',
      type: 'text',
      label: 'ID в PuzzleBot',
      admin: {
        position: 'sidebar',
        readOnly: true,
        description: 'Внутренний ID пользователя из PuzzleBot',
      },
    },
    {
      name: 'importedAt',
      type: 'date',
      label: 'Дата импорта',
      admin: {
        position: 'sidebar',
        readOnly: true,
      },
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
