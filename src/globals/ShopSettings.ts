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
            { label: 'Т-Банк (Tinkoff)', value: 'tbank' },
            { label: 'ЮKassa', value: 'yokassa' },
          ],
          defaultValue: 'tbank',
          admin: {
            condition: (data) => data?.paymentEnabled,
          },
        },
        {
          type: 'row',
          admin: {
            condition: (data) => data?.paymentEnabled && data?.paymentProvider === 'tbank',
          },
          fields: [
            {
              name: 'tbankTerminalKey',
              type: 'text',
              label: 'Terminal Key',
              admin: {
                width: '50%',
                description: 'Идентификатор терминала из ЛК T-Bank',
              },
            },
            {
              name: 'tbankPassword',
              type: 'text',
              label: 'Пароль терминала',
              admin: {
                width: '50%',
                description: 'Пароль для подписи запросов',
              },
            },
          ],
        },
        {
          name: 'tbankDemoMode',
          type: 'checkbox',
          defaultValue: true,
          label: 'Демо-режим (тестовые платежи)',
          admin: {
            condition: (data) => data?.paymentEnabled && data?.paymentProvider === 'tbank',
            description: 'Включите для тестирования с демо-терминалом',
          },
        },
        {
          type: 'row',
          admin: {
            condition: (data) => data?.paymentEnabled && data?.paymentProvider === 'tbank' && data?.tbankDemoMode,
          },
          fields: [
            {
              name: 'tbankDemoTerminalKey',
              type: 'text',
              label: 'Demo Terminal Key',
              admin: {
                width: '50%',
                description: 'Тестовый терминал',
              },
            },
            {
              name: 'tbankDemoPassword',
              type: 'text',
              label: 'Demo Пароль',
              admin: {
                width: '50%',
              },
            },
          ],
        },
        {
          name: 'tbankSuccessUrl',
          type: 'text',
          label: 'URL успешной оплаты',
          defaultValue: '/payment/success',
          admin: {
            condition: (data) => data?.paymentEnabled && data?.paymentProvider === 'tbank',
            description: 'Путь на сайте после успешной оплаты',
          },
        },
        {
          name: 'tbankFailUrl',
          type: 'text',
          label: 'URL неуспешной оплаты',
          defaultValue: '/payment/fail',
          admin: {
            condition: (data) => data?.paymentEnabled && data?.paymentProvider === 'tbank',
            description: 'Путь на сайте после неуспешной оплаты',
          },
        },
        {
          name: 'tbankTaxation',
          type: 'select',
          label: 'Система налогообложения',
          options: [
            { label: 'ОСН', value: 'osn' },
            { label: 'УСН доходы', value: 'usn_income' },
            { label: 'УСН доходы-расходы', value: 'usn_income_outcome' },
            { label: 'ЕНВД', value: 'envd' },
            { label: 'ЕСН', value: 'esn' },
            { label: 'Патент', value: 'patent' },
          ],
          defaultValue: 'usn_income',
          admin: {
            condition: (data) => data?.paymentEnabled && data?.paymentProvider === 'tbank',
            description: 'Для фискализации (54-ФЗ)',
          },
        },
        {
          name: 'tbankTestStand',
          type: 'ui',
          admin: {
            condition: (data) => data?.paymentEnabled && (data?.paymentProvider === 'tbank' || data?.paymentProvider === 'tinkoff'),
            components: {
              Field: '/components/admin/PaymentTestStand#PaymentTestStand',
            },
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
