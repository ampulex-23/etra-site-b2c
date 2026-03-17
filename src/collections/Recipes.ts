import type { CollectionConfig } from 'payload'

export const Recipes: CollectionConfig = {
  slug: 'recipes',
  labels: {
    singular: 'Рецепт',
    plural: 'Рецепты',
  },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'difficulty', 'prepTime', 'status', 'publishedAt'],
    group: 'Контент',
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
      admin: { position: 'sidebar' },
    },
    {
      name: 'excerpt',
      type: 'textarea',
      label: 'Краткое описание',
    },
    {
      name: 'coverImage',
      type: 'upload',
      relationTo: 'media',
      label: 'Обложка',
    },
    {
      name: 'difficulty',
      type: 'select',
      label: 'Сложность',
      defaultValue: 'easy',
      options: [
        { label: 'Просто', value: 'easy' },
        { label: 'Средне', value: 'medium' },
        { label: 'Сложно', value: 'hard' },
      ],
      admin: { position: 'sidebar' },
    },
    {
      name: 'prepTime',
      type: 'number',
      min: 0,
      label: 'Время подготовки (мин)',
      admin: { position: 'sidebar' },
    },
    {
      name: 'fermentationTime',
      type: 'text',
      label: 'Время ферментации',
      admin: {
        position: 'sidebar',
        description: 'Например: 3-5 дней, 2 недели',
      },
    },
    {
      name: 'servings',
      type: 'number',
      min: 1,
      label: 'Порций',
      admin: { position: 'sidebar' },
    },
    {
      name: 'ingredients',
      type: 'array',
      label: 'Ингредиенты',
      fields: [
        {
          name: 'name',
          type: 'text',
          required: true,
          label: 'Название',
        },
        {
          name: 'amount',
          type: 'text',
          label: 'Количество',
          admin: {
            description: 'Например: 500 мл, 2 ст.л., 1 пакет',
          },
        },
        {
          name: 'optional',
          type: 'checkbox',
          defaultValue: false,
          label: 'Необязательный',
        },
      ],
    },
    {
      name: 'steps',
      type: 'array',
      label: 'Шаги приготовления',
      fields: [
        {
          name: 'step',
          type: 'richText',
          required: true,
          label: 'Описание шага',
        },
        {
          name: 'image',
          type: 'upload',
          relationTo: 'media',
          label: 'Фото шага',
        },
        {
          name: 'tip',
          type: 'text',
          label: 'Совет',
        },
      ],
    },
    {
      name: 'content',
      type: 'richText',
      label: 'Дополнительное описание',
    },
    {
      name: 'relatedProducts',
      type: 'relationship',
      relationTo: 'products',
      hasMany: true,
      label: 'Используемые продукты',
      admin: {
        description: 'Закваски и другие продукты ЭТРА для этого рецепта',
      },
    },
    {
      name: 'tags',
      type: 'array',
      label: 'Теги',
      fields: [
        {
          name: 'tag',
          type: 'text',
          required: true,
        },
      ],
    },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'draft',
      label: 'Статус',
      options: [
        { label: 'Черновик', value: 'draft' },
        { label: 'Опубликовано', value: 'published' },
      ],
      admin: { position: 'sidebar' },
    },
    {
      name: 'publishedAt',
      type: 'date',
      label: 'Дата публикации',
      admin: { position: 'sidebar' },
    },
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
}
