import type { GlobalConfig } from 'payload'

export const ReferralSettings: GlobalConfig = {
  slug: 'referral-settings',
  label: 'Реферальная программа и МЛМ',
  admin: {
    group: 'Настройки',
  },
  access: {
    read: ({ req: { user } }) => Boolean(user),
    update: ({ req: { user } }) => Boolean(user && user.collection === 'users'),
  },
  fields: [
    // ================= ОСНОВНОЕ =================
    {
      name: 'enabled',
      type: 'checkbox',
      defaultValue: true,
      label: 'Реферальная программа включена',
    },
    {
      name: 'promoCodePattern',
      type: 'select',
      defaultValue: 'uppercase_name',
      label: 'Шаблон промокода',
      options: [
        { label: 'Имя заглавными + случайные цифры (MARIA24)', value: 'uppercase_name' },
        { label: 'Случайные 6 символов', value: 'random_6' },
        { label: 'Пользовательский (задаётся вручную)', value: 'custom' },
      ],
    },

    // ================= РЕФЕРАЛКА =================
    {
      type: 'collapsible',
      label: '📣 Реферальная программа',
      admin: {
        initCollapsed: false,
        condition: (data) => data?.enabled,
      },
      fields: [
        {
          name: 'commissionFirstPurchase',
          type: 'number',
          defaultValue: 10,
          min: 0,
          max: 100,
          label: 'Комиссия с первой покупки реферала (%)',
        },
        {
          name: 'commissionRepeatPurchase',
          type: 'number',
          defaultValue: 9,
          min: 0,
          max: 100,
          label: 'Комиссия с повторных покупок (%)',
        },
        {
          name: 'customerDiscountFirstPurchase',
          type: 'number',
          defaultValue: 10,
          min: 0,
          max: 100,
          label: 'Скидка клиенту при первой покупке (%)',
        },
        {
          name: 'attributionLifetime',
          type: 'select',
          defaultValue: 'lifetime',
          label: 'Тип привязки клиента к партнёру',
          options: [
            { label: 'Пожизненно', value: 'lifetime' },
            { label: 'На N дней', value: 'days' },
          ],
        },
        {
          name: 'attributionDays',
          type: 'number',
          defaultValue: 30,
          min: 1,
          max: 3650,
          label: 'Срок привязки (дней)',
          admin: {
            condition: (data) => data?.attributionLifetime === 'days',
          },
        },
        {
          name: 'awardOnOrderStatus',
          type: 'select',
          defaultValue: 'paid',
          label: 'Когда начислять комиссию',
          options: [
            { label: 'Оплачен', value: 'paid' },
            { label: 'Доставлен', value: 'delivered' },
            { label: 'Завершён', value: 'completed' },
          ],
        },
        {
          name: 'minOrderAmountForCommission',
          type: 'number',
          defaultValue: 0,
          min: 0,
          label: 'Мин. сумма заказа для комиссии (₽)',
          admin: { description: '0 = без ограничений' },
        },
      ],
    },

    // ================= МЛМ =================
    {
      type: 'collapsible',
      label: '💼 МЛМ-система',
      admin: {
        initCollapsed: false,
        condition: (data) => data?.enabled,
      },
      fields: [
        {
          name: 'mlmEnabled',
          type: 'checkbox',
          defaultValue: true,
          label: 'МЛМ включён',
        },
        {
          name: 'level1Commission',
          type: 'number',
          defaultValue: 9,
          min: 0,
          max: 100,
          label: 'Комиссия 1 уровня (%)',
        },
        {
          name: 'level2Commission',
          type: 'number',
          defaultValue: 9,
          min: 0,
          max: 100,
          label: 'Комиссия 2 уровня (%)',
        },
        {
          name: 'level3Commission',
          type: 'number',
          defaultValue: 3,
          min: 0,
          max: 100,
          label: 'Комиссия 3 уровня (%)',
        },
        {
          name: 'teamBonusEnabled',
          type: 'checkbox',
          defaultValue: true,
          label: 'Командный бонус включён',
        },
        {
          name: 'teamBonusPercent',
          type: 'number',
          defaultValue: 3,
          min: 0,
          max: 100,
          label: 'Командный бонус (%)',
        },
        {
          name: 'teamBonusThreshold',
          type: 'number',
          defaultValue: 500000,
          min: 0,
          label: 'Порог оборота команды для бонуса (₽/мес)',
        },
        {
          name: 'partnerDiscountPercent',
          type: 'number',
          defaultValue: 21,
          min: 0,
          max: 100,
          label: 'Партнёрская скидка (%)',
          admin: {
            description: 'Скидка от розницы для МЛМ-партнёров. Можно переопределить на уровне товара.',
          },
        },
        {
          name: 'autoQualifyEnabled',
          type: 'checkbox',
          defaultValue: true,
          label: 'Автоквалификация в МЛМ',
          admin: {
            description: 'Автоматически давать статус МЛМ-партнёра клиентам с большими закупками',
          },
        },
        {
          name: 'autoQualifyThreshold',
          type: 'number',
          defaultValue: 60000,
          min: 0,
          label: 'Порог автоквалификации (₽)',
        },
        {
          name: 'autoQualifyPeriodMonths',
          type: 'number',
          defaultValue: 6,
          min: 1,
          max: 36,
          label: 'Период автоквалификации (месяцев)',
        },
        {
          name: 'starterKitProducts',
          type: 'relationship',
          relationTo: 'products',
          hasMany: true,
          label: 'Товары стартового набора',
          admin: {
            description: 'Какие товары считаются "партнёрским стартовым набором"',
          },
        },
        {
          name: 'minOrderForMLMEntry',
          type: 'number',
          defaultValue: 7000,
          min: 0,
          label: 'Мин. сумма заказа для входа в МЛМ (₽)',
        },
        {
          name: 'invitationExpiryDays',
          type: 'number',
          defaultValue: 90,
          min: 1,
          max: 3650,
          label: 'Срок действия инвайт-кода (дней)',
        },
      ],
    },

    // ================= ФОНД МАРКЕТИНГА =================
    {
      type: 'collapsible',
      label: '🎯 Фонд маркетинга',
      admin: {
        initCollapsed: true,
        condition: (data) => data?.enabled,
      },
      fields: [
        {
          name: 'marketingFundEnabled',
          type: 'checkbox',
          defaultValue: false,
          label: 'Фонд маркетинга включён',
        },
        {
          name: 'marketingFundPercent',
          type: 'number',
          defaultValue: 1,
          min: 0,
          max: 100,
          label: 'Процент от прибыли в фонд (%)',
        },
        {
          name: 'marketingFundMinTurnover',
          type: 'number',
          defaultValue: 100000,
          min: 0,
          label: 'Мин. оборот партнёра для доли в фонде (₽/мес)',
        },
      ],
    },

    // ================= ВЫПЛАТЫ =================
    {
      type: 'collapsible',
      label: '💰 Выплаты',
      admin: {
        initCollapsed: true,
        condition: (data) => data?.enabled,
      },
      fields: [
        {
          name: 'minPayoutAmount',
          type: 'number',
          defaultValue: 500,
          min: 0,
          label: 'Минимальная сумма выплаты (₽)',
        },
        {
          name: 'payoutMethods',
          type: 'select',
          hasMany: true,
          defaultValue: ['bank_card', 'sbp'],
          label: 'Доступные методы выплаты',
          options: [
            { label: 'Банковская карта', value: 'bank_card' },
            { label: 'СБП (по телефону)', value: 'sbp' },
            { label: 'Самозанятый (через сервис)', value: 'self_employed_service' },
            { label: 'Кооперативная выплата (через ЦК)', value: 'cooperative_payout' },
            { label: 'На баланс (пополнение)', value: 'balance_credit' },
          ],
        },
        {
          name: 'payoutRequestCooldownDays',
          type: 'number',
          defaultValue: 0,
          min: 0,
          label: 'Задержка между заявками (дней)',
          admin: { description: '0 = без задержки' },
        },
      ],
    },

    // ================= ШЕРИНГ =================
    {
      type: 'collapsible',
      label: '📢 Шеринг',
      admin: {
        initCollapsed: true,
        condition: (data) => data?.enabled,
      },
      fields: [
        {
          name: 'shareTitle',
          type: 'text',
          defaultValue: 'Рекомендую ЭТРА!',
          label: 'Заголовок для шеринга',
        },
        {
          name: 'shareText',
          type: 'textarea',
          defaultValue: 'Попробуй натуральные продукты ЭТРА — для микробиома и здоровья кишечника. Скидка 10% по моему промокоду 🌿',
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

    // ================= ПОДГОТОВКА К ЦК =================
    {
      type: 'collapsible',
      label: '🏛 Цифровой Кооператив (будущая интеграция)',
      admin: {
        initCollapsed: true,
        description: 'Настройки для интеграции с Цифровым Кооперативом. Сейчас не используются.',
      },
      fields: [
        {
          name: 'cooperativeEnabled',
          type: 'checkbox',
          defaultValue: false,
          label: 'Интеграция с ЦК включена',
        },
        {
          name: 'cooperativeId',
          type: 'text',
          label: 'ID кооператива в COOPOS',
        },
        {
          name: 'cooperativeProviderUrl',
          type: 'text',
          label: 'URL провайдера ЦК',
        },
        {
          name: 'cooperativeApiKey',
          type: 'text',
          label: 'API ключ ЦК',
          admin: { description: 'Хранится в глобале для удобства; в проде лучше в env' },
        },
        {
          name: 'cooperativeCPPReferralId',
          type: 'text',
          label: 'ID ЦПП "Рефералка ЭТРА"',
        },
        {
          name: 'cooperativeCPPMLMId',
          type: 'text',
          label: 'ID ЦПП "МЛМ ЭТРА"',
        },
      ],
    },
  ],
}
