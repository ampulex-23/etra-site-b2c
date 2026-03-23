import type { CollectionConfig, Where } from 'payload'

export const Comments: CollectionConfig = {
  slug: 'comments',
  labels: {
    singular: 'Комментарий',
    plural: 'Комментарии',
  },
  admin: {
    useAsTitle: 'text',
    defaultColumns: ['text', 'author', 'contentType', 'status', 'createdAt'],
    group: 'Контент',
  },
  access: {
    read: ({ req: { user } }) => {
      // Admins/managers see all
      if (user && user.collection === 'users') return true
      // Public: only approved
      return { status: { equals: 'approved' } }
    },
    create: ({ req: { user } }) => {
      if (!user) return false
      return true
    },
    update: ({ req: { user } }) => {
      if (!user) return false
      // Admins/managers can edit any comment
      if (user.collection === 'users') return true
      // Customers can edit their own pending comments
      return {
        and: [
          { 'author.customer': { equals: user.id } },
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
      name: 'text',
      type: 'textarea',
      required: true,
      label: 'Текст',
    },
    {
      name: 'author',
      type: 'group',
      label: 'Автор',
      fields: [
        {
          name: 'customer',
          type: 'relationship',
          relationTo: 'customers',
          label: 'Покупатель',
          admin: {
            description: 'Если комментарий от покупателя',
          },
        },
        {
          name: 'user',
          type: 'relationship',
          relationTo: 'users',
          label: 'Сотрудник',
          admin: {
            description: 'Если комментарий от менеджера/администратора',
          },
        },
        {
          name: 'displayName',
          type: 'text',
          label: 'Отображаемое имя',
          admin: {
            description: 'Заполняется автоматически из профиля автора',
          },
        },
      ],
    },
    {
      name: 'contentType',
      type: 'select',
      required: true,
      label: 'Тип контента',
      options: [
        { label: 'Статья', value: 'post' },
        { label: 'Рецепт', value: 'recipe' },
      ],
      admin: { position: 'sidebar' },
    },
    {
      name: 'post',
      type: 'relationship',
      relationTo: 'posts',
      label: 'Статья',
      admin: {
        condition: (data) => data?.contentType === 'post',
      },
    },
    {
      name: 'recipe',
      type: 'relationship',
      relationTo: 'recipes',
      label: 'Рецепт',
      admin: {
        condition: (data) => data?.contentType === 'recipe',
      },
    },
    {
      name: 'parent',
      type: 'relationship',
      relationTo: 'comments' as any,
      label: 'Ответ на комментарий',
      admin: {
        description: 'Если это ответ на другой комментарий',
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
        { label: 'Одобрен', value: 'approved' },
        { label: 'Отклонён', value: 'rejected' },
      ],
      admin: { position: 'sidebar' },
    },
    {
      name: 'likes',
      type: 'number',
      defaultValue: 0,
      min: 0,
      label: 'Лайки',
      admin: { position: 'sidebar', readOnly: true },
    },
  ],
  hooks: {
    beforeChange: [
      async ({ data, operation, req }) => {
        if (operation === 'create' && data && !data.author?.displayName) {
          // Auto-fill displayName from customer or user
          try {
            if (data.author?.customer) {
              const customer = await req.payload.findByID({
                collection: 'customers',
                id: data.author.customer,
                depth: 0,
              })
              if (customer?.name) {
                data.author = { ...data.author, displayName: customer.name as string }
              }
            } else if (data.author?.user) {
              const user = await req.payload.findByID({
                collection: 'users',
                id: data.author.user,
                depth: 0,
              })
              if (user?.name) {
                data.author = { ...data.author, displayName: user.name as string }
              }
            }
          } catch {
            // Ignore errors in name resolution
          }
        }
        return data
      },
    ],
  },
}
