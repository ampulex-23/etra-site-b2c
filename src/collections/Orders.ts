import type { CollectionConfig } from 'payload'
import { orderAfterChange } from '../hooks/orderAfterChange'

export const Orders: CollectionConfig = {
  slug: 'orders',
  labels: {
    singular: 'Заказ',
    plural: 'Заказы',
  },
  hooks: {
    afterChange: [orderAfterChange],
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
        },
      ],
    },
    {
      name: 'subtotal',
      type: 'number',
      min: 0,
      label: 'Сумма товаров',
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
        },
        {
          name: 'trackingNumber',
          type: 'text',
          label: 'Трек-номер',
        },
      ],
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
  ],
}
