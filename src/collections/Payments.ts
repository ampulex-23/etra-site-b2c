import type { CollectionConfig } from 'payload'
import { paymentAfterChange } from '../hooks/paymentAfterChange'

export const Payments: CollectionConfig = {
  slug: 'payments',
  labels: {
    singular: 'Платёж',
    plural: 'Платежи',
  },
  hooks: {
    afterChange: [paymentAfterChange],
  },
  admin: {
    useAsTitle: 'transactionId',
    defaultColumns: ['order', 'method', 'amount', 'status', 'createdAt'],
    group: 'Магазин',
  },
  access: {
    read: () => true,
    create: ({ req: { user } }) => {
      if (!user) return false
      const role = (user as any).role
      return role === 'admin' || role === 'manager'
    },
    update: ({ req: { user } }) => {
      if (!user) return false
      const role = (user as any).role
      return role === 'admin' || role === 'manager'
    },
    delete: ({ req: { user } }) => {
      if (!user) return false
      return (user as any).role === 'admin'
    },
  },
  fields: [
    {
      name: 'order',
      type: 'relationship',
      relationTo: 'orders',
      required: true,
      label: 'Заказ',
    },
    {
      name: 'method',
      type: 'select',
      required: true,
      label: 'Способ оплаты',
      options: [
        { label: 'Онлайн (шлюз)', value: 'gateway' },
        { label: 'Наличные при получении', value: 'cash' },
        { label: 'Перевод на карту', value: 'card_transfer' },
        { label: 'Счёт для юрлиц', value: 'invoice' },
      ],
      admin: { position: 'sidebar' },
    },
    {
      name: 'gateway',
      type: 'select',
      label: 'Платёжный шлюз',
      options: [
        { label: 'Не выбран', value: 'none' },
        { label: 'ЮKassa', value: 'yokassa' },
        { label: 'Тинькофф', value: 'tinkoff' },
        { label: 'CloudPayments', value: 'cloudpayments' },
      ],
      defaultValue: 'none',
      admin: {
        position: 'sidebar',
        condition: (data) => data?.method === 'gateway',
      },
    },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'pending',
      label: 'Статус',
      options: [
        { label: 'Ожидает оплаты', value: 'pending' },
        { label: 'Оплачено', value: 'paid' },
        { label: 'Ошибка', value: 'failed' },
        { label: 'Отменено', value: 'cancelled' },
        { label: 'Возврат', value: 'refunded' },
      ],
      admin: { position: 'sidebar' },
    },
    {
      name: 'amount',
      type: 'number',
      required: true,
      min: 0,
      label: 'Сумма (₽)',
    },
    {
      name: 'transactionId',
      type: 'text',
      label: 'ID транзакции',
      admin: {
        description: 'Внешний идентификатор платежа от шлюза',
      },
    },
    {
      name: 'gatewayResponse',
      type: 'json',
      label: 'Ответ шлюза',
      admin: {
        readOnly: true,
        description: 'Raw JSON ответ от платёжного шлюза',
      },
    },
    {
      name: 'paidAt',
      type: 'date',
      label: 'Дата оплаты',
    },
    {
      name: 'refundedAt',
      type: 'date',
      label: 'Дата возврата',
    },
    {
      name: 'notes',
      type: 'textarea',
      label: 'Комментарий',
    },
  ],
}
