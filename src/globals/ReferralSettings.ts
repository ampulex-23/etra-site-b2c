import type { GlobalConfig } from 'payload'

export const ReferralSettings: GlobalConfig = {
  slug: 'referral-settings',
  label: 'Реферальная программа',
  admin: {
    group: 'Настройки',
  },
  access: {
    read: ({ req: { user } }) => Boolean(user),
    update: ({ req: { user } }) => Boolean(user && user.collection === 'users'),
  },
  fields: [
    {
      name: 'enabled',
      type: 'checkbox',
      defaultValue: true,
      label: 'Реферальная программа включена',
    },
    {
      name: 'pointsPerOrder',
      type: 'number',
      defaultValue: 100,
      min: 0,
      label: 'Очков за заказ (базовое)',
      admin: {
        description: 'Базовое количество очков за каждый оплаченный заказ по реферальной ссылке',
        condition: (data) => data?.enabled,
      },
    },
    {
      name: 'pointsPercentOfOrder',
      type: 'number',
      defaultValue: 5,
      min: 0,
      max: 100,
      label: 'Процент от суммы заказа',
      admin: {
        description: 'Дополнительные очки = X% от суммы заказа (0 = отключено)',
        condition: (data) => data?.enabled,
      },
    },
    {
      name: 'levels',
      type: 'array',
      label: 'Уровни опыта',
      admin: {
        description: 'Настройка уровней и скидок. Уровни должны идти по возрастанию очков.',
        condition: (data) => data?.enabled,
      },
      defaultValue: [
        { name: 'Новичок', minPoints: 0, discountPercent: 0, color: '#9CA3AF' },
        { name: 'Бронза', minPoints: 100, discountPercent: 3, color: '#CD7F32' },
        { name: 'Серебро', minPoints: 500, discountPercent: 5, color: '#C0C0C0' },
        { name: 'Золото', minPoints: 1500, discountPercent: 7, color: '#FFD700' },
        { name: 'Платина', minPoints: 5000, discountPercent: 10, color: '#E5E4E2' },
        { name: 'Бриллиант', minPoints: 15000, discountPercent: 15, color: '#B9F2FF' },
      ],
      fields: [
        {
          name: 'name',
          type: 'text',
          required: true,
          label: 'Название уровня',
        },
        {
          name: 'minPoints',
          type: 'number',
          required: true,
          min: 0,
          label: 'Минимум очков',
        },
        {
          name: 'discountPercent',
          type: 'number',
          required: true,
          min: 0,
          max: 100,
          label: 'Скидка (%)',
        },
        {
          name: 'color',
          type: 'text',
          label: 'Цвет (HEX)',
          admin: {
            description: 'Цвет для отображения уровня, например #FFD700',
          },
        },
        {
          name: 'icon',
          type: 'upload',
          relationTo: 'media',
          label: 'Иконка уровня',
        },
      ],
    },
    {
      type: 'collapsible',
      label: 'Настройки шеринга',
      admin: {
        condition: (data) => data?.enabled,
      },
      fields: [
        {
          name: 'shareTitle',
          type: 'text',
          defaultValue: 'Посмотри этот товар!',
          label: 'Заголовок для шеринга',
        },
        {
          name: 'shareText',
          type: 'textarea',
          defaultValue: 'Рекомендую этот товар от ЭТРА 🌿',
          label: 'Текст для шеринга',
        },
        {
          name: 'enabledSources',
          type: 'select',
          hasMany: true,
          label: 'Доступные источники для шеринга',
          defaultValue: ['telegram', 'vk', 'whatsapp', 'copy'],
          options: [
            { label: 'Telegram', value: 'telegram' },
            { label: 'ВКонтакте', value: 'vk' },
            { label: 'WhatsApp', value: 'whatsapp' },
            { label: 'Копировать ссылку', value: 'copy' },
          ],
        },
      ],
    },
    {
      type: 'collapsible',
      label: 'Дополнительные настройки',
      admin: {
        condition: (data) => data?.enabled,
      },
      fields: [
        {
          name: 'cookieLifetimeDays',
          type: 'number',
          defaultValue: 30,
          min: 1,
          max: 365,
          label: 'Срок жизни реферальной метки (дней)',
          admin: {
            description: 'Сколько дней после клика по ссылке учитывается реферал',
          },
        },
        {
          name: 'minOrderAmountForPoints',
          type: 'number',
          defaultValue: 0,
          min: 0,
          label: 'Минимальная сумма заказа для начисления очков (₽)',
          admin: {
            description: '0 = без ограничений',
          },
        },
        {
          name: 'awardOnStatus',
          type: 'select',
          defaultValue: 'paid',
          label: 'Начислять очки при статусе заказа',
          options: [
            { label: 'Оплачен', value: 'paid' },
            { label: 'Доставлен', value: 'delivered' },
            { label: 'Завершён', value: 'completed' },
          ],
        },
      ],
    },
  ],
}
