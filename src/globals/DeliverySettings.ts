import type { GlobalConfig } from 'payload'

export const DeliverySettings: GlobalConfig = {
  slug: 'delivery-settings',
  label: 'Доставка',
  admin: {
    group: 'Настройки',
  },
  access: {
    read: ({ req: { user } }) => Boolean(user),
    update: ({ req: { user } }) => Boolean(user),
  },
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
        components: {
          Field: '@/components/admin/AddressAutocomplete',
        },
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
          label: 'Код города отправителя СДЭК',
          defaultValue: '119',
          admin: {
            condition: (data) => data?.cdekEnabled,
            description: 'Числовой код города в системе СДЭК. Примеры: 44 = Москва, 137 = СПб, 119 = Сочи. Найти код: https://api-docs.cdek.ru/36990336.html',
          },
        },
        {
          name: 'cdekSenderAddress',
          type: 'text',
          label: 'Адрес отправителя (для накладной)',
          admin: {
            condition: (data) => data?.cdekEnabled,
            description: 'Полный адрес для печати на накладной (например: Краснодарский край, г Сочи, ул Транспортная, д 17А)',
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
        {
          name: 'cdekSenderName',
          type: 'text',
          label: 'Имя отправителя',
          defaultValue: 'ЭТРА',
          admin: {
            condition: (data) => data?.cdekEnabled,
          },
        },
        {
          name: 'cdekSenderPhone',
          type: 'text',
          label: 'Телефон отправителя',
          admin: {
            condition: (data) => data?.cdekEnabled,
            description: 'Формат: +79991234567',
          },
        },
        {
          name: 'cdekSenderAddress',
          type: 'text',
          label: 'Адрес отправителя',
          admin: {
            condition: (data) => data?.cdekEnabled,
            description: 'Улица, дом — для забора курьером',
            components: {
              Field: '@/components/admin/AddressAutocomplete',
            },
          },
        },
        {
          name: 'cdekDefaultWeight',
          type: 'number',
          label: 'Вес по умолчанию (г)',
          defaultValue: 500,
          admin: {
            condition: (data) => data?.cdekEnabled,
            description: 'Вес товара если не указан в карточке',
          },
        },
        {
          name: 'cdekWebhookUrl',
          type: 'text',
          label: 'URL вебхука',
          admin: {
            condition: (data) => data?.cdekEnabled,
            readOnly: true,
            description: 'Автоматически: /api/cdek/webhook. Зарегистрируйте в ЛК СДЭК или через API.',
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
}
