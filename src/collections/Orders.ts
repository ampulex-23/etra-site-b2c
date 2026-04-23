import type { CollectionConfig } from 'payload'
import { orderAfterChange } from '../hooks/orderAfterChange'
import { orderBeforeChange } from '../hooks/orderBeforeChange'
import { referralAfterOrderPaid } from '../hooks/referralAfterOrderPaid'
import { customerAfterOrderCreate } from '../hooks/customerAfterOrderCreate'
import {
  updateCustomerOrderStatsAfterChange,
  updateCustomerOrderStatsAfterDelete,
} from '../hooks/updateCustomerOrderStats'

export const Orders: CollectionConfig = {
  slug: 'orders',
  labels: {
    singular: 'Заказ',
    plural: 'Заказы',
  },
  hooks: {
    beforeChange: [orderBeforeChange],
    afterChange: [
      orderAfterChange,
      customerAfterOrderCreate,
      referralAfterOrderPaid,
      updateCustomerOrderStatsAfterChange,
    ],
    afterDelete: [updateCustomerOrderStatsAfterDelete],
  },
  admin: {
    useAsTitle: 'orderNumber',
    defaultColumns: ['orderNumber', 'customer', 'total', 'status', 'createdAt'],
    group: 'Магазин',
  },
  access: {
    read: ({ req: { user } }) => {
      // Разрешить API-ключам (для MCP-сервера)
      if (!user) return true
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
      admin: {
        components: {
          Cell: '@/components/admin/ItemsBreakdownCell',
        },
      },
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
        { label: 'Слит с другим заказом', value: 'merged' },
      ],
      admin: { position: 'sidebar' },
    },
    {
      name: 'allowTopUp',
      type: 'checkbox',
      defaultValue: true,
      label: 'Разрешить докомплектацию',
      admin: {
        position: 'sidebar',
        description: 'Если выключено — клиент не сможет добавлять товары к этому заказу (например, уже упакован)',
      },
    },
    {
      name: 'mergedInto',
      type: 'relationship',
      relationTo: 'orders',
      label: 'Слит в заказ',
      admin: {
        position: 'sidebar',
        readOnly: true,
        description: 'Если этот заказ был объединён с другим — ссылка сюда',
        condition: (data) => data?.status === 'merged' || Boolean(data?.mergedInto),
      },
    },
    {
      name: 'mergedFrom',
      type: 'relationship',
      relationTo: 'orders',
      hasMany: true,
      label: 'Объединённые заказы',
      admin: {
        readOnly: true,
        description: 'Заказы, которые были слиты в текущий (докомплектация)',
      },
    },
    {
      name: 'orderMergeButton',
      type: 'ui',
      admin: {
        position: 'sidebar',
        components: {
          Field: '@/components/admin/OrderMergeButton',
        },
      },
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
          admin: {
            date: {
              displayFormat: 'yyyy-MM-dd',
            },
          },
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
        description: 'Заполняется при импорте из PuzzleBot',
        date: {
          displayFormat: 'yyyy-MM-dd',
        },
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
      name: 'referralPartner',
      type: 'relationship',
      relationTo: 'referral-partners',
      label: 'Партнёр (получатель комиссии)',
      admin: {
        position: 'sidebar',
        description: 'Партнёр, к которому привязан клиент',
      },
    },
    {
      name: 'promoCodeApplied',
      type: 'text',
      label: 'Применённый промокод',
      admin: {
        position: 'sidebar',
        readOnly: true,
      },
    },
    {
      name: 'customerDiscountApplied',
      type: 'number',
      defaultValue: 0,
      min: 0,
      label: 'Скидка клиенту по рефералке (₽)',
      admin: {
        position: 'sidebar',
        readOnly: true,
      },
    },
    {
      name: 'isPartnerPurchase',
      type: 'checkbox',
      defaultValue: false,
      label: 'Партнёрская закупка',
      admin: {
        position: 'sidebar',
        description: 'Заказ по партнёрской цене (для последующей перепродажи)',
      },
    },
    {
      name: 'partnerDiscountApplied',
      type: 'number',
      defaultValue: 0,
      min: 0,
      label: 'Партнёрская скидка (₽)',
      admin: {
        position: 'sidebar',
        readOnly: true,
      },
    },
    {
      name: 'referralCommissionsCreated',
      type: 'checkbox',
      defaultValue: false,
      label: 'Комиссии созданы',
      admin: {
        position: 'sidebar',
        readOnly: true,
        description: 'Комиссии уже рассчитаны по этому заказу',
      },
    },
  ],
}
