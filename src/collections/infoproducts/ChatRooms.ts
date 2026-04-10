import type { CollectionConfig } from 'payload'

export const ChatRooms: CollectionConfig = {
  slug: 'chat-rooms',
  labels: {
    singular: 'Чат-комната',
    plural: 'Чат-комнаты',
  },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'cohort', 'type', 'createdAt'],
    group: '💬 Мессенджер',
  },
  access: {
    read: ({ req: { user } }) => {
      if (!user) return true
      if (user && user.collection === 'users') return true
      // Customers can see rooms (filtered by enrollment in API)
      if (user && user.collection === 'customers') return true
      return false
    },
    _originalRead: ({ req: { user } }) => {
      if (user && user.collection === 'users') return true
      // Customers can see rooms (filtered by enrollment in API)
      if (user && user.collection === 'customers') return true
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
      name: 'cohort',
      type: 'relationship',
      relationTo: 'course-cohorts' as any,
      required: true,
      label: 'Поток',
    },
    {
      name: 'title',
      type: 'text',
      required: true,
      label: 'Название',
      admin: {
        description: 'Например: «Общий чат», «Поддержка», «Эфиры»',
      },
    },
    {
      name: 'type',
      type: 'select',
      defaultValue: 'general',
      label: 'Тип',
      options: [
        { label: 'Общий', value: 'general' },
        { label: 'Поддержка', value: 'support' },
        { label: 'Объявления', value: 'broadcast' },
      ],
      admin: { position: 'sidebar' },
    },
    {
      name: 'isActive',
      type: 'checkbox',
      defaultValue: true,
      label: 'Активен',
      admin: { position: 'sidebar' },
    },
  ],
}

