import type { GlobalConfig } from 'payload'

export const LandingSettings: GlobalConfig = {
  slug: 'landing-settings',
  label: 'Лендинг',
  admin: {
    group: '🎨 Сайт',
  },
  access: {
    read: () => true,
    update: ({ req: { user } }) => Boolean(user),
  },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Главный экран',
          fields: [
            {
              name: 'heroTitle',
              type: 'text',
              label: 'Заголовок',
              defaultValue: 'Ферментированные напитки нового поколения',
            },
            {
              name: 'heroSubtitle',
              type: 'textarea',
              label: 'Подзаголовок',
              defaultValue: 'Живые ферменты и пробиотики в каждой бутылке. Наука, которую можно попробовать на вкус.',
            },
            {
              name: 'heroCta',
              type: 'text',
              label: 'Текст кнопки',
              defaultValue: 'Смотреть каталог',
            },
            {
              name: 'heroCtaLink',
              type: 'text',
              label: 'Ссылка кнопки',
              defaultValue: '#catalog',
            },
            {
              name: 'heroSecondaryCtaText',
              type: 'text',
              label: 'Текст второй кнопки',
              defaultValue: 'Узнать больше',
            },
            {
              name: 'heroSecondaryCtaLink',
              type: 'text',
              label: 'Ссылка второй кнопки',
              defaultValue: '#science',
            },
            {
              name: 'heroBgImage',
              type: 'upload',
              relationTo: 'media',
              label: 'Фоновое изображение',
              admin: {
                description: 'Если не задано, используется /images/hero-bg.jpg',
              },
            },
          ],
        },
        {
          label: 'Цифры',
          fields: [
            {
              name: 'stats',
              type: 'array',
              label: 'Показатели',
              maxRows: 6,
              defaultValue: [
                { number: '12+', label: 'Активных ферментов' },
                { number: '21', label: 'День ферментации' },
                { number: '100%', label: 'Натуральный состав' },
                { number: '50K+', label: 'Довольных клиентов' },
              ],
              fields: [
                {
                  name: 'number',
                  type: 'text',
                  required: true,
                  label: 'Число',
                },
                {
                  name: 'label',
                  type: 'text',
                  required: true,
                  label: 'Подпись',
                },
              ],
            },
          ],
        },
        {
          label: 'Наука',
          fields: [
            {
              name: 'scienceLabel',
              type: 'text',
              label: 'Лейбл секции',
              defaultValue: 'Наша технология',
            },
            {
              name: 'scienceTitle',
              type: 'text',
              label: 'Заголовок',
              defaultValue: 'Сила природы, подтверждённая наукой',
            },
            {
              name: 'scienceDesc',
              type: 'textarea',
              label: 'Описание',
              defaultValue: 'Напитки ЭТРА используют силу живых ферментов через контролируемый процесс ферментации, который максимизирует биодоступность и вкус.',
            },
            {
              name: 'scienceImage',
              type: 'upload',
              relationTo: 'media',
              label: 'Изображение секции',
            },
            {
              name: 'scienceFeatures',
              type: 'array',
              label: 'Преимущества',
              maxRows: 6,
              fields: [
                {
                  name: 'icon',
                  type: 'text',
                  label: 'Иконка (эмодзи)',
                  defaultValue: '🧪',
                },
                {
                  name: 'title',
                  type: 'text',
                  required: true,
                  label: 'Заголовок',
                },
                {
                  name: 'description',
                  type: 'textarea',
                  required: true,
                  label: 'Описание',
                },
              ],
            },
          ],
        },
        {
          label: 'Каталог',
          fields: [
            {
              name: 'catalogLabel',
              type: 'text',
              label: 'Лейбл секции',
              defaultValue: 'Наши напитки',
            },
            {
              name: 'catalogTitle',
              type: 'text',
              label: 'Заголовок',
              defaultValue: 'Попробуйте революцию вкуса',
            },
            {
              name: 'catalogDesc',
              type: 'textarea',
              label: 'Описание',
              defaultValue: 'Каждый вкус создан с живыми ферментами и натуральными ингредиентами. Без консервантов, без красителей — чистый ферментированный продукт.',
            },
            {
              name: 'catalogShowFeatured',
              type: 'checkbox',
              defaultValue: true,
              label: 'Показывать только избранные товары',
              admin: {
                description: 'Если включено, отображаются товары с галочкой «На главной»',
              },
            },
            {
              name: 'catalogMaxItems',
              type: 'number',
              defaultValue: 6,
              min: 1,
              max: 12,
              label: 'Максимум товаров',
            },
          ],
        },
        {
          label: 'Процесс',
          fields: [
            {
              name: 'processLabel',
              type: 'text',
              label: 'Лейбл секции',
              defaultValue: 'Как это работает',
            },
            {
              name: 'processTitle',
              type: 'text',
              label: 'Заголовок',
              defaultValue: 'От культуры до бутылки',
            },
            {
              name: 'processDesc',
              type: 'textarea',
              label: 'Описание',
              defaultValue: 'Наш четырёхэтапный процесс гарантирует, что каждая бутылка содержит живые ферменты максимальной активности.',
            },
            {
              name: 'processSteps',
              type: 'array',
              label: 'Этапы',
              maxRows: 6,
              fields: [
                {
                  name: 'title',
                  type: 'text',
                  required: true,
                  label: 'Заголовок',
                },
                {
                  name: 'description',
                  type: 'textarea',
                  required: true,
                  label: 'Описание',
                },
              ],
            },
          ],
        },
        {
          label: 'Отзывы',
          fields: [
            {
              name: 'testimonialsLabel',
              type: 'text',
              label: 'Лейбл секции',
              defaultValue: 'Отзывы',
            },
            {
              name: 'testimonialsTitle',
              type: 'text',
              label: 'Заголовок',
              defaultValue: 'Что говорят наши клиенты',
            },
            {
              name: 'testimonials',
              type: 'array',
              label: 'Отзывы',
              maxRows: 9,
              fields: [
                {
                  name: 'text',
                  type: 'textarea',
                  required: true,
                  label: 'Текст отзыва',
                },
                {
                  name: 'name',
                  type: 'text',
                  required: true,
                  label: 'Имя',
                },
                {
                  name: 'role',
                  type: 'text',
                  label: 'Должность / описание',
                },
                {
                  name: 'avatar',
                  type: 'upload',
                  relationTo: 'media',
                  label: 'Аватар',
                },
                {
                  name: 'rating',
                  type: 'number',
                  min: 1,
                  max: 5,
                  defaultValue: 5,
                  label: 'Оценка',
                },
              ],
            },
          ],
        },
        {
          label: 'Подписка / CTA',
          fields: [
            {
              name: 'joinTitle',
              type: 'text',
              label: 'Заголовок',
              defaultValue: 'Готовы почувствовать разницу?',
            },
            {
              name: 'joinDesc',
              type: 'textarea',
              label: 'Описание',
              defaultValue: 'Подпишитесь на эксклюзивные предложения, новые вкусы и советы по здоровому питанию от наших учёных.',
            },
            {
              name: 'joinButtonText',
              type: 'text',
              label: 'Текст кнопки',
              defaultValue: 'Подписаться',
            },
          ],
        },
        {
          label: 'Подвал',
          fields: [
            {
              name: 'footerDesc',
              type: 'textarea',
              label: 'Описание в подвале',
              defaultValue: 'Ферментированные напитки нового поколения на основе живых ферментов. Наука и вкус в каждой бутылке.',
            },
            {
              name: 'footerEmail',
              type: 'email',
              label: 'Email для связи',
            },
            {
              name: 'footerPhone',
              type: 'text',
              label: 'Телефон',
            },
            {
              name: 'socialLinks',
              type: 'array',
              label: 'Социальные сети',
              fields: [
                {
                  name: 'platform',
                  type: 'select',
                  required: true,
                  label: 'Платформа',
                  options: [
                    { label: 'Telegram', value: 'telegram' },
                    { label: 'VK', value: 'vk' },
                    { label: 'Instagram', value: 'instagram' },
                    { label: 'YouTube', value: 'youtube' },
                    { label: 'WhatsApp', value: 'whatsapp' },
                  ],
                },
                {
                  name: 'url',
                  type: 'text',
                  required: true,
                  label: 'Ссылка',
                },
              ],
            },
          ],
        },
      ],
    },
  ],
}
