import type { CollectionConfig } from 'payload'

export const Infoproducts: CollectionConfig = {
  slug: 'infoproducts',
  labels: {
    singular: 'Инфопродукт',
    plural: 'Инфопродукты',
  },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'type', 'price', 'status', 'durationDays'],
    group: '📚 Инфопродукты',
  },
  access: {
    read: ({ req: { user } }) => {
      if (user && user.collection === 'users') return true
      return { status: { equals: 'active' } }
    },
    create: ({ req: { user } }) => {
      if (!user) return false
      if (user.collection !== 'users') return false
      const role = (user as any).role
      return role === 'admin' || role === 'content'
    },
    update: ({ req: { user } }) => {
      if (!user) return false
      if (user.collection !== 'users') return false
      const role = (user as any).role
      return role === 'admin' || role === 'content'
    },
    delete: ({ req: { user } }) => {
      if (!user) return false
      if (user.collection !== 'users') return false
      return (user as any).role === 'admin'
    },
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
      label: 'Название',
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      label: 'Slug',
      admin: { position: 'sidebar' },
    },
    {
      name: 'type',
      type: 'select',
      required: true,
      defaultValue: 'course',
      label: 'Тип',
      options: [
        { label: 'Курс', value: 'course' },
        { label: 'Марафон', value: 'marathon' },
        { label: 'Программа', value: 'program' },
        { label: 'Ретрит', value: 'retreat' },
      ],
      admin: { position: 'sidebar' },
    },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'draft',
      label: 'Статус',
      options: [
        { label: 'Черновик', value: 'draft' },
        { label: 'Активен', value: 'active' },
        { label: 'В архиве', value: 'archived' },
      ],
      admin: { position: 'sidebar' },
    },
    {
      name: 'shortDescription',
      type: 'textarea',
      label: 'Краткое описание',
    },
    {
      name: 'description',
      type: 'richText',
      label: 'Полное описание',
    },
    {
      name: 'coverImage',
      type: 'upload',
      relationTo: 'media',
      label: 'Обложка',
    },
    {
      name: 'price',
      type: 'number',
      min: 0,
      label: 'Цена (₽)',
      admin: { position: 'sidebar' },
    },
    {
      name: 'oldPrice',
      type: 'number',
      min: 0,
      label: 'Старая цена (₽)',
      admin: { position: 'sidebar' },
    },
    {
      name: 'durationDays',
      type: 'number',
      min: 1,
      label: 'Длительность (дней)',
      admin: {
        position: 'sidebar',
        description: 'Количество дней активной фазы курса',
      },
    },
    {
      name: 'productBundle',
      type: 'relationship',
      relationTo: 'products',
      label: 'Товар-комплект',
      admin: {
        position: 'sidebar',
        description: 'Связанный товар (isBundle=true) с набором продуктов курса',
      },
    },
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Расписание (шаблон)',
          fields: [
            {
              name: 'scheduleMorning',
              type: 'richText',
              label: 'Утро ⭐️',
              admin: {
                description: 'Шаблон утреннего блока (применяется ко всем дням по умолчанию)',
              },
            },
            {
              name: 'scheduleDay',
              type: 'richText',
              label: 'День ☀️',
            },
            {
              name: 'scheduleEvening',
              type: 'richText',
              label: 'Вечер 🌙',
            },
          ],
        },
        {
          label: 'Диета и правила',
          fields: [
            {
              name: 'dietRecommendations',
              type: 'richText',
              label: 'Диетические рекомендации',
            },
            {
              name: 'contraindications',
              type: 'richText',
              label: 'Противопоказания',
            },
            {
              name: 'rules',
              type: 'richText',
              label: 'Общие правила курса',
            },
          ],
        },
        {
          label: 'Отчёты',
          fields: [
            {
              name: 'reportTemplate',
              type: 'array',
              label: 'Шаблон пунктов отчёта',
              admin: {
                description: 'Список пунктов, которые участник отмечает в ежедневном отчёте',
              },
              fields: [
                {
                  name: 'item',
                  type: 'text',
                  required: true,
                  label: 'Пункт отчёта',
                },
                {
                  name: 'emoji',
                  type: 'text',
                  label: 'Эмодзи',
                  defaultValue: '✅',
                },
              ],
            },
            {
              name: 'reportRules',
              type: 'group',
              label: 'Правила отчётности',
              fields: [
                {
                  name: 'maxMissed',
                  type: 'number',
                  min: 0,
                  defaultValue: 3,
                  label: 'Макс. пропусков до исключения',
                  admin: {
                    description: '0 = не исключать автоматически',
                  },
                },
                {
                  name: 'penalty',
                  type: 'richText',
                  label: 'Описание санкций',
                },
              ],
            },
          ],
        },
        {
          label: 'Команда',
          fields: [
            {
              name: 'team',
              type: 'array',
              label: 'Команда курса',
              fields: [
                {
                  name: 'name',
                  type: 'text',
                  required: true,
                  label: 'Имя',
                },
                {
                  name: 'role',
                  type: 'text',
                  required: true,
                  label: 'Роль',
                },
                {
                  name: 'avatar',
                  type: 'upload',
                  relationTo: 'media',
                  label: 'Фото',
                },
              ],
            },
          ],
        },
        {
          label: 'SEO',
          fields: [
            {
              name: 'seo',
              type: 'group',
              label: 'SEO',
              fields: [
                { name: 'title', type: 'text', label: 'Meta Title' },
                { name: 'description', type: 'textarea', label: 'Meta Description' },
                { name: 'ogImage', type: 'upload', relationTo: 'media', label: 'OG Image' },
              ],
            },
          ],
        },
      ],
    },
  ],
}
