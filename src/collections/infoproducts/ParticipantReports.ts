import type { CollectionConfig } from 'payload'
import { reportAfterChange } from '../../hooks/reportAfterChange'

export const ParticipantReports: CollectionConfig = {
  slug: 'participant-reports',
  labels: {
    singular: 'Отчёт участника',
    plural: 'Отчёты участников',
  },
  admin: {
    defaultColumns: ['enrollment', 'date', 'completionRate', 'status', 'submittedAt'],
    group: '📚 Инфопродукты',
  },
  hooks: {
    afterChange: [reportAfterChange],
  },
  access: {
    read: ({ req: { user } }) => {
      if (user && user.collection === 'users') return true
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
      name: 'enrollment',
      type: 'relationship',
      relationTo: 'enrollments' as any,
      required: true,
      label: 'Участник (запись)',
    },
    {
      name: 'courseDay',
      type: 'relationship',
      relationTo: 'course-days' as any,
      label: 'День программы',
      admin: {
        description: 'Привязка к конкретному дню (необязательно)',
      },
    },
    {
      name: 'date',
      type: 'date',
      required: true,
      label: 'Дата отчёта',
    },
    {
      name: 'items',
      type: 'array',
      label: 'Пункты отчёта',
      admin: {
        description: 'Заполняются из шаблона инфопродукта',
      },
      fields: [
        {
          name: 'label',
          type: 'text',
          required: true,
          label: 'Пункт',
        },
        {
          name: 'completed',
          type: 'checkbox',
          defaultValue: false,
          label: 'Выполнено',
        },
      ],
    },
    {
      name: 'completionRate',
      type: 'number',
      min: 0,
      max: 100,
      label: '% выполнения',
      admin: {
        position: 'sidebar',
        readOnly: true,
        description: 'Рассчитывается автоматически',
      },
    },
    {
      name: 'notes',
      type: 'textarea',
      label: 'Комментарий участника',
    },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'submitted',
      label: 'Статус',
      options: [
        { label: 'Подан', value: 'submitted' },
        { label: 'С опозданием', value: 'late' },
        { label: 'Пропущен', value: 'missed' },
      ],
      admin: { position: 'sidebar' },
    },
    {
      name: 'submittedAt',
      type: 'date',
      label: 'Время подачи',
      admin: {
        position: 'sidebar',
        description: 'Заполняется автоматически',
      },
    },
  ],
}
