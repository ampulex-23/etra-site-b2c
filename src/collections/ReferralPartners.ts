import type { CollectionConfig } from 'payload'

export const ReferralPartners: CollectionConfig = {
  slug: 'referral-partners',
  labels: {
    singular: 'Партнёр',
    plural: 'Партнёры',
  },
  admin: {
    useAsTitle: 'promoCode',
    defaultColumns: ['promoCode', 'customer', 'type', 'status', 'balance', 'totalEarned'],
    group: 'Реферальная программа',
  },
  access: {
    read: ({ req: { user } }) => {
      if (!user) return false
      if (user.collection === 'users') return true
      return { customer: { equals: user.id } }
    },
    create: ({ req: { user } }) => Boolean(user && user.collection === 'users'),
    update: ({ req: { user } }) => Boolean(user && user.collection === 'users'),
    delete: ({ req: { user } }) => Boolean(user && user.collection === 'users'),
  },
  fields: [
    {
      name: 'customer',
      type: 'relationship',
      relationTo: 'customers',
      required: true,
      unique: true,
      label: 'Клиент',
    },
    {
      name: 'type',
      type: 'select',
      required: true,
      defaultValue: 'client',
      label: 'Тип партнёра',
      options: [
        { label: '👤 Клиент-реферал', value: 'client' },
        { label: '🎥 Блогер (с оплатой)', value: 'blogger_paid' },
        { label: '🎁 Блогер (бартер)', value: 'blogger_barter' },
        { label: '💼 МЛМ-партнёр', value: 'mlm_partner' },
      ],
      admin: { position: 'sidebar' },
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'active',
      label: 'Статус',
      options: [
        { label: 'На рассмотрении', value: 'pending' },
        { label: 'Активен', value: 'active' },
        { label: 'Приостановлен', value: 'paused' },
        { label: 'Заблокирован', value: 'banned' },
      ],
      admin: { position: 'sidebar' },
    },
    {
      name: 'promoCode',
      type: 'text',
      required: true,
      unique: true,
      label: 'Промокод',
      admin: {
        description: 'Уникальный промокод партнёра (генерируется автоматически)',
      },
    },
    {
      name: 'balance',
      type: 'number',
      defaultValue: 0,
      min: 0,
      label: 'Текущий баланс (₽)',
      admin: { position: 'sidebar', readOnly: true },
    },
    {
      name: 'totalEarned',
      type: 'number',
      defaultValue: 0,
      min: 0,
      label: 'Всего заработано (₽)',
      admin: { position: 'sidebar', readOnly: true },
    },
    {
      name: 'totalPaid',
      type: 'number',
      defaultValue: 0,
      min: 0,
      label: 'Всего выплачено (₽)',
      admin: { position: 'sidebar', readOnly: true },
    },
    // ======= БЛОГЕРСКИЕ ПОЛЯ =======
    {
      type: 'collapsible',
      label: 'Блогер',
      admin: {
        condition: (data) => data?.type === 'blogger_paid' || data?.type === 'blogger_barter',
      },
      fields: [
        {
          name: 'socialLinks',
          type: 'array',
          label: 'Соцсети',
          fields: [
            {
              name: 'platform',
              type: 'select',
              label: 'Платформа',
              options: [
                { label: 'Instagram', value: 'instagram' },
                { label: 'YouTube', value: 'youtube' },
                { label: 'TikTok', value: 'tiktok' },
                { label: 'Telegram', value: 'telegram' },
                { label: 'VK', value: 'vk' },
                { label: 'Другое', value: 'other' },
              ],
            },
            {
              name: 'url',
              type: 'text',
              label: 'Ссылка',
            },
          ],
        },
        {
          name: 'avgViews',
          type: 'number',
          min: 0,
          label: 'Средние просмотры последних роликов',
        },
        {
          name: 'paidPerVideo',
          type: 'number',
          defaultValue: 0,
          min: 0,
          label: 'Оплата за ролик (₽)',
          admin: { description: '0 для бартера' },
        },
        {
          name: 'platform',
          type: 'select',
          label: 'Платформа сотрудничества',
          options: [
            { label: 'Blogerito', value: 'blogerito' },
            { label: 'Unpacks', value: 'unpacks' },
            { label: 'ugc-market.ru', value: 'ugc-market' },
            { label: 'Прямое сотрудничество', value: 'direct' },
          ],
        },
        {
          name: 'marketingFundEligible',
          type: 'checkbox',
          defaultValue: false,
          label: 'В Фонде Маркетинга',
          admin: {
            description: 'Партнёр с высокими охватами получает долю от прибыли',
          },
        },
        {
          name: 'requirements',
          type: 'textarea',
          label: 'Требования к контенту',
        },
      ],
    },
    // ======= МЛМ-ПОЛЯ =======
    {
      type: 'collapsible',
      label: 'МЛМ',
      admin: {
        condition: (data) => data?.type === 'mlm_partner',
      },
      fields: [
        {
          name: 'sponsor',
          type: 'relationship',
          relationTo: 'referral-partners',
          label: 'Спонсор (кто пригласил)',
          admin: {
            description: 'Партнёр вышестоящего уровня',
          },
        },
        {
          name: 'invitationSource',
          type: 'select',
          label: 'Как вошёл в МЛМ',
          options: [
            { label: 'По инвайт-коду', value: 'invite' },
            { label: 'Автоквалификация (60k+)', value: 'auto_qualified' },
            { label: 'Админ вручную', value: 'admin' },
          ],
        },
        {
          name: 'invitationCode',
          type: 'text',
          label: 'Использованный инвайт-код',
          admin: { readOnly: true },
        },
        {
          name: 'entryType',
          type: 'select',
          label: 'Тип входа',
          options: [
            { label: 'Стартовый набор', value: 'starter_kit' },
            { label: 'Свободный порог (7k+)', value: 'free_amount' },
            { label: 'Автоквалификация', value: 'auto' },
          ],
        },
        {
          name: 'entryOrder',
          type: 'relationship',
          relationTo: 'orders',
          label: 'Заказ-триггер',
          admin: { readOnly: true },
        },
        {
          name: 'joinedMLMAt',
          type: 'date',
          label: 'Дата вступления в МЛМ',
          admin: { readOnly: true },
        },
        {
          name: 'partnerPriceEnabled',
          type: 'checkbox',
          defaultValue: true,
          label: 'Доступ к партнёрской цене',
        },
        {
          name: 'cachedLevel1Count',
          type: 'number',
          defaultValue: 0,
          label: 'Партнёров на 1 уровне',
          admin: { readOnly: true },
        },
        {
          name: 'cachedLevel2Count',
          type: 'number',
          defaultValue: 0,
          label: 'Партнёров на 2 уровне',
          admin: { readOnly: true },
        },
        {
          name: 'cachedLevel3Count',
          type: 'number',
          defaultValue: 0,
          label: 'Партнёров на 3 уровне',
          admin: { readOnly: true },
        },
      ],
    },
    // ======= ПОДГОТОВКА К ИНТЕГРАЦИИ С ЦК =======
    {
      type: 'collapsible',
      label: 'Цифровой Кооператив (для будущей интеграции)',
      admin: {
        description: 'Поля для синхронизации с Цифровым Кооперативом. Заполняются автоматически после интеграции.',
      },
      fields: [
        {
          name: 'cooperativeMemberRole',
          type: 'select',
          label: 'Роль в кооперативе',
          options: [
            { label: 'Пайщик-продвигатель', value: 'promoter' },
            { label: 'Пайщик-организатор', value: 'organizer' },
          ],
        },
        {
          name: 'cooperativeAgreementId',
          type: 'text',
          label: 'ID соглашения участия в ЦПП',
          admin: { readOnly: true },
        },
        {
          name: 'cooperativeCPPLinks',
          type: 'array',
          label: 'Участие в ЦПП',
          fields: [
            {
              name: 'cppName',
              type: 'text',
              label: 'Название ЦПП',
            },
            {
              name: 'cppId',
              type: 'text',
              label: 'ID ЦПП',
            },
            {
              name: 'joinedAt',
              type: 'date',
              label: 'Дата присоединения',
            },
          ],
        },
      ],
    },
    {
      name: 'adminNotes',
      type: 'textarea',
      label: 'Заметки администратора',
      admin: {
        description: 'Внутренние заметки, не видны партнёру',
      },
    },
  ],
}
