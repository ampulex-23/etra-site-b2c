import type { CollectionConfig, Where } from 'payload'

export const Reviews: CollectionConfig = {
  slug: 'reviews',
  labels: {
    singular: 'Отзыв',
    plural: 'Отзывы',
  },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'customer', 'product', 'rating', 'status', 'createdAt'],
    group: 'Контент',
  },
  access: {
    read: ({ req: { user } }) => {
      // Admins/managers see all
      if (user && user.collection === 'users') return true
      // Public: only published
      return { status: { equals: 'published' } }
    },
    create: ({ req: { user } }) => {
      if (!user) return false
      return true
    },
    update: ({ req: { user } }) => {
      if (!user) return false
      // Admins/managers can edit any review
      if (user.collection === 'users') return true
      // Customers can edit their own reviews only if still pending
      return {
        and: [
          { customer: { equals: user.id } },
          { status: { equals: 'pending' } },
        ],
      } as Where
    },
    delete: ({ req: { user } }) => {
      if (!user) return false
      return user.collection === 'users'
    },
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      label: 'Заголовок',
      admin: {
        description: 'Краткий заголовок отзыва (необязательно)',
      },
    },
    {
      name: 'text',
      type: 'textarea',
      required: true,
      label: 'Текст отзыва',
    },
    {
      name: 'rating',
      type: 'number',
      required: true,
      min: 1,
      max: 5,
      label: 'Оценка',
      admin: {
        description: 'От 1 до 5',
      },
    },
    {
      name: 'customer',
      type: 'relationship',
      relationTo: 'customers',
      required: true,
      label: 'Покупатель',
      admin: {
        description: 'Менеджер может выбрать любого покупателя',
      },
    },
    {
      name: 'product',
      type: 'relationship',
      relationTo: 'products',
      label: 'Товар',
      admin: {
        description: 'Если отзыв на конкретный товар. Пусто — общий отзыв о магазине',
      },
    },
    {
      name: 'order',
      type: 'relationship',
      relationTo: 'orders',
      label: 'Заказ',
      admin: {
        description: 'Привязка к заказу (если отзыв после покупки)',
        position: 'sidebar',
      },
    },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'pending',
      required: true,
      label: 'Статус',
      options: [
        { label: 'На модерации', value: 'pending' },
        { label: 'Опубликован', value: 'published' },
        { label: 'Отклонён', value: 'rejected' },
      ],
      admin: { position: 'sidebar' },
    },
    {
      name: 'adminReply',
      type: 'textarea',
      label: 'Ответ администрации',
      admin: {
        description: 'Ответ на отзыв от имени магазина',
      },
    },
    {
      name: 'source',
      type: 'select',
      defaultValue: 'site',
      label: 'Источник',
      options: [
        { label: 'Сайт', value: 'site' },
        { label: 'Карточка товара', value: 'product_page' },
        { label: 'Личный кабинет', value: 'account' },
        { label: 'После заказа', value: 'post_order' },
        { label: 'Администратор', value: 'admin' },
      ],
      admin: { position: 'sidebar' },
    },
    {
      name: 'featured',
      type: 'checkbox',
      defaultValue: false,
      label: 'Показывать на главной',
      admin: { position: 'sidebar' },
    },
    {
      name: 'publishedAt',
      type: 'date',
      label: 'Дата публикации',
      admin: { position: 'sidebar' },
    },
  ],
  hooks: {
    beforeChange: [
      ({ data, operation }) => {
        // Auto-set publishedAt when status changes to published
        if (data?.status === 'published' && !data.publishedAt) {
          data.publishedAt = new Date().toISOString()
        }
        // Auto-generate title if not set
        if (operation === 'create' && !data?.title) {
          const stars = '★'.repeat(data?.rating || 5) + '☆'.repeat(5 - (data?.rating || 5))
          data!.title = stars
        }
        return data
      },
    ],
  },
}
