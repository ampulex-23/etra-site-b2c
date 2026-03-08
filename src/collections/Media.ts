import type { CollectionConfig } from 'payload'

export const Media: CollectionConfig = {
  slug: 'media',
  labels: {
    singular: 'Медиа',
    plural: 'Медиа',
  },
  admin: {
    group: '⚙️ Система',
  },
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      required: true,
      label: 'Alt текст',
    },
    {
      name: 'caption',
      type: 'text',
      label: 'Подпись',
    },
  ],
  upload: {
    mimeTypes: ['image/*', 'video/*', 'application/pdf'],
    imageSizes: [
      {
        name: 'thumbnail',
        width: 300,
        height: 300,
        position: 'centre',
      },
      {
        name: 'card',
        width: 600,
        height: 600,
        position: 'centre',
      },
      {
        name: 'full',
        width: 1200,
        height: undefined,
        position: 'centre',
      },
    ],
  },
}
