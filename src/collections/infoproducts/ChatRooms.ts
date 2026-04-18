import type { CollectionConfig, Access } from 'payload'

const isStaff = (user: any) => user && user.collection === 'users'
const isCustomer = (user: any) => user && user.collection === 'customers'
const staffRole = (user: any): string | undefined => (isStaff(user) ? user?.role : undefined)

/**
 * Support rooms visibility for customers:
 * - staff: full read
 * - customer: rooms where type !== 'support' OR they are the owner
 * - anonymous: no (true kept for server-side unauthenticated ops if any)
 */
const readAccess: Access = ({ req: { user } }) => {
  if (!user) return true
  if (isStaff(user)) return true
  if (isCustomer(user)) {
    return {
      or: [
        { type: { not_equals: 'support' } },
        { customer: { equals: (user as any).id } },
      ],
    }
  }
  return false
}

const createAccess: Access = ({ req: { user }, data }) => {
  if (!user) return false
  if (isStaff(user)) {
    const role = staffRole(user)
    return role === 'admin' || role === 'manager'
  }
  if (isCustomer(user)) {
    // customers may only create their own support rooms
    const t = (data as any)?.type ?? 'support'
    const owner = (data as any)?.customer
    const cohort = (data as any)?.cohort
    if (t !== 'support') return false
    if (cohort) return false
    if (owner && String(owner) !== String((user as any).id)) return false
    return true
  }
  return false
}

const updateAccess: Access = ({ req: { user } }) => {
  if (!user) return false
  if (!isStaff(user)) return false
  const role = staffRole(user)
  return role === 'admin' || role === 'manager'
}

const deleteAccess: Access = ({ req: { user } }) => {
  if (!user) return false
  if (!isStaff(user)) return false
  return staffRole(user) === 'admin'
}

export const ChatRooms: CollectionConfig = {
  slug: 'chat-rooms',
  labels: {
    singular: 'Чат-комната',
    plural: 'Чат-комнаты',
  },
  admin: {
    useAsTitle: 'title',
    defaultColumns: [
      'title',
      'type',
      'customer',
      'lastMessageText',
      'unreadByStaff',
      'status',
      'lastMessageAt',
    ],
    listSearchableFields: ['title'],
    group: '💬 Мессенджер',
  },
  access: {
    read: readAccess,
    create: createAccess,
    update: updateAccess,
    delete: deleteAccess,
  },
  hooks: {
    beforeChange: [
      async ({ data, req, operation, originalDoc }) => {
        const user = req.user as any
        // Force support-room invariants when a customer creates/updates a room
        if (user && user.collection === 'customers') {
          data.type = 'support'
          data.customer = user.id
          data.cohort = null
          if (operation === 'create') data.status = data.status || 'open'
        }
        // Maintain closedAt when status toggles (any actor)
        if (operation === 'update') {
          const prevStatus = (originalDoc as any)?.status
          if (data.status && data.status !== prevStatus) {
            if (data.status === 'closed') data.closedAt = new Date().toISOString()
            if (data.status === 'open') data.closedAt = null
          }
        } else if (operation === 'create' && data.status === 'closed' && !data.closedAt) {
          data.closedAt = new Date().toISOString()
        }
        return data
      },
    ],
  },
  fields: [
    {
      name: 'supportChatUI',
      type: 'ui',
      admin: {
        condition: (data: any) => data?.type === 'support',
        components: {
          Field: '@/components/admin/SupportRoomChat',
        },
      },
    },
    {
      name: 'cohort',
      type: 'relationship',
      relationTo: 'course-cohorts' as any,
      required: false,
      label: 'Поток',
      admin: {
        condition: (data: any) => data?.type !== 'support',
      },
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
      name: 'customer',
      type: 'relationship',
      relationTo: 'customers',
      label: 'Клиент (обращение)',
      index: true,
      admin: {
        condition: (data: any) => data?.type === 'support',
        description: 'Владелец support-обращения',
      },
    },
    {
      name: 'assignee',
      type: 'relationship',
      relationTo: 'users',
      label: 'Менеджер',
      admin: {
        position: 'sidebar',
        condition: (data: any) => data?.type === 'support',
      },
    },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'open',
      label: 'Статус',
      options: [
        { label: 'Открыто', value: 'open' },
        { label: 'Закрыто', value: 'closed' },
      ],
      index: true,
      admin: {
        position: 'sidebar',
        condition: (data: any) => data?.type === 'support',
      },
    },
    {
      name: 'closedAt',
      type: 'date',
      label: 'Закрыто',
      admin: {
        position: 'sidebar',
        readOnly: true,
        condition: (data: any) => data?.type === 'support',
      },
    },
    {
      name: 'lastMessageText',
      type: 'text',
      label: 'Последнее сообщение',
      admin: { readOnly: true },
    },
    {
      name: 'lastMessageAt',
      type: 'date',
      label: 'Время последнего сообщения',
      index: true,
      admin: { readOnly: true },
    },
    {
      name: 'lastMessageSenderType',
      type: 'text',
      admin: { readOnly: true, hidden: true },
    },
    {
      name: 'unreadByStaff',
      type: 'number',
      defaultValue: 0,
      label: 'Новых для команды',
      index: true,
      admin: { readOnly: true },
    },
    {
      name: 'unreadByCustomer',
      type: 'number',
      defaultValue: 0,
      label: 'Новых для клиента',
      admin: { readOnly: true },
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
