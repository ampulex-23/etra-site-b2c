import type { CollectionConfig } from 'payload'

export const Categories: CollectionConfig = {
  slug: 'categories',
  labels: {
    singular: 'Категория',
    plural: 'Категории',
  },
  admin: {
    useAsTitle: 'title',
    group: '📦 Каталог',
  },
  access: {
    read: () => true,
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
    },
    {
      name: 'description',
      type: 'textarea',
      label: 'Описание',
    },
    {
      name: 'icon',
      type: 'upload',
      relationTo: 'media',
      label: 'Иконка',
    },
    {
      name: 'parent',
      type: 'relationship',
      relationTo: 'categories',
      label: 'Родительская категория',
    },
    {
      name: 'order',
      type: 'number',
      defaultValue: 0,
      label: 'Порядок сортировки',
    },
  ],
}
