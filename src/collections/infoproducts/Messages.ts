import type { CollectionConfig } from 'payload'
import { messageAfterChange } from '../../hooks/messageAfterChange'

export const Messages: CollectionConfig = {
  slug: 'messages',
  labels: {
    singular: 'Сообщение',
    plural: 'Сообщения',
  },
  admin: {
    defaultColumns: ['chatRoom', 'senderType', 'text', 'createdAt'],
    group: '💬 Мессенджер',
  },
  hooks: {
    afterChange: [messageAfterChange],
  },
  access: {
    read: ({ req: { user } }) => {
      if (!user) return true
      if (user && user.collection === 'users') return true
      // Customers can read messages (filtered by chatRoom/cohort in API)
      if (user && user.collection === 'customers') return true
      return false
    },
    create: ({ req: { user } }) => {
      if (!user) return false
      // Admin/manager from admin panel
      if (user.collection === 'users') {
        const role = (user as any).role
        return role === 'admin' || role === 'manager' || role === 'content'
      }
      // Customers can send messages
      if (user.collection === 'customers') return true
      return false
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
      const role = (user as any).role
      return role === 'admin' || role === 'manager'
    },
  },
  fields: [
    {
      name: 'chatRoom',
      type: 'relationship',
      relationTo: 'chat-rooms' as any,
      required: true,
      label: 'Чат-комната',
      index: true,
    },
    {
      name: 'senderType',
      type: 'select',
      required: true,
      label: 'Тип отправителя',
      options: [
        { label: 'Участник', value: 'customer' },
        { label: 'Команда', value: 'staff' },
        { label: 'Система', value: 'system' },
      ],
      admin: { position: 'sidebar' },
    },
    {
      name: 'senderCustomer',
      type: 'relationship',
      relationTo: 'customers',
      label: 'Отправитель (клиент)',
      admin: {
        condition: (data: any) => data?.senderType === 'customer',
      },
    },
    {
      name: 'senderUser',
      type: 'relationship',
      relationTo: 'users',
      label: 'Отправитель (сотрудник)',
      admin: {
        condition: (data: any) => data?.senderType === 'staff',
      },
    },
    {
      name: 'text',
      type: 'textarea',
      required: true,
      label: 'Текст сообщения',
    },
    {
      name: 'attachments',
      type: 'array',
      label: 'Вложения',
      fields: [
        {
          name: 'file',
          type: 'upload',
          relationTo: 'media',
          required: true,
        },
      ],
    },
    {
      name: 'readAt',
      type: 'date',
      label: 'Прочитано',
      admin: {
        position: 'sidebar',
        readOnly: true,
        description: 'Когда другая сторона прочитала сообщение',
      },
    },
    {
      name: 'isDeleted',
      type: 'checkbox',
      defaultValue: false,
      label: 'Удалено',
      admin: { position: 'sidebar' },
    },
  ],
}

