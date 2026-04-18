import type { CollectionConfig } from 'payload'

export const ReferralEvents: CollectionConfig = {
  slug: 'referral-events',
  labels: {
    singular: 'Событие рефералки',
    plural: 'События рефералки',
  },
  admin: {
    useAsTitle: 'id',
    defaultColumns: ['partner', 'eventType', 'customer', 'order', 'createdAt'],
    group: 'Рефералка',
    description: 'Журнал событий: клики, регистрации, использование промокодов',
  },
  access: {
    read: ({ req: { user } }) => Boolean(user && user.collection === 'users'),
    create: () => true,
    update: ({ req: { user } }) => Boolean(user && user.collection === 'users'),
    delete: ({ req: { user } }) => Boolean(user && user.collection === 'users'),
  },
  fields: [
    {
      name: 'partner',
      type: 'relationship',
      relationTo: 'referral-partners',
      required: true,
      label: 'Партнёр',
    },
    {
      name: 'eventType',
      type: 'select',
      required: true,
      label: 'Тип события',
      options: [
        { label: 'Клик по ссылке', value: 'click' },
        { label: 'Применён промокод', value: 'promo_applied' },
        { label: 'Регистрация', value: 'registration' },
        { label: 'Привязка к партнёру', value: 'attribution' },
        { label: 'Заказ оформлен', value: 'order_placed' },
      ],
    },
    {
      name: 'customer',
      type: 'relationship',
      relationTo: 'customers',
      label: 'Клиент',
    },
    {
      name: 'order',
      type: 'relationship',
      relationTo: 'orders',
      label: 'Заказ',
    },
    {
      name: 'promoCode',
      type: 'text',
      label: 'Использованный промокод',
    },
    {
      name: 'source',
      type: 'select',
      label: 'Источник',
      options: [
        { label: 'Telegram', value: 'telegram' },
        { label: 'Instagram', value: 'instagram' },
        { label: 'ВКонтакте', value: 'vk' },
        { label: 'WhatsApp', value: 'whatsapp' },
        { label: 'YouTube', value: 'youtube' },
        { label: 'TikTok', value: 'tiktok' },
        { label: 'Прямая ссылка', value: 'direct' },
        { label: 'Другое', value: 'other' },
      ],
      admin: { position: 'sidebar' },
    },
    {
      name: 'ipAddress',
      type: 'text',
      label: 'IP адрес',
      admin: { readOnly: true, position: 'sidebar' },
    },
    {
      name: 'userAgent',
      type: 'text',
      label: 'User Agent',
      admin: { readOnly: true },
    },
    {
      name: 'referer',
      type: 'text',
      label: 'Referer URL',
      admin: { readOnly: true },
    },
  ],
}
