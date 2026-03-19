import type { CollectionConfig } from 'payload'
import { deliveryAfterChange } from '../hooks/deliveryAfterChange'

export const Deliveries: CollectionConfig = {
  slug: 'deliveries',
  labels: {
    singular: 'Доставка',
    plural: 'Доставки',
  },
  hooks: {
    afterChange: [deliveryAfterChange],
  },
  admin: {
    useAsTitle: 'trackingNumber',
    defaultColumns: ['order', 'method', 'status', 'trackingNumber', 'createdAt'],
    group: 'Магазин',
  },
  access: {
    read: ({ req: { user } }) => Boolean(user),
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
      label: 'Способ доставки',
      options: [
        { label: 'Самовывоз', value: 'pickup' },
        { label: 'СДЭК', value: 'cdek' },
        { label: 'Почта России', value: 'russian_post' },
      ],
      admin: { position: 'sidebar' },
    },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'pending',
      label: 'Статус',
      options: [
        { label: 'Ожидает отправки', value: 'pending' },
        { label: 'Передан в службу', value: 'handed_over' },
        { label: 'В пути', value: 'in_transit' },
        { label: 'Прибыл в ПВЗ', value: 'arrived_at_pickup' },
        { label: 'Доставлен', value: 'delivered' },
        { label: 'Возврат', value: 'returned' },
      ],
      admin: { position: 'sidebar' },
    },
    {
      name: 'trackingNumber',
      type: 'text',
      label: 'Трек-номер',
      admin: {
        description: 'Трек-номер СДЭК или почтовый идентификатор',
      },
    },
    {
      name: 'cdekOrderUuid',
      type: 'text',
      label: 'UUID заказа СДЭК',
      admin: {
        condition: (data) => data?.method === 'cdek',
        readOnly: true,
      },
    },
    {
      name: 'recipient',
      type: 'group',
      label: 'Получатель',
      fields: [
        {
          name: 'name',
          type: 'text',
          required: true,
          label: 'ФИО',
        },
        {
          name: 'phone',
          type: 'text',
          required: true,
          label: 'Телефон',
        },
        {
          name: 'email',
          type: 'email',
          label: 'Email',
        },
      ],
    },
    {
      name: 'address',
      type: 'group',
      label: 'Адрес доставки',
      admin: {
        condition: (data) => data?.method !== 'pickup',
      },
      fields: [
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
      name: 'pickupPoint',
      type: 'group',
      label: 'Пункт выдачи (ПВЗ)',
      admin: {
        condition: (data) => data?.method === 'cdek' || data?.method === 'russian_post',
      },
      fields: [
        {
          name: 'code',
          type: 'text',
          label: 'Код ПВЗ',
        },
        {
          name: 'name',
          type: 'text',
          label: 'Название',
        },
        {
          name: 'address',
          type: 'text',
          label: 'Адрес ПВЗ',
        },
      ],
    },
    {
      name: 'weight',
      type: 'number',
      min: 0,
      label: 'Вес (г)',
      admin: { position: 'sidebar' },
    },
    {
      name: 'cost',
      type: 'number',
      min: 0,
      label: 'Стоимость доставки (₽)',
      admin: { position: 'sidebar' },
    },
    {
      name: 'estimatedDeliveryDate',
      type: 'date',
      label: 'Ориентировочная дата доставки',
    },
    {
      name: 'deliveredAt',
      type: 'date',
      label: 'Дата доставки (факт)',
    },
    {
      name: 'notes',
      type: 'textarea',
      label: 'Примечание',
    },
  ],
}
