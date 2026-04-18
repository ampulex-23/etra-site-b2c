import type { CollectionConfig } from 'payload'

export const PartnerApplications: CollectionConfig = {
  slug: 'partner-applications',
  labels: {
    singular: 'Заявка партнёра',
    plural: 'Заявки партнёров',
  },
  admin: {
    useAsTitle: 'contactName',
    defaultColumns: ['contactName', 'applicationType', 'status', 'createdAt'],
    group: 'Рефералка',
    description: 'Заявки от блогеров / клиентов на вступление в реферальную программу',
  },
  access: {
    read: ({ req: { user } }) => Boolean(user && user.collection === 'users'),
    create: () => true,
    update: ({ req: { user } }) => Boolean(user && user.collection === 'users'),
    delete: ({ req: { user } }) => Boolean(user && user.collection === 'users'),
  },
  fields: [
    {
      name: 'applicationType',
      type: 'select',
      required: true,
      label: 'Тип заявки',
      options: [
        { label: 'Клиент-реферал', value: 'client' },
        { label: 'Блогер (с оплатой)', value: 'blogger_paid' },
        { label: 'Блогер (бартер)', value: 'blogger_barter' },
        { label: 'МЛМ-партнёр', value: 'mlm_partner' },
      ],
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'new',
      label: 'Статус',
      options: [
        { label: 'Новая', value: 'new' },
        { label: 'На рассмотрении', value: 'reviewing' },
        { label: 'Одобрена', value: 'approved' },
        { label: 'Отклонена', value: 'rejected' },
      ],
      admin: { position: 'sidebar' },
    },
    {
      name: 'customer',
      type: 'relationship',
      relationTo: 'customers',
      label: 'Существующий клиент',
      admin: {
        description: 'Если заявку подал уже зарегистрированный клиент',
      },
    },
    {
      name: 'createdPartner',
      type: 'relationship',
      relationTo: 'referral-partners',
      label: 'Созданный партнёр',
      admin: {
        readOnly: true,
        description: 'Заполняется после одобрения',
      },
    },
    {
      name: 'contactName',
      type: 'text',
      required: true,
      label: 'Имя',
    },
    {
      name: 'contactEmail',
      type: 'email',
      label: 'Email',
    },
    {
      name: 'contactPhone',
      type: 'text',
      label: 'Телефон',
    },
    {
      name: 'contactTelegram',
      type: 'text',
      label: 'Telegram',
    },
    {
      name: 'socialLinks',
      type: 'array',
      label: 'Соцсети / примеры работ',
      fields: [
        { name: 'url', type: 'text', required: true, label: 'Ссылка' },
        { name: 'description', type: 'text', label: 'Описание' },
      ],
    },
    {
      name: 'avgViews',
      type: 'number',
      min: 0,
      label: 'Средние просмотры',
    },
    {
      name: 'audienceTopic',
      type: 'text',
      label: 'Тематика аудитории',
    },
    {
      name: 'invitationCode',
      type: 'text',
      label: 'Инвайт-код (для МЛМ)',
      admin: {
        condition: (data) => data?.applicationType === 'mlm_partner',
      },
    },
    {
      name: 'message',
      type: 'textarea',
      label: 'Сообщение от заявителя',
    },
    {
      name: 'adminNotes',
      type: 'textarea',
      label: 'Заметки администратора',
    },
    {
      name: 'rejectReason',
      type: 'textarea',
      label: 'Причина отказа',
      admin: {
        condition: (data) => data?.status === 'rejected',
      },
    },
  ],
}
