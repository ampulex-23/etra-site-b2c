import type { CollectionConfig } from 'payload'

export const Enrollments: CollectionConfig = {
  slug: 'enrollments',
  labels: {
    singular: 'Запись на курс',
    plural: 'Записи на курс',
  },
  admin: {
    useAsTitle: 'hashtag',
    defaultColumns: ['customer', 'cohort', 'status', 'hashtag', 'currentDay', 'reportStreak', 'missedReports'],
    group: '📚 Инфопродукты',
  },
  access: {
    read: ({ req: { user } }) => {
      // Разрешить API-ключам (для MCP-сервера)
      if (!user) return true
      if (user && user.collection === 'users') return true
      if (user && user.collection === 'customers') {
        return { customer: { equals: user.id } }
      }
      return false
    },
    create: ({ req: { user } }) => {
      if (!user) return false
      if (user.collection !== 'users') return false
      const role = (user as any).role
      return role === 'admin' || role === 'manager'
    },
    update: ({ req: { user } }) => {
      if (!user) return false
      if (user.collection !== 'users') return false
      const role = (user as any).role
      return role === 'admin' || role === 'manager'
    },
    delete: ({ req: { user } }) => {
      if (!user) return false
      if (user.collection !== 'users') return false
      return (user as any).role === 'admin'
    },
  },
  fields: [
    {
      name: 'customer',
      type: 'relationship',
      relationTo: 'customers',
      required: true,
      label: 'Клиент',
    },
    {
      name: 'cohort',
      type: 'relationship',
      relationTo: 'course-cohorts' as any,
      required: true,
      label: 'Поток',
    },
    {
      name: 'order',
      type: 'relationship',
      relationTo: 'orders',
      label: 'Связанный заказ',
      admin: {
        position: 'sidebar',
        description: 'Заказ, через который клиент попал на курс',
      },
    },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'pending',
      required: true,
      label: 'Статус',
      options: [
        { label: 'Ожидает', value: 'pending' },
        { label: 'Активен', value: 'active' },
        { label: 'Пауза', value: 'paused' },
        { label: 'Завершён', value: 'completed' },
        { label: 'Исключён', value: 'expelled' },
        { label: 'Возврат', value: 'refunded' },
      ],
      admin: { position: 'sidebar' },
    },
    {
      name: 'hashtag',
      type: 'text',
      label: 'Персональный хэштег',
      admin: {
        description: 'Формат: #ИмяЧислоРождения (например #Кирилл15)',
      },
    },
    {
      name: 'enrolledAt',
      type: 'date',
      label: 'Дата записи',
      admin: {
        position: 'sidebar',
        date: {
          displayFormat: 'yyyy-MM-dd',
        },
      },
    },
    {
      name: 'completedAt',
      type: 'date',
      label: 'Дата завершения',
      admin: {
        position: 'sidebar',
        condition: (data: any) => data?.status === 'completed',
        date: {
          displayFormat: 'yyyy-MM-dd',
        },
      },
    },
    {
      name: 'currentDay',
      type: 'number',
      defaultValue: 0,
      min: 0,
      label: 'Текущий день',
      admin: {
        position: 'sidebar',
        description: 'Обновляется автоматически при подаче отчётов',
      },
    },
    {
      name: 'reportStreak',
      type: 'number',
      defaultValue: 0,
      min: 0,
      label: 'Серия отчётов подряд',
      admin: {
        position: 'sidebar',
        readOnly: true,
      },
    },
    {
      name: 'missedReports',
      type: 'number',
      defaultValue: 0,
      min: 0,
      label: 'Пропущено отчётов',
      admin: {
        position: 'sidebar',
        readOnly: true,
      },
    },
    {
      name: 'notes',
      type: 'textarea',
      label: 'Заметки менеджера',
      admin: {
        description: 'Противопоказания, особые условия, комментарии',
      },
    },
  ],
}

