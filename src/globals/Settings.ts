import type { GlobalConfig } from 'payload'

export const Settings: GlobalConfig = {
  slug: 'settings',
  label: 'Настройки',
  admin: {
    group: '⚙️ Настройки',
  },
  access: {
    read: ({ req: { user } }) => Boolean(user),
  },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: '🤖 ИИ Агент',
          fields: [
            {
              name: 'aiApiUrl',
              type: 'text',
              label: 'API URL',
              defaultValue: 'https://api.polza.ai/v1/chat/completions',
              admin: {
                description: 'URL API-эндпоинта (совместимого с OpenRouter/OpenAI)',
              },
            },
            {
              name: 'aiApiKey',
              type: 'text',
              label: 'API Key',
              admin: {
                description: 'Секретный ключ для доступа к API',
              },
            },
            {
              name: 'aiTextModel',
              type: 'text',
              label: 'Модель для текста',
              defaultValue: 'openai/gpt-4.1-mini',
              admin: {
                description: 'Например: openai/gpt-4.1-mini, anthropic/claude-3.5-sonnet, google/gemini-2.0-flash',
              },
            },
            {
              name: 'aiImageModel',
              type: 'text',
              label: 'Модель для картинок',
              defaultValue: 'openai/dall-e-3',
              admin: {
                description: 'Например: openai/dall-e-3, stability/sdxl',
              },
            },
            {
              name: 'aiTemperature',
              type: 'number',
              label: 'Temperature',
              defaultValue: 0.7,
              min: 0,
              max: 2,
              admin: {
                description: 'Креативность генерации (0 = точно, 2 = максимально креативно)',
                step: 0.1,
              },
            },
            {
              name: 'aiMaxTokens',
              type: 'number',
              label: 'Max Tokens',
              defaultValue: 2000,
              min: 100,
              max: 16000,
              admin: {
                description: 'Максимальная длина ответа в токенах',
              },
            },
          ],
        },
        {
          label: '🚚 Доставка',
          fields: [
            {
              name: 'deliveryPickupEnabled',
              type: 'checkbox',
              defaultValue: true,
              label: 'Самовывоз включён',
            },
            {
              name: 'deliveryPickupAddress',
              type: 'text',
              label: 'Адрес самовывоза',
              admin: {
                condition: (data) => data?.deliveryPickupEnabled,
              },
            },
            {
              type: 'collapsible',
              label: 'СДЭК',
              fields: [
                {
                  name: 'cdekEnabled',
                  type: 'checkbox',
                  defaultValue: false,
                  label: 'СДЭК включён',
                },
                {
                  name: 'cdekAccount',
                  type: 'text',
                  label: 'Account (Client ID)',
                  admin: {
                    condition: (data) => data?.cdekEnabled,
                    description: 'Идентификатор клиента из ЛК СДЭК',
                  },
                },
                {
                  name: 'cdekSecurePassword',
                  type: 'text',
                  label: 'Secure Password',
                  admin: {
                    condition: (data) => data?.cdekEnabled,
                    description: 'Секретный ключ из ЛК СДЭК',
                  },
                },
                {
                  name: 'cdekTestMode',
                  type: 'checkbox',
                  defaultValue: true,
                  label: 'Тестовый режим',
                  admin: {
                    condition: (data) => data?.cdekEnabled,
                  },
                },
                {
                  name: 'cdekSenderCity',
                  type: 'text',
                  label: 'Город отправителя (код СДЭК)',
                  defaultValue: '44',
                  admin: {
                    condition: (data) => data?.cdekEnabled,
                    description: 'Код города в системе СДЭК (44 = Москва)',
                  },
                },
                {
                  name: 'cdekTariffCode',
                  type: 'number',
                  label: 'Код тарифа по умолчанию',
                  defaultValue: 139,
                  admin: {
                    condition: (data) => data?.cdekEnabled,
                    description: '139 = посылка дверь-ПВЗ, 138 = посылка дверь-дверь',
                  },
                },
              ],
            },
            {
              type: 'collapsible',
              label: 'Почта России',
              fields: [
                {
                  name: 'russianPostEnabled',
                  type: 'checkbox',
                  defaultValue: false,
                  label: 'Почта России включена',
                },
                {
                  name: 'russianPostToken',
                  type: 'text',
                  label: 'API Token',
                  admin: {
                    condition: (data) => data?.russianPostEnabled,
                    description: 'Токен API Почты России (otpravka.pochta.ru)',
                  },
                },
                {
                  name: 'russianPostLogin',
                  type: 'text',
                  label: 'Логин',
                  admin: {
                    condition: (data) => data?.russianPostEnabled,
                  },
                },
                {
                  name: 'russianPostPassword',
                  type: 'text',
                  label: 'Пароль',
                  admin: {
                    condition: (data) => data?.russianPostEnabled,
                  },
                },
                {
                  name: 'russianPostSenderIndex',
                  type: 'text',
                  label: 'Индекс отправителя',
                  admin: {
                    condition: (data) => data?.russianPostEnabled,
                    description: 'Почтовый индекс точки отправки',
                  },
                },
              ],
            },
            {
              name: 'pickupPoints',
              type: 'array',
              label: 'Пункты выдачи (ПВЗ)',
              admin: {
                description: 'Собственные точки самовывоза',
              },
              fields: [
                {
                  name: 'name',
                  type: 'text',
                  required: true,
                  label: 'Название',
                },
                {
                  name: 'address',
                  type: 'text',
                  required: true,
                  label: 'Адрес',
                },
                {
                  name: 'city',
                  type: 'text',
                  label: 'Город',
                },
                {
                  name: 'phone',
                  type: 'text',
                  label: 'Телефон',
                },
                {
                  name: 'workingHours',
                  type: 'text',
                  label: 'Часы работы',
                  admin: {
                    description: 'Например: Пн-Пт 10:00-20:00, Сб 10:00-18:00',
                  },
                },
                {
                  name: 'lat',
                  type: 'number',
                  label: 'Широта',
                },
                {
                  name: 'lng',
                  type: 'number',
                  label: 'Долгота',
                },
                {
                  name: 'active',
                  type: 'checkbox',
                  defaultValue: true,
                  label: 'Активен',
                },
              ],
            },
          ],
        },
      ],
    },
  ],
}
