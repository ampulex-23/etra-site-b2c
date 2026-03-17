import type { GlobalConfig } from 'payload'

export const ShopSettings: GlobalConfig = {
  slug: 'shop-settings',
  label: 'Магазин',
  admin: {
    group: 'Настройки',
  },
  access: {
    read: ({ req: { user } }) => Boolean(user),
    update: ({ req: { user } }) => Boolean(user),
  },
  fields: [
    {
      type: 'collapsible',
      label: 'Telegram авторизация',
      fields: [
        {
          name: 'telegramBotToken',
          type: 'text',
          label: 'Токен Telegram-бота',
          admin: {
            description: 'Токен бота из @BotFather для авторизации клиентов через Telegram Login Widget',
          },
        },
        {
          name: 'telegramBotUsername',
          type: 'text',
          label: 'Username бота (без @)',
          admin: {
            description: 'Имя бота для Telegram Login Widget, например: etra_auth_bot',
          },
        },
      ],
    },
    {
      type: 'collapsible',
      label: 'Оплата',
      fields: [
        {
          name: 'paymentEnabled',
          type: 'checkbox',
          defaultValue: false,
          label: 'Онлайн-оплата включена',
        },
        {
          name: 'paymentProvider',
          type: 'select',
          label: 'Провайдер оплаты',
          options: [
            { label: 'ЮKassa', value: 'yokassa' },
            { label: 'Тинькофф', value: 'tinkoff' },
          ],
          admin: {
            condition: (data) => data?.paymentEnabled,
          },
        },
        {
          name: 'paymentApiKey',
          type: 'text',
          label: 'API ключ провайдера',
          admin: {
            condition: (data) => data?.paymentEnabled,
          },
        },
        {
          name: 'paymentShopId',
          type: 'text',
          label: 'ID магазина',
          admin: {
            condition: (data) => data?.paymentEnabled,
          },
        },
      ],
    },
    {
      type: 'collapsible',
      label: 'Общие настройки',
      fields: [
        {
          name: 'minOrderAmount',
          type: 'number',
          defaultValue: 0,
          min: 0,
          label: 'Минимальная сумма заказа (₽)',
        },
        {
          name: 'freeDeliveryThreshold',
          type: 'number',
          defaultValue: 0,
          min: 0,
          label: 'Бесплатная доставка от (₽)',
          admin: {
            description: '0 = бесплатная доставка отключена',
          },
        },
      ],
    },
  ],
}
