import type { CollectionConfig } from 'payload'

export const Commissions: CollectionConfig = {
  slug: 'commissions',
  labels: {
    singular: 'Начисление',
    plural: 'Начисления',
  },
  admin: {
    useAsTitle: 'id',
    defaultColumns: ['recipient', 'type', 'amount', 'status', 'month', 'createdAt'],
    group: 'Рефералка',
    description: 'Все комиссии партнёров (рефералка + МЛМ)',
  },
  access: {
    read: ({ req: { user } }) => {
      if (!user) return false
      if (user.collection === 'users') return true
      return { 'recipientCustomer': { equals: user.id } } as any
    },
    create: ({ req: { user } }) => Boolean(user && user.collection === 'users'),
    update: ({ req: { user } }) => Boolean(user && user.collection === 'users'),
    delete: ({ req: { user } }) => Boolean(user && user.collection === 'users'),
  },
  fields: [
    {
      name: 'recipient',
      type: 'relationship',
      relationTo: 'referral-partners',
      required: true,
      label: 'Получатель (партнёр)',
    },
    {
      name: 'recipientCustomer',
      type: 'relationship',
      relationTo: 'customers',
      label: 'Получатель (клиент)',
      admin: {
        readOnly: true,
        description: 'Денормализованная ссылка для удобства фильтрации (= customer у partner)',
      },
    },
    {
      name: 'order',
      type: 'relationship',
      relationTo: 'orders',
      required: true,
      label: 'Заказ-источник',
    },
    {
      name: 'buyer',
      type: 'relationship',
      relationTo: 'customers',
      required: true,
      label: 'Покупатель',
    },
    {
      name: 'type',
      type: 'select',
      required: true,
      label: 'Тип начисления',
      options: [
        { label: '🟢 Рефералка — первая покупка', value: 'referral_first' },
        { label: '🔵 Рефералка — повторная', value: 'referral_repeat' },
        { label: '1️⃣ МЛМ — уровень 1', value: 'mlm_level_1' },
        { label: '2️⃣ МЛМ — уровень 2', value: 'mlm_level_2' },
        { label: '3️⃣ МЛМ — уровень 3', value: 'mlm_level_3' },
        { label: '💎 Командный бонус', value: 'team_bonus' },
        { label: '🎯 Фонд маркетинга', value: 'marketing_fund' },
      ],
      admin: { position: 'sidebar' },
    },
    {
      name: 'percent',
      type: 'number',
      required: true,
      min: 0,
      label: 'Процент (%)',
    },
    {
      name: 'baseAmount',
      type: 'number',
      required: true,
      min: 0,
      label: 'База для расчёта (₽)',
      admin: {
        description: 'Сумма, от которой считается процент (обычно = сумма заказа)',
      },
    },
    {
      name: 'amount',
      type: 'number',
      required: true,
      min: 0,
      label: 'Сумма (₽)',
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'pending',
      label: 'Статус',
      options: [
        { label: 'Ожидает проверки', value: 'pending' },
        { label: 'Подтверждено', value: 'approved' },
        { label: 'Выплачено', value: 'paid' },
        { label: 'Отменено', value: 'cancelled' },
      ],
      admin: { position: 'sidebar' },
    },
    {
      name: 'month',
      type: 'text',
      required: true,
      label: 'Месяц (YYYY-MM)',
      index: true,
      admin: {
        readOnly: true,
        description: 'Для агрегации оборотов по месяцам',
      },
    },
    {
      name: 'triggeringPayment',
      type: 'relationship',
      relationTo: 'payments',
      label: 'Платёж-источник',
      admin: {
        position: 'sidebar',
        readOnly: true,
        description: 'Конкретный платёж, при оплате которого создана эта комиссия (для заказов с несколькими платежами из-за докомплектации)',
      },
    },
    {
      name: 'payout',
      type: 'relationship',
      relationTo: 'referral-payouts',
      label: 'Выплата',
      admin: {
        position: 'sidebar',
        readOnly: true,
        description: 'Заполняется при включении в пакет выплаты',
      },
    },
    {
      name: 'notes',
      type: 'textarea',
      label: 'Заметки',
    },
  ],
}
