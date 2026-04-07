import type { CollectionConfig } from 'payload'

// Hook to auto-set folder from URL parameter when creating new media
const setFolderFromURL = ({ req, data }: any) => {
  // Only set folder on create if not already set
  if (!data?.folder && req?.query?.folder) {
    return {
      ...data,
      folder: req.query.folder,
    }
  }
  return data
}

export const Media: CollectionConfig = {
  slug: 'media',
  labels: {
    singular: 'Медиа',
    plural: 'Медиа',
  },
  admin: {
    group: 'Система',
    defaultColumns: ['filename', 'folder', 'alt', 'updatedAt'],
    components: {
      beforeList: ['@/components/admin/MediaFolderBrowser#MediaFolderBrowser'],
    },
  },
  hooks: {
    beforeChange: [setFolderFromURL],
  },
  access: {
    read: () => true,
    create: ({ req: { user } }) => Boolean(user),
    update: ({ req: { user } }) => Boolean(user),
    delete: ({ req: { user } }) => {
      if (!user) return false
      return user.collection === 'users'
    },
  },
  fields: [
    {
      name: 'folder',
      type: 'text',
      label: 'Папка',
      admin: {
        position: 'sidebar',
        description: 'Путь к папке в S3 (например: products/bottles или articles/covers)',
      },
      hooks: {
        beforeChange: [
          ({ value }) => {
            // Normalize folder path: remove leading/trailing slashes, convert to lowercase
            if (!value) return ''
            return value
              .trim()
              .replace(/^\/+|\/+$/g, '') // Remove leading/trailing slashes
              .replace(/\/{2,}/g, '/') // Replace multiple slashes with single
              .toLowerCase()
          },
        ],
      },
    },
    {
      name: 'aiAssistant',
      type: 'ui',
      admin: {
        components: {
          Field: '@/components/admin/MediaAIAssistant#MediaAIAssistant',
        },
      },
    },
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
