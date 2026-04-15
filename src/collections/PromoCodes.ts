import type { CollectionConfig } from 'payload'

export const PromoCodes: CollectionConfig = {
  slug: 'promo-codes',
  labels: {
    singular: 'Промокод',
    plural: 'Промокоды',
  },
  admin: {
    useAsTitle: 'code',
    defaultColumns: ['code', 'discountType', 'discountValue', 'active'],
    group: 'Каталог',
  },
  fields: [
    {
      name: 'code',
      type: 'text',
      required: true,
      unique: true,
      label: 'Код',
    },
    {
      name: 'discountType',
      type: 'select',
      required: true,
      label: 'Тип скидки',
      options: [
        { label: 'Процент', value: 'percent' },
        { label: 'Фиксированная сумма', value: 'fixed' },
      ],
    },
    {
      name: 'discountValue',
      type: 'number',
      required: true,
      min: 0,
      label: 'Размер скидки',
    },
    {
      name: 'minOrderAmount',
      type: 'number',
      min: 0,
      label: 'Мин. сумма заказа',
    },
    {
      name: 'maxUses',
      type: 'number',
      min: 0,
      label: 'Макс. использований',
    },
    {
      name: 'usedCount',
      type: 'number',
      defaultValue: 0,
      label: 'Использовано',
      admin: { readOnly: true },
    },
    {
      name: 'validFrom',
      type: 'date',
      label: 'Действует с',
      admin: {
        date: {
          displayFormat: 'yyyy-MM-dd',
        },
      },
    },
    {
      name: 'validTo',
      type: 'date',
      label: 'Действует до',
      admin: {
        date: {
          displayFormat: 'yyyy-MM-dd',
        },
      },
    },
    {
      name: 'active',
      type: 'checkbox',
      defaultValue: true,
      label: 'Активен',
      admin: { position: 'sidebar' },
    },
  ],
}
