import type { CollectionConfig } from 'payload'
import { customerBeforeChange } from '../hooks/customerBeforeChange'

export const Customers: CollectionConfig = {
  slug: 'customers',
  auth: true,
  hooks: {
    beforeChange: [customerBeforeChange],
  },
  labels: {
    singular: 'Клиент',
    plural: 'Клиенты',
  },
  admin: {
    useAsTitle: 'name',
    defaultColumns: [
      'name',
      'email',
      'phone',
      'orderCount',
      'orderTotalSum',
      'role',
    ],
    group: 'Магазин',
  },
  access: {
    read: () => true,
    admin: ({ req: { user } }) => {
      if (!user) return false
      return user.collection === 'users'
    },
    // Public signup: allow anonymous POST /api/customers so new visitors
    // can register by email+password. Per-field validation (unique email,
    // required password) and `customerBeforeChange` still run.
    create: () => true,
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
      // Do NOT override the Cell here: `name` is `useAsTitle`, and Payload
      // relies on its default Cell to render the primary clickable link
      // that opens the customer's edit page from the list view.
    },
    {
      name: 'phone',
      type: 'text',
      label: 'Телефон',
      admin: {
        components: {
          Cell: '@/components/admin/EmptyCell#EmptyCell',
        },
      },
    },
    // Denormalised order statistics. Maintained by
    // `updateCustomerOrderStatsAfterChange` on the orders collection.
    // Exposed as read-only columns in the Клиенты list view and as
    // clickable lookup links that open the filtered orders list.
    // Denormalised stats — shown as columns in the list view via the custom
    // Cell components, but hidden from the edit form (the CustomerOrdersPanel
    // widget below already displays the same info in a nicer layout).
    {
      name: 'orderCount',
      type: 'number',
      defaultValue: 0,
      min: 0,
      label: 'Заказов',
      admin: {
        readOnly: true,
        components: {
          Cell: '@/components/admin/CustomerStatCell#CustomerOrderCountCell',
          Field: '@/components/admin/HiddenField#default',
        },
      },
    },
    {
      name: 'orderTotalSum',
      type: 'number',
      defaultValue: 0,
      min: 0,
      label: 'Сумма заказов (₽)',
      admin: {
        readOnly: true,
        components: {
          Cell: '@/components/admin/CustomerStatCell#CustomerOrderTotalSumCell',
          Field: '@/components/admin/HiddenField#default',
        },
      },
    },
    {
      name: 'customerOrdersPanel',
      type: 'ui',
      admin: {
        position: 'sidebar',
        components: {
          Field: '@/components/admin/CustomerOrdersPanel#default',
        },
      },
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
          admin: {
            readOnly: true,
            components: { Cell: '@/components/admin/EmptyCell#EmptyCell' },
          },
        },
        {
          name: 'firstName',
          type: 'text',
          label: 'Имя в Telegram',
          admin: {
            readOnly: true,
            components: { Cell: '@/components/admin/EmptyCell#EmptyCell' },
          },
        },
        {
          name: 'lastName',
          type: 'text',
          label: 'Фамилия в Telegram',
          admin: {
            readOnly: true,
            components: { Cell: '@/components/admin/EmptyCell#EmptyCell' },
          },
        },
        {
          name: 'phone',
          type: 'text',
          label: 'Телефон из Telegram',
          admin: {
            readOnly: true,
            components: { Cell: '@/components/admin/EmptyCell#EmptyCell' },
          },
        },
        {
          name: 'photoUrl',
          type: 'text',
          label: 'Фото профиля (URL)',
          admin: {
            readOnly: true,
            components: { Cell: '@/components/admin/EmptyCell#EmptyCell' },
          },
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
        date: {
          displayFormat: 'yyyy-MM-dd',
        },
      },
    },
    {
      name: 'emailVerified',
      type: 'checkbox',
      defaultValue: false,
      label: 'Email подтверждён',
      admin: { position: 'sidebar' },
    },
    {
      type: 'collapsible',
      label: 'Реферальная программа',
      admin: {
        description: 'Привязка к партнёру и статистика закупок',
      },
      fields: [
        {
          name: 'attributedPartner',
          type: 'relationship',
          relationTo: 'referral-partners',
          label: 'Привязан к партнёру',
          admin: {
            readOnly: true,
            description: 'Партнёр, получающий комиссию с покупок этого клиента (пожизненно)',
          },
        },
        {
          name: 'attributedAt',
          type: 'date',
          label: 'Дата привязки',
          admin: {
            readOnly: true,
            date: { pickerAppearance: 'dayAndTime', displayFormat: 'yyyy-MM-dd HH:mm' },
          },
        },
        {
          name: 'firstPurchaseCompleted',
          type: 'checkbox',
          defaultValue: false,
          label: 'Первая покупка совершена',
          admin: {
            readOnly: true,
            description: 'Используется для различения первой/повторной комиссии',
          },
        },
        {
          name: 'totalSpent6Months',
          type: 'number',
          defaultValue: 0,
          min: 0,
          label: 'Потрачено за 6 мес. (₽)',
          admin: {
            readOnly: true,
            description: 'Для автоквалификации в МЛМ (порог 60k+)',
          },
        },
        {
          name: 'lastMLMQualificationCheck',
          type: 'date',
          label: 'Последняя проверка автоквалификации',
          admin: {
            readOnly: true,
            date: { pickerAppearance: 'dayAndTime', displayFormat: 'yyyy-MM-dd HH:mm' },
          },
        },
      ],
    },
    {
      type: 'collapsible',
      label: 'Цифровой Кооператив',
      admin: {
        description: 'Поля для будущей интеграции с Цифровым Кооперативом',
        initCollapsed: true,
      },
      fields: [
        {
          name: 'cooperativeAccountId',
          type: 'text',
          label: 'ID аккаунта в COOPOS',
          admin: { readOnly: true, description: '12-символьный идентификатор пайщика' },
        },
        {
          name: 'cooperativeMemberSince',
          type: 'date',
          label: 'Член кооператива с',
          admin: { readOnly: true, date: { displayFormat: 'yyyy-MM-dd' } },
        },
        {
          name: 'cooperativeStatus',
          type: 'select',
          defaultValue: 'not_member',
          label: 'Статус в кооперативе',
          options: [
            { label: 'Не пайщик', value: 'not_member' },
            { label: 'Пайщик-потребитель', value: 'consumer' },
            { label: 'Пайщик-продвигатель', value: 'promoter' },
            { label: 'Пайщик-организатор', value: 'organizer' },
          ],
          admin: { readOnly: true },
        },
      ],
    },
  ],
}
