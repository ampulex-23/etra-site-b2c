import type { CollectionConfig } from 'payload'
import { cohortAfterChange } from '../../hooks/cohortAfterChange'

export const CourseCohorts: CollectionConfig = {
  slug: 'course-cohorts',
  labels: {
    singular: 'Поток',
    plural: 'Потоки',
  },
  hooks: {
    afterChange: [cohortAfterChange],
  },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'infoproduct', 'status', 'startDate', 'endDate'],
    group: '📚 Инфопродукты',
  },
  access: {
    read: ({ req: { user } }) => {
      if (user && user.collection === 'users') return true
      // Customers can see upcoming (for purchase) and active/completed cohorts
      if (user && user.collection === 'customers') {
        return { status: { in: ['upcoming', 'active', 'completed'] } }
      }
      // Anonymous: only upcoming (for landing page)
      return { status: { in: ['upcoming', 'active'] } }
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
      name: 'infoproduct',
      type: 'relationship',
      relationTo: 'infoproducts' as any,
      required: true,
      label: 'Инфопродукт',
    },
    {
      name: 'title',
      type: 'text',
      required: true,
      label: 'Название потока',
      admin: {
        description: 'Например: «Поток 1», «Январь 2026»',
      },
    },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'upcoming',
      label: 'Статус',
      options: [
        { label: 'Предстоящий', value: 'upcoming' },
        { label: 'Активный', value: 'active' },
        { label: 'Завершён', value: 'completed' },
        { label: 'Отменён', value: 'cancelled' },
      ],
      admin: { position: 'sidebar' },
    },
    {
      name: 'startDate',
      type: 'date',
      required: true,
      label: 'Дата старта',
      admin: { position: 'sidebar' },
    },
    {
      name: 'endDate',
      type: 'date',
      label: 'Дата окончания',
      admin: { position: 'sidebar' },
    },
    {
      name: 'maxParticipants',
      type: 'number',
      min: 0,
      defaultValue: 0,
      label: 'Макс. участников',
      admin: {
        position: 'sidebar',
        description: '0 = без ограничения',
      },
    },
    {
      name: 'notes',
      type: 'textarea',
      label: 'Заметки',
      admin: {
        description: 'Внутренние заметки для менеджеров',
      },
    },
  ],
}
