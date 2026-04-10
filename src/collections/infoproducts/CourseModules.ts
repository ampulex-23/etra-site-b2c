import type { CollectionConfig } from 'payload'

export const CourseModules: CollectionConfig = {
  slug: 'course-modules',
  labels: {
    singular: 'Модуль курса',
    plural: 'Модули курсов',
  },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'infoproduct', 'type', 'icon', 'order'],
    group: '📚 Инфопродукты',
  },
  access: {
    read: ({ req: { user } }) => {
      if (!user) return true
      if (user && user.collection === 'users') return true
      // Customers can read visible modules (filtered by enrollment in API)
      if (user && user.collection === 'customers') {
        return { visible: { equals: true } }
      }
      return false
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
      defaultValue: 'custom',
      label: 'Тип модуля',
      options: [
        { label: 'Навигация', value: 'navigation' },
        { label: 'Расписание', value: 'schedule' },
        { label: 'Общение', value: 'communication' },
        { label: 'Эфиры', value: 'broadcasts' },
        { label: 'Вопросы к эфирам', value: 'qa' },
        { label: 'Отчёты', value: 'reports' },
        { label: 'Результаты', value: 'results' },
        { label: 'Спорт', value: 'sport' },
        { label: 'Рецепты', value: 'recipes' },
        { label: 'Протоколы', value: 'protocols' },
        { label: 'Продукция', value: 'products' },
        { label: 'Мотивация', value: 'motivation' },
        { label: 'Другое', value: 'custom' },
      ],
      admin: { position: 'sidebar' },
    },
    {
      name: 'icon',
      type: 'text',
      label: 'Иконка (эмодзи)',
      admin: {
        position: 'sidebar',
        description: 'Например: 📋, 🎞, ❗️, 🏆',
      },
    },
    {
      name: 'description',
      type: 'textarea',
      label: 'Описание модуля',
    },
    {
      name: 'content',
      type: 'richText',
      label: 'Контент',
    },
    {
      name: 'order',
      type: 'number',
      defaultValue: 0,
      label: 'Порядок сортировки',
      admin: { position: 'sidebar' },
    },
    {
      name: 'visible',
      type: 'checkbox',
      defaultValue: true,
      label: 'Виден участникам',
      admin: { position: 'sidebar' },
    },
  ],
}

