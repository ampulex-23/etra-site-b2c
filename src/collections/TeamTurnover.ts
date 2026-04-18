import type { CollectionConfig } from 'payload'

export const TeamTurnover: CollectionConfig = {
  slug: 'team-turnover',
  labels: {
    singular: 'Оборот команды',
    plural: 'Обороты команд',
  },
  admin: {
    useAsTitle: 'id',
    defaultColumns: ['partner', 'month', 'totalTeamTurnover', 'teamBonusAwarded'],
    group: 'Реферальная программа',
    description: 'Агрегация оборота команды по месяцам (для командного бонуса)',
  },
  access: {
    read: ({ req: { user } }) => {
      if (!user) return false
      if (user.collection === 'users') return true
      return { partnerCustomer: { equals: user.id } } as any
    },
    create: ({ req: { user } }) => Boolean(user && user.collection === 'users'),
    update: ({ req: { user } }) => Boolean(user && user.collection === 'users'),
    delete: ({ req: { user } }) => Boolean(user && user.collection === 'users'),
  },
  fields: [
    {
      name: 'partner',
      type: 'relationship',
      relationTo: 'referral-partners',
      required: true,
      label: 'Партнёр',
    },
    {
      name: 'partnerCustomer',
      type: 'relationship',
      relationTo: 'customers',
      label: 'Клиент-партнёр',
      admin: { readOnly: true },
    },
    {
      name: 'month',
      type: 'text',
      required: true,
      index: true,
      label: 'Месяц (YYYY-MM)',
    },
    {
      name: 'personalSales',
      type: 'number',
      defaultValue: 0,
      label: 'Личные продажи (₽)',
    },
    {
      name: 'level1Turnover',
      type: 'number',
      defaultValue: 0,
      label: 'Оборот 1 уровня (₽)',
    },
    {
      name: 'level2Turnover',
      type: 'number',
      defaultValue: 0,
      label: 'Оборот 2 уровня (₽)',
    },
    {
      name: 'level3Turnover',
      type: 'number',
      defaultValue: 0,
      label: 'Оборот 3 уровня (₽)',
    },
    {
      name: 'totalTeamTurnover',
      type: 'number',
      defaultValue: 0,
      label: 'Суммарный оборот команды (₽)',
      admin: {
        description: 'Сумма всех уровней',
      },
    },
    {
      name: 'teamBonusAwarded',
      type: 'checkbox',
      defaultValue: false,
      label: 'Командный бонус начислен',
    },
    {
      name: 'teamBonusAmount',
      type: 'number',
      defaultValue: 0,
      label: 'Размер командного бонуса (₽)',
    },
  ],
}
