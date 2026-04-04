import type { CollectionConfig } from 'payload'

export const Referrals: CollectionConfig = {
  slug: 'referrals',
  labels: {
    singular: 'Реферал',
    plural: 'Рефералы',
  },
  admin: {
    useAsTitle: 'id',
    defaultColumns: ['referrer', 'referred', 'order', 'pointsAwarded', 'createdAt'],
    group: 'Магазин',
  },
  access: {
    read: ({ req: { user } }) => {
      if (!user) return false
      if (user.collection === 'users') return true
      return { referrer: { equals: user.id } }
    },
    create: ({ req: { user } }) => Boolean(user),
    update: ({ req: { user } }) => {
      if (!user) return false
      return user.collection === 'users'
    },
    delete: ({ req: { user } }) => {
      if (!user) return false
      return user.collection === 'users'
    },
  },
  fields: [
    {
      name: 'referrer',
      type: 'relationship',
      relationTo: 'customers',
      required: true,
      label: 'Реферер (источник ссылки)',
      admin: {
        description: 'Клиент, который поделился ссылкой',
      },
    },
    {
      name: 'referred',
      type: 'relationship',
      relationTo: 'customers',
      label: 'Приглашённый клиент',
      admin: {
        description: 'Клиент, который перешёл по ссылке и зарегистрировался',
      },
    },
    {
      name: 'order',
      type: 'relationship',
      relationTo: 'orders',
      label: 'Заказ',
      admin: {
        description: 'Заказ, оформленный по реферальной ссылке',
      },
    },
    {
      name: 'product',
      type: 'relationship',
      relationTo: 'products',
      label: 'Товар',
      admin: {
        description: 'Товар, на который была ссылка',
      },
    },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'click',
      label: 'Статус',
      options: [
        { label: 'Клик', value: 'click' },
        { label: 'Регистрация', value: 'registration' },
        { label: 'Заказ оформлен', value: 'order_placed' },
        { label: 'Заказ оплачен', value: 'order_paid' },
        { label: 'Очки начислены', value: 'points_awarded' },
      ],
      admin: { position: 'sidebar' },
    },
    {
      name: 'pointsAwarded',
      type: 'number',
      defaultValue: 0,
      min: 0,
      label: 'Начислено очков',
      admin: { position: 'sidebar' },
    },
    {
      name: 'orderTotal',
      type: 'number',
      min: 0,
      label: 'Сумма заказа',
      admin: {
        readOnly: true,
        description: 'Сумма заказа на момент оформления',
      },
    },
    {
      name: 'source',
      type: 'select',
      label: 'Источник перехода',
      options: [
        { label: 'Telegram', value: 'telegram' },
        { label: 'Instagram', value: 'instagram' },
        { label: 'ВКонтакте', value: 'vk' },
        { label: 'WhatsApp', value: 'whatsapp' },
        { label: 'Прямая ссылка', value: 'direct' },
        { label: 'Другое', value: 'other' },
      ],
      admin: { position: 'sidebar' },
    },
    {
      name: 'ipAddress',
      type: 'text',
      label: 'IP адрес',
      admin: {
        readOnly: true,
        position: 'sidebar',
      },
    },
    {
      name: 'userAgent',
      type: 'text',
      label: 'User Agent',
      admin: {
        readOnly: true,
      },
    },
  ],
}
