import type { CollectionConfig } from 'payload'

export const ReferralPayouts: CollectionConfig = {
  slug: 'referral-payouts',
  labels: {
    singular: 'Выплата',
    plural: 'Выплаты',
  },
  admin: {
    useAsTitle: 'id',
    defaultColumns: ['partner', 'amount', 'method', 'status', 'requestedAt', 'paidAt'],
    group: 'Рефералка',
  },
  access: {
    read: ({ req: { user } }) => {
      if (!user) return false
      if (user.collection === 'users') return true
      return { partnerCustomer: { equals: user.id } } as any
    },
    create: ({ req: { user } }) => Boolean(user),
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
      name: 'partnerCustomer',
      type: 'relationship',
      relationTo: 'customers',
      label: 'Клиент-партнёр',
      admin: {
        readOnly: true,
        description: 'Денормализованная ссылка (= customer у partner)',
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
      name: 'method',
      type: 'select',
      required: true,
      label: 'Метод выплаты',
      options: [
        { label: 'Банковская карта', value: 'bank_card' },
        { label: 'СБП (по телефону)', value: 'sbp' },
        { label: 'Самозанятый (через сервис)', value: 'self_employed_service' },
        { label: 'Кооперативная выплата (через ЦК)', value: 'cooperative_payout' },
        { label: 'На баланс (пополнение)', value: 'balance_credit' },
      ],
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'requested',
      label: 'Статус',
      options: [
        { label: 'Запрошена', value: 'requested' },
        { label: 'Одобрена', value: 'approved' },
        { label: 'В обработке', value: 'processing' },
        { label: 'Выплачена', value: 'paid' },
        { label: 'Отклонена', value: 'rejected' },
      ],
      admin: { position: 'sidebar' },
    },
    {
      name: 'paymentDetails',
      type: 'group',
      label: 'Реквизиты',
      fields: [
        {
          name: 'cardNumber',
          type: 'text',
          label: 'Номер карты (последние 4)',
          admin: {
            condition: (_, sibling) => sibling?.method === 'bank_card',
          },
        },
        {
          name: 'bankName',
          type: 'text',
          label: 'Банк',
          admin: {
            condition: (_, sibling) => sibling?.method === 'bank_card' || sibling?.method === 'sbp',
          },
        },
        {
          name: 'phone',
          type: 'text',
          label: 'Телефон (для СБП)',
          admin: {
            condition: (_, sibling) => sibling?.method === 'sbp',
          },
        },
        {
          name: 'recipientFullName',
          type: 'text',
          label: 'ФИО получателя',
        },
        {
          name: 'inn',
          type: 'text',
          label: 'ИНН (для самозанятого)',
          admin: {
            condition: (_, sibling) => sibling?.method === 'self_employed_service',
          },
        },
      ],
    },
    {
      name: 'requestedAt',
      type: 'date',
      label: 'Дата заявки',
      admin: {
        position: 'sidebar',
        readOnly: true,
        date: { pickerAppearance: 'dayAndTime', displayFormat: 'yyyy-MM-dd HH:mm' },
      },
    },
    {
      name: 'approvedAt',
      type: 'date',
      label: 'Дата одобрения',
      admin: {
        position: 'sidebar',
        readOnly: true,
        date: { pickerAppearance: 'dayAndTime', displayFormat: 'yyyy-MM-dd HH:mm' },
      },
    },
    {
      name: 'paidAt',
      type: 'date',
      label: 'Дата выплаты',
      admin: {
        position: 'sidebar',
        readOnly: true,
        date: { pickerAppearance: 'dayAndTime', displayFormat: 'yyyy-MM-dd HH:mm' },
      },
    },
    {
      name: 'externalTxId',
      type: 'text',
      label: 'ID внешней транзакции',
      admin: {
        description: 'ID в банке/СБП/сервисе/ЦК',
      },
    },
    {
      name: 'includedCommissions',
      type: 'relationship',
      relationTo: 'commissions',
      hasMany: true,
      label: 'Включённые начисления',
      admin: {
        description: 'Какие комиссии входят в эту выплату',
      },
    },
    {
      name: 'rejectReason',
      type: 'textarea',
      label: 'Причина отказа',
      admin: {
        condition: (data) => data?.status === 'rejected',
      },
    },
    {
      name: 'adminNotes',
      type: 'textarea',
      label: 'Заметки администратора',
    },
    // ======= ПОДГОТОВКА К ЦК =======
    {
      name: 'cooperativeDocumentId',
      type: 'text',
      label: 'ID документа в ЦК',
      admin: {
        position: 'sidebar',
        readOnly: true,
        description: 'ID акта распределения в Цифровом Кооперативе',
      },
    },
    {
      name: 'cooperativeBlockchainHash',
      type: 'text',
      label: 'Хэш в блокчейне',
      admin: {
        position: 'sidebar',
        readOnly: true,
      },
    },
  ],
  hooks: {
    beforeChange: [
      ({ data, operation }) => {
        if (operation === 'create' && !data.requestedAt) {
          data.requestedAt = new Date().toISOString()
        }
        if (data.status === 'approved' && !data.approvedAt) {
          data.approvedAt = new Date().toISOString()
        }
        if (data.status === 'paid' && !data.paidAt) {
          data.paidAt = new Date().toISOString()
        }
        return data
      },
    ],
  },
}
