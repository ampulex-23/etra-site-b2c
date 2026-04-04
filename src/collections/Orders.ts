import type { CollectionConfig } from 'payload'
import { orderAfterChange } from '../hooks/orderAfterChange'
import { orderBeforeChange } from '../hooks/orderBeforeChange'
import { referralAfterOrderChange } from '../hooks/referralAfterOrderChange'

export const Orders: CollectionConfig = {
  slug: 'orders',
  labels: {
    singular: 'Заказ',
    plural: 'Заказы',
  },
  hooks: {
    beforeChange: [orderBeforeChange],
    afterChange: [orderAfterChange, referralAfterOrderChange],
  },
  admin: {
    useAsTitle: 'orderNumber',
    defaultColumns: ['orderNumber', 'customer', 'total', 'status', 'createdAt'],
    group: 'Магазин',
  },
  access: {
    read: ({ req: { user } }) => {
      if (!user) return false
      if (user.collection === 'users') return true
      return { customer: { equals: user.id } }
    },
    create: ({ req: { user } }) => Boolean(user),
    update: ({ req: { user } }) => {
      if (!user) return false
      if (user.collection === 'users') return true
      return { customer: { equals: user.id } }
    },
    delete: ({ req: { user } }) => {
      if (!user) return false
      return user.collection === 'users'
    },
  },
  fields: [
    {
      name: 'orderNumber',
      type: 'text',
      required: true,
      unique: true,
      label: 'Номер заказа',
      admin: { readOnly: true },
    },
    {
      name: 'customer',
      type: 'relationship',
      relationTo: 'customers',
      required: true,
      label: 'Клиент',
    },
    {
      name: 'items',
      type: 'array',
      required: true,
      label: 'Товары',
      fields: [
        {
          name: 'product',
          type: 'relationship',
          relationTo: 'products',
          required: true,
          label: 'Товар',
        },
        {
          name: 'variantName',
          type: 'text',
          label: 'Вариант',
        },
        {
          name: 'quantity',
          type: 'number',
          required: true,
          min: 1,
          label: 'Количество',
        },
        {
          name: 'price',
          type: 'number',
          required: true,
          min: 0,
          label: 'Цена за шт.',
          admin: { readOnly: true, description: 'Заполняется автоматически из товара/варианта' },
        },
      ],
    },
    {
      name: 'orderItemCalc',
      type: 'ui',
      admin: {
        components: {
          Field: '@/components/admin/OrderItemFields',
        },
      },
    },
    {
      name: 'subtotal',
      type: 'number',
      min: 0,
      label: 'Сумма товаров',
      admin: { readOnly: true, description: 'Считается автоматически' },
    },
    {
      name: 'discount',
      type: 'number',
      min: 0,
      defaultValue: 0,
      label: 'Скидка',
    },
    {
      name: 'deliveryCost',
      type: 'number',
      min: 0,
      defaultValue: 0,
      label: 'Стоимость доставки',
    },
    {
      name: 'total',
      type: 'number',
      required: true,
      min: 0,
      label: 'Итого (₽)',
      admin: { readOnly: true, description: 'Считается автоматически: сумма товаров − скидка + доставка' },
    },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'new',
      label: 'Статус',
      options: [
        { label: 'Новый', value: 'new' },
        { label: 'В обработке', value: 'processing' },
        { label: 'Отправлен', value: 'shipped' },
        { label: 'Доставлен', value: 'delivered' },
        { label: 'Завершён', value: 'completed' },
        { label: 'Отменён', value: 'cancelled' },
      ],
      admin: { position: 'sidebar' },
    },
    {
      name: 'payment',
      type: 'group',
      label: 'Оплата',
      fields: [
        {
          name: 'method',
          type: 'select',
          label: 'Способ',
          options: [
            { label: 'ЮKassa', value: 'yokassa' },
            { label: 'Тинькофф', value: 'tinkoff' },
            { label: 'Наличные', value: 'cash' },
          ],
        },
        {
          name: 'transactionId',
          type: 'text',
          label: 'ID транзакции',
        },
        {
          name: 'status',
          type: 'select',
          label: 'Статус оплаты',
          options: [
            { label: 'Ожидает', value: 'pending' },
            { label: 'Оплачено', value: 'paid' },
            { label: 'Отменено', value: 'cancelled' },
            { label: 'Возврат', value: 'refunded' },
          ],
        },
        {
          name: 'paidAt',
          type: 'date',
          label: 'Дата оплаты',
        },
      ],
    },
    {
      name: 'delivery',
      type: 'group',
      label: 'Доставка',
      fields: [
        {
          name: 'method',
          type: 'select',
          label: 'Способ',
          options: [
            { label: 'CDEK', value: 'cdek' },
            { label: 'Почта России', value: 'russian_post' },
            { label: 'Самовывоз', value: 'pickup' },
          ],
        },
        {
          name: 'address',
          type: 'textarea',
          label: 'Адрес',
          admin: {
            components: {
              Field: '@/components/admin/AddressAutocomplete',
            },
          },
        },
        {
          name: 'trackingNumber',
          type: 'text',
          label: 'Трек-номер',
        },
      ],
    },
    {
      name: 'linkedDelivery',
      type: 'relationship',
      relationTo: 'deliveries',
      label: 'Связанная доставка',
      admin: {
        readOnly: true,
        position: 'sidebar',
        description: 'Создаётся автоматически при создании заказа',
      },
    },
    {
      name: 'linkedPayment',
      type: 'relationship',
      relationTo: 'payments',
      label: 'Связанный платёж',
      admin: {
        readOnly: true,
        position: 'sidebar',
        description: 'Создаётся автоматически при создании заказа',
      },
    },
    {
      name: 'selectedCohort',
      type: 'relationship',
      relationTo: 'course-cohorts' as any,
      label: 'Поток (инфопродукт)',
      admin: {
        position: 'sidebar',
        description: 'Если заказ содержит инфопродукт — выбранный поток для записи',
      },
    },
    {
      name: 'promoCode',
      type: 'relationship',
      relationTo: 'promo-codes',
      label: 'Промокод',
      admin: { position: 'sidebar' },
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
      ],
      admin: { position: 'sidebar' },
    },
    {
      name: 'puzzleBotOrderId',
      type: 'text',
      label: 'ID заказа в PuzzleBot',
      admin: {
        position: 'sidebar',
        readOnly: true,
        description: 'Внутренний ID заказа из PuzzleBot',
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
      name: 'amoCrmDealId',
      type: 'number',
      label: 'ID сделки в amoCRM',
      admin: { position: 'sidebar', readOnly: true },
    },
    {
      name: 'notes',
      type: 'textarea',
      label: 'Комментарий',
    },
    {
      name: 'referrer',
      type: 'relationship',
      relationTo: 'customers',
      label: 'Реферер',
      admin: {
        position: 'sidebar',
        readOnly: true,
        description: 'Клиент, по чьей ссылке оформлен заказ',
      },
    },
    {
      name: 'referralPointsAwarded',
      type: 'checkbox',
      defaultValue: false,
      label: 'Очки начислены',
      admin: {
        position: 'sidebar',
        readOnly: true,
        description: 'Очки реферу уже начислены',
      },
    },
  ],
}
