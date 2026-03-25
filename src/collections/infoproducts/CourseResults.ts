import type { CollectionConfig } from 'payload'
import { resultBeforeChange } from '../../hooks/resultBeforeChange'

export const CourseResults: CollectionConfig = {
  slug: 'course-results',
  labels: {
    singular: 'Результат',
    plural: 'Результаты',
  },
  admin: {
    defaultColumns: ['enrollment', 'type', 'status', 'weightBefore', 'weightAfter', 'publishedAt'],
    group: '📚 Инфопродукты',
  },
  access: {
    read: ({ req: { user } }) => {
      if (user && user.collection === 'users') return true
      // Customers see published/featured results + their own (any status)
      // Own results are filtered via API; here we allow published globally
      if (user && user.collection === 'customers') return true
      // Anonymous: only published
      return { status: { in: ['published', 'featured'] } }
    },
    create: ({ req: { user } }) => {
      if (!user) return false
      // Admin/manager/content from admin panel
      if (user.collection === 'users') {
        const role = (user as any).role
        return role === 'admin' || role === 'manager' || role === 'content'
      }
      // Customers can create results (validated in beforeChange hook)
      if (user.collection === 'customers') return true
      return false
    },
    update: ({ req: { user } }) => {
      if (!user) return false
      if (user.collection !== 'users') return false
      const role = (user as any).role
      return role === 'admin' || role === 'manager' || role === 'content'
    },
    delete: ({ req: { user } }) => {
      if (!user) return false
      if (user.collection !== 'users') return false
      return (user as any).role === 'admin'
    },
  },
  fields: [
    {
      name: 'enrollment',
      type: 'relationship',
      relationTo: 'enrollments' as any,
      required: true,
      label: 'Участник (запись)',
    },
    {
      name: 'type',
      type: 'select',
      defaultValue: 'final',
      label: 'Тип',
      options: [
        { label: 'Промежуточный', value: 'intermediate' },
        { label: 'Итоговый', value: 'final' },
      ],
      admin: { position: 'sidebar' },
    },
    {
      name: 'text',
      type: 'textarea',
      required: true,
      label: 'Текст отзыва / результата',
    },
    {
      name: 'photos',
      type: 'array',
      label: 'Фото (до / после / нейрографика)',
      fields: [
        {
          name: 'image',
          type: 'upload',
          relationTo: 'media',
          required: true,
        },
        {
          name: 'caption',
          type: 'text',
          label: 'Подпись',
        },
      ],
    },
    {
      name: 'weightBefore',
      type: 'number',
      min: 0,
      label: 'Вес до (кг)',
      admin: { position: 'sidebar' },
    },
    {
      name: 'weightAfter',
      type: 'number',
      min: 0,
      label: 'Вес после (кг)',
      admin: { position: 'sidebar' },
    },
    {
      name: 'effects',
      type: 'array',
      label: 'Эффекты',
      admin: {
        description: 'Классифицированные результаты для аналитики',
      },
      fields: [
        {
          name: 'category',
          type: 'select',
          required: true,
          label: 'Категория',
          options: [
            { label: 'Снижение веса', value: 'weight_loss' },
            { label: 'Избавление от пищевых зависимостей', value: 'food_addiction' },
            { label: 'Психоэмоциональные изменения', value: 'psycho_emotional' },
            { label: 'Лёгкость в теле', value: 'lightness' },
            { label: 'Осознанное питание', value: 'conscious_eating' },
            { label: 'Улучшение сна', value: 'sleep' },
            { label: 'Улучшение кожи', value: 'skin' },
            { label: 'Уменьшение объёмов', value: 'body_volumes' },
            { label: 'Решение проблем со здоровьем', value: 'health_issues' },
            { label: 'Рост физических показателей', value: 'physical_performance' },
            { label: 'Нейрографика', value: 'neurographics' },
            { label: 'Ценность сообщества', value: 'community' },
          ],
        },
        {
          name: 'description',
          type: 'text',
          label: 'Описание',
        },
      ],
    },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'pending',
      label: 'Статус',
      options: [
        { label: 'На модерации', value: 'pending' },
        { label: 'Опубликован', value: 'published' },
        { label: 'На главной', value: 'featured' },
      ],
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
      resultBeforeChange,
      ({ data }) => {
        if (data?.status === 'published' && !data.publishedAt) {
          data.publishedAt = new Date().toISOString()
        }
        if (data?.status === 'featured' && !data.publishedAt) {
          data.publishedAt = new Date().toISOString()
        }
        return data
      },
    ],
  },
}
