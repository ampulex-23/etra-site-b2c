import type { CollectionConfig } from 'payload'

export const MLMInvitations: CollectionConfig = {
  slug: 'mlm-invitations',
  labels: {
    singular: 'Инвайт МЛМ',
    plural: 'Инвайты МЛМ',
  },
  admin: {
    useAsTitle: 'code',
    defaultColumns: ['code', 'issuedBy', 'status', 'usedBy', 'expiresAt'],
    group: 'Рефералка',
  },
  access: {
    read: ({ req: { user } }) => {
      if (!user) return false
      if (user.collection === 'users') return true
      return { issuedByCustomer: { equals: user.id } } as any
    },
    create: ({ req: { user } }) => Boolean(user),
    update: ({ req: { user } }) => Boolean(user && user.collection === 'users'),
    delete: ({ req: { user } }) => Boolean(user && user.collection === 'users'),
  },
  fields: [
    {
      name: 'code',
      type: 'text',
      required: true,
      unique: true,
      label: 'Инвайт-код',
    },
    {
      name: 'issuedBy',
      type: 'relationship',
      relationTo: 'referral-partners',
      required: true,
      label: 'Выпустил (партнёр)',
    },
    {
      name: 'issuedByCustomer',
      type: 'relationship',
      relationTo: 'customers',
      label: 'Выпустил (клиент)',
      admin: {
        readOnly: true,
        description: 'Денормализация для фильтрации доступа',
      },
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'active',
      label: 'Статус',
      options: [
        { label: 'Активен', value: 'active' },
        { label: 'Использован', value: 'used' },
        { label: 'Просрочен', value: 'expired' },
        { label: 'Отозван', value: 'revoked' },
      ],
      admin: { position: 'sidebar' },
    },
    {
      name: 'usedBy',
      type: 'relationship',
      relationTo: 'customers',
      label: 'Использован клиентом',
      admin: { readOnly: true },
    },
    {
      name: 'usedAt',
      type: 'date',
      label: 'Дата использования',
      admin: {
        readOnly: true,
        date: { pickerAppearance: 'dayAndTime', displayFormat: 'yyyy-MM-dd HH:mm' },
      },
    },
    {
      name: 'expiresAt',
      type: 'date',
      label: 'Действителен до',
      admin: {
        date: { pickerAppearance: 'dayAndTime', displayFormat: 'yyyy-MM-dd HH:mm' },
      },
    },
    {
      name: 'note',
      type: 'textarea',
      label: 'Заметка',
      admin: { description: 'Для кого выпущен (имя, контакт)' },
    },
  ],
}
