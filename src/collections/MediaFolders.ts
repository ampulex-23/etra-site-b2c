import type { CollectionConfig } from 'payload'

/**
 * Persistent storage for media folder paths used by the Media Explorer.
 *
 * Folders derived implicitly from media documents are fine for navigation,
 * but users also need to create empty folders ahead of uploading files
 * into them. This tiny collection holds those explicit folder entries.
 *
 * A folder is represented by its full normalized path
 * (lowercase, slash-separated, no leading/trailing slashes), e.g.
 *   "products/bottles", "articles/covers/hero".
 *
 * Parent folders are implicit -- creating "a/b/c" also makes "a" and "a/b"
 * navigable via the Explorer's breadcrumbs / sidebar.
 */
export const MediaFolders: CollectionConfig = {
  slug: 'media-folders',
  labels: {
    singular: 'Папка медиа',
    plural: 'Папки медиа',
  },
  admin: {
    group: 'Система',
    defaultColumns: ['path', 'updatedAt'],
    // This collection is an implementation detail of the Media Explorer --
    // hide it from the sidebar (it's still accessible via direct URL for
    // debugging).
    hidden: ({ user }) => {
      if (!user) return true
      return user.collection !== 'users'
    },
    useAsTitle: 'path',
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
      name: 'path',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      label: 'Путь',
      hooks: {
        beforeChange: [
          ({ value }) => {
            if (typeof value !== 'string') return value
            return value
              .trim()
              .replace(/^\/+|\/+$/g, '')
              .replace(/\/{2,}/g, '/')
              .toLowerCase()
          },
        ],
      },
    },
  ],
}

export default MediaFolders
