import type { CollectionConfig } from 'payload'

export const Products: CollectionConfig = {
  slug: 'products',
  labels: {
    singular: 'Товар',
    plural: 'Товары',
  },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'images', 'price', 'category', 'status', 'inStock', 'featured'],
    group: 'Каталог',
    components: {
      beforeList: ['@/components/admin/ProductsViewToggle'],
    },
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
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'shortDescription',
      type: 'textarea',
      label: 'Краткое описание',
    },
    {
      name: 'description',
      type: 'richText',
      label: 'Описание',
    },
    {
      name: 'price',
      type: 'number',
      required: true,
      min: 0,
      label: 'Цена (₽)',
    },
    {
      name: 'oldPrice',
      type: 'number',
      min: 0,
      label: 'Старая цена (₽)',
    },
    {
      name: 'sku',
      type: 'text',
      unique: true,
      label: 'Артикул (SKU)',
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'images',
      type: 'array',
      label: 'Изображения',
      minRows: 1,
      admin: {
        components: {
          Cell: '@/components/admin/cells/ProductImageCell',
        },
      },
      fields: [
        {
          name: 'image',
          type: 'upload',
          relationTo: 'media',
          required: true,
        },
      ],
    },
    {
      name: 'category',
      type: 'relationship',
      relationTo: 'categories',
      label: 'Категория',
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'variants',
      type: 'array',
      label: 'Варианты',
      fields: [
        {
          name: 'name',
          type: 'text',
          required: true,
          label: 'Название варианта',
        },
        {
          name: 'price',
          type: 'number',
          required: true,
          min: 0,
          label: 'Цена (₽)',
        },
        {
          name: 'sku',
          type: 'text',
          label: 'Артикул',
        },
      ],
    },
    {
      name: 'composition',
      type: 'richText',
      label: 'Состав',
    },
    {
      name: 'usage',
      type: 'richText',
      label: 'Способ применения',
    },
    {
      name: 'weight',
      type: 'number',
      min: 0,
      label: 'Вес (г)',
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'isBundle',
      type: 'checkbox',
      defaultValue: false,
      label: 'Это набор (комплект)',
      admin: {
        position: 'sidebar',
        description: 'Набор автоматически раскладывается на базовые товары при списании',
        components: {
          Cell: '@/components/admin/cells/BoolCheckCell',
        },
      },
    },
    {
      name: 'bundleItems',
      type: 'array',
      label: 'Состав набора',
      admin: {
        description: 'Базовые товары, из которых состоит набор',
        condition: (data) => data?.isBundle === true,
      },
      fields: [
        {
          name: 'product',
          type: 'relationship',
          relationTo: 'products',
          required: true,
          label: 'Товар',
        },
        {
          name: 'quantity',
          type: 'number',
          required: true,
          min: 1,
          defaultValue: 1,
          label: 'Количество в наборе',
        },
      ],
    },
    {
      name: 'inStock',
      type: 'checkbox',
      defaultValue: true,
      label: 'В наличии',
      admin: {
        position: 'sidebar',
        components: {
          Cell: '@/components/admin/cells/BoolCheckCell',
        },
      },
    },
    {
      name: 'featured',
      type: 'checkbox',
      defaultValue: false,
      label: 'На главной',
      admin: {
        position: 'sidebar',
        components: {
          Cell: '@/components/admin/cells/BoolCheckCell',
        },
      },
    },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'active',
      label: 'Статус',
      options: [
        { label: 'Активен', value: 'active' },
        { label: 'Скрыт', value: 'hidden' },
        { label: 'В архиве', value: 'archived' },
      ],
      admin: {
        position: 'sidebar',
      },
    },
    {
      type: 'collapsible',
      label: 'Партнёрская цена (МЛМ)',
      admin: {
        initCollapsed: true,
        description: 'Настройки партнёрской цены для МЛМ-партнёров',
      },
      fields: [
        {
          name: 'partnerPriceOverride',
          type: 'number',
          min: 0,
          label: 'Партнёрская цена (₽)',
          admin: {
            description: 'Если задано — используется вместо глобального % скидки. Оставьте пустым для расчёта по глобальному %',
          },
        },
        {
          name: 'partnerDiscountPercentOverride',
          type: 'number',
          min: 0,
          max: 100,
          label: 'Индивидуальный % партнёрской скидки',
          admin: {
            description: 'Переопределение глобального % партнёрской скидки для этого товара',
          },
        },
        {
          name: 'excludeFromPartnerDiscount',
          type: 'checkbox',
          defaultValue: false,
          label: 'Исключить из партнёрской скидки',
          admin: {
            description: 'Товар всегда продаётся по розничной цене даже партнёрам',
            components: {
              Cell: '@/components/admin/cells/BoolCheckCell',
            },
          },
        },
      ],
    },
    {
      name: 'amoCrmId',
      type: 'number',
      label: 'ID в amoCRM',
      admin: {
        position: 'sidebar',
        readOnly: true,
      },
    },
    {
      name: 'seo',
      type: 'group',
      label: 'SEO',
      fields: [
        {
          name: 'title',
          type: 'text',
          label: 'Meta Title',
        },
        {
          name: 'description',
          type: 'textarea',
          label: 'Meta Description',
        },
        {
          name: 'ogImage',
          type: 'upload',
          relationTo: 'media',
          label: 'OG Image',
        },
      ],
    },
  ],
}
