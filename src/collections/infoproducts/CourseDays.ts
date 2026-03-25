import type { CollectionConfig } from 'payload'

export const CourseDays: CollectionConfig = {
  slug: 'course-days',
  labels: {
    singular: 'День программы',
    plural: 'Дни программы',
  },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['dayNumber', 'title', 'cohort', 'date'],
    group: '📚 Инфопродукты',
  },
  access: {
    read: ({ req: { user } }) => {
      if (user && user.collection === 'users') return true
      // Customers: handled via API endpoint (needs enrollment check)
      // Allow read if user is a customer — filtered by cohort in API
      if (user && user.collection === 'customers') return true
      return false
    },
    create: ({ req: { user } }) => {
      if (!user) return false
      if (user.collection !== 'users') return false
      const role = (user as any).role
      return role === 'admin' || role === 'manager' || role === 'content'
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
      name: 'cohort',
      type: 'relationship',
      relationTo: 'course-cohorts' as any,
      required: true,
      label: 'Поток',
    },
    {
      name: 'dayNumber',
      type: 'number',
      required: true,
      min: 1,
      label: 'День №',
    },
    {
      name: 'date',
      type: 'date',
      label: 'Дата',
      admin: { position: 'sidebar' },
    },
    {
      name: 'title',
      type: 'text',
      label: 'Заголовок дня',
      admin: {
        description: 'Если пусто — отображается «День N»',
      },
    },
    {
      name: 'morningBlock',
      type: 'richText',
      label: 'Утро ⭐️',
    },
    {
      name: 'dayBlock',
      type: 'richText',
      label: 'День ☀️',
    },
    {
      name: 'eveningBlock',
      type: 'richText',
      label: 'Вечер 🌙',
    },
    {
      name: 'specialNotes',
      type: 'textarea',
      label: 'Особые указания',
      admin: {
        description: 'Дополнительные инструкции для этого дня',
      },
    },
    {
      name: 'broadcast',
      type: 'group',
      label: 'Эфир',
      fields: [
        {
          name: 'scheduled',
          type: 'checkbox',
          defaultValue: false,
          label: 'Запланирован эфир',
        },
        {
          name: 'time',
          type: 'text',
          label: 'Время',
          admin: {
            description: 'Например: 19:00 МСК',
            condition: (data: any, siblingData: any) => siblingData?.scheduled,
          },
        },
        {
          name: 'title',
          type: 'text',
          label: 'Тема эфира',
          admin: {
            condition: (data: any, siblingData: any) => siblingData?.scheduled,
          },
        },
        {
          name: 'type',
          type: 'select',
          label: 'Тип',
          options: [
            { label: 'Тематический', value: 'thematic' },
            { label: 'Вопрос-ответ', value: 'qa' },
            { label: 'Вводный', value: 'intro' },
          ],
          admin: {
            condition: (data: any, siblingData: any) => siblingData?.scheduled,
          },
        },
        {
          name: 'zoomLink',
          type: 'text',
          label: 'Ссылка на Zoom',
          admin: {
            condition: (data: any, siblingData: any) => siblingData?.scheduled,
          },
        },
        {
          name: 'recordingUrl',
          type: 'text',
          label: 'Запись эфира (URL)',
          admin: {
            condition: (data: any, siblingData: any) => siblingData?.scheduled,
          },
        },
      ],
    },
    {
      name: 'sportProgram',
      type: 'richText',
      label: 'Спортивная программа',
    },
  ],
}
