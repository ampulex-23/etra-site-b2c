/**
 * Seed script for МЕГАГЕНЕЗ (ЭТРАГЕНЕЗ) infoproduct
 * Run: npx tsx src/scripts/seed-megagenez.ts
 * Or via payload: pnpm run seed:megagenez
 */

import 'dotenv/config'
import { getPayload } from 'payload'
import config from '@payload-config'

const MEGAGENEZ_DATA = {
  title: 'МЕГАГЕНЕЗ',
  slug: 'megagenez',
  type: 'course' as const,
  status: 'active' as const,
  price: 45000,
  oldPrice: 55000,
  durationDays: 21,
  shortDescription:
    'Уникальный 21-дневный курс очищения и трансформации. Мягкий, бережный подход к изменениям среди единомышленников при поддержке команды ЭТРА.',

  // Шаблон расписания - УТРО
  scheduleMorning: {
    root: {
      type: 'root',
      children: [
        {
          type: 'heading',
          tag: 'h3',
          children: [{ type: 'text', text: '⭐️ У Т Р О' }],
        },
        {
          type: 'list',
          listType: 'bullet',
          children: [
            {
              type: 'listitem',
              children: [
                {
                  type: 'text',
                  text: 'Пробуждение: Зарядка + Контрастный душ',
                  format: 'bold',
                },
              ],
            },
            {
              type: 'listitem',
              children: [
                {
                  type: 'text',
                  text: 'Живое железо — за 5 минут до приема антипаразитарки на язык 15 капель',
                },
              ],
            },
            {
              type: 'listitem',
              children: [
                {
                  type: 'text',
                  text: 'Антипаразитарка Лайт — за 10-15 минут до приема масла',
                },
              ],
            },
            {
              type: 'listitem',
              children: [
                {
                  type: 'text',
                  text: 'Сыродавленное масло + горячая вода (1-2 ст ложки масла запить не более 150 мл полугорячей воды) — за 10-15 минут до приема Напитка УТРО',
                },
              ],
            },
            {
              type: 'listitem',
              children: [
                {
                  type: 'text',
                  text: 'Напиток УТРО 150 мл за 15 минут до приема пищи',
                },
              ],
            },
            {
              type: 'listitem',
              children: [
                {
                  type: 'text',
                  text: 'Завтрак (Каша ЭТРАСУТРА или другой завтрак из предложенных рецептов)',
                },
              ],
            },
          ],
        },
        {
          type: 'paragraph',
          children: [
            {
              type: 'text',
              text: '☝🏼 Если после антипаразитарки нет желания завтракать — пропускаем прием пищи. Но тогда не перекусываем фруктами до обеда, только горячая вода с 10 каплями пихтового масла.',
              format: 'italic',
            },
          ],
        },
      ],
    },
  },

  // Шаблон расписания - ДЕНЬ
  scheduleDay: {
    root: {
      type: 'root',
      children: [
        {
          type: 'heading',
          tag: 'h3',
          children: [{ type: 'text', text: '☀️ Д Е Н Ь' }],
        },
        {
          type: 'list',
          listType: 'bullet',
          children: [
            {
              type: 'listitem',
              children: [
                {
                  type: 'text',
                  text: 'Напиток ДЕНЬ 150 мл в обеденное время, за 15 минут до приема пищи',
                },
              ],
            },
            {
              type: 'listitem',
              children: [{ type: 'text', text: 'Обед' }],
            },
            {
              type: 'listitem',
              children: [
                {
                  type: 'text',
                  text: 'Бифидумфаната 150мл через час после еды',
                },
              ],
            },
          ],
        },
        {
          type: 'paragraph',
          children: [
            {
              type: 'text',
              text: 'В течение дня добавляем в воду/напитки сенную палочку по схеме 🪄',
              format: 'italic',
            },
          ],
        },
      ],
    },
  },

  // Шаблон расписания - ВЕЧЕР
  scheduleEvening: {
    root: {
      type: 'root',
      children: [
        {
          type: 'heading',
          tag: 'h3',
          children: [{ type: 'text', text: '🌙 В Е Ч Е Р' }],
        },
        {
          type: 'list',
          listType: 'bullet',
          children: [
            {
              type: 'listitem',
              children: [
                {
                  type: 'text',
                  text: 'Чистим кровь: горячая вода 150 мл + пихтовое масло 10 капель + озонированное масло 5 капель',
                },
              ],
            },
            {
              type: 'listitem',
              children: [
                {
                  type: 'text',
                  text: 'Спорт (Разминка + Сеты упражнений) — в дни спорта',
                },
              ],
            },
            {
              type: 'listitem',
              children: [
                {
                  type: 'text',
                  text: 'Напиток ВЕЧЕР 150 мл за 15 минут до приема пищи',
                },
              ],
            },
            {
              type: 'listitem',
              children: [
                {
                  type: 'text',
                  text: 'Ужин (25% порции не доедаем — ломаем привычки, ложимся с легким чувством голода)',
                },
              ],
            },
            {
              type: 'listitem',
              children: [
                {
                  type: 'text',
                  text: 'При вечерней чистке зубов в пасту добавляем озонированное масло',
                },
              ],
            },
            {
              type: 'listitem',
              children: [
                {
                  type: 'text',
                  text: 'Дыхательная практика за 2 часа до сна',
                },
              ],
            },
            {
              type: 'listitem',
              children: [
                {
                  type: 'text',
                  text: 'Озонированным и пихтовым маслами смазываем ноздри перед сном',
                },
              ],
            },
            {
              type: 'listitem',
              children: [
                {
                  type: 'text',
                  text: 'Отправляем отчет',
                  format: 'bold',
                },
              ],
            },
          ],
        },
      ],
    },
  },

  // Диетические рекомендации
  dietRecommendations: {
    root: {
      type: 'root',
      children: [
        {
          type: 'heading',
          tag: 'h2',
          children: [{ type: 'text', text: '👍 Р Е К О М Е Н Д У Е М' }],
        },
        {
          type: 'list',
          listType: 'bullet',
          children: [
            {
              type: 'listitem',
              children: [
                {
                  type: 'text',
                  text: 'Брать с собой боксы с едой. Когда человек голоден, он не так разборчив в питании. Готовьте еду заранее 🤗',
                },
              ],
            },
            {
              type: 'listitem',
              children: [
                {
                  type: 'text',
                  text: 'Пусть под рукой всегда будет каша ЭТРАСУТРА и антипаразитарка — сочетание этих продуктов перебьет голод и быстро даст насыщение',
                },
              ],
            },
            {
              type: 'listitem',
              children: [
                {
                  type: 'text',
                  text: 'Перерывы между приемами пищи не менее 4 часов',
                },
              ],
            },
            {
              type: 'listitem',
              children: [
                {
                  type: 'text',
                  text: 'Включаем в рацион: авокадо, редис, любую зелень (руккола, кинза, сельдерей), дайкон, репа, редька, спаржа, крестоцветы, проростки (маш, нут, пшено, микрозелень), сок лимона, приправы без соли, орехи ОБЯЗАТЕЛЬНО замоченные 🌰',
                },
              ],
            },
            {
              type: 'listitem',
              children: [
                { type: 'text', text: 'Побольше сыродавленного масла' },
              ],
            },
            {
              type: 'listitem',
              children: [
                {
                  type: 'text',
                  text: 'Огурцы, морковь, свеклу и любые твердые овощи натираем',
                },
              ],
            },
            {
              type: 'listitem',
              children: [
                {
                  type: 'text',
                  text: 'Фрукты употребляем до 20:00. Дыню лучше не включать в рацион',
                },
              ],
            },
            {
              type: 'listitem',
              children: [
                {
                  type: 'text',
                  text: 'Фрукты и овощи лучше употреблять не более 2-3 видов за раз',
                },
              ],
            },
          ],
        },
        {
          type: 'heading',
          tag: 'h2',
          children: [{ type: 'text', text: '👎 И С К Л Ю Ч А Е М' }],
        },
        {
          type: 'list',
          listType: 'bullet',
          children: [
            {
              type: 'listitem',
              children: [
                {
                  type: 'text',
                  text: '❌ Любой хлеб (в качестве исключения бездрожжевой, ржаной или пп хлебцы)',
                },
              ],
            },
            {
              type: 'listitem',
              children: [{ type: 'text', text: '❌ Молочку' }],
            },
            {
              type: 'listitem',
              children: [{ type: 'text', text: '❌ Красное мясо' }],
            },
            {
              type: 'listitem',
              children: [
                { type: 'text', text: '❌ Птицу кроме индейки' },
              ],
            },
            {
              type: 'listitem',
              children: [
                {
                  type: 'text',
                  text: '❌ Рыбу (исключение: белая рыба, форель). Рыба — рассадник паразитов даже после приготовления',
                },
              ],
            },
            {
              type: 'listitem',
              children: [{ type: 'text', text: '❌ Алкоголь' }],
            },
          ],
        },
      ],
    },
  },

  // Противопоказания
  contraindications: {
    root: {
      type: 'root',
      children: [
        {
          type: 'heading',
          tag: 'h2',
          children: [{ type: 'text', text: '❗️ ПРОТИВОПОКАЗАНИЯ' }],
        },
        {
          type: 'paragraph',
          children: [
            {
              type: 'text',
              text: 'В случае если у вас имеются противопоказания (воспалительные процессы, язва, хронические заболевания, беременность и пр.), пожалуйста, обратитесь к организаторам для коррекции программы.',
            },
          ],
        },
      ],
    },
  },

  // Правила курса
  rules: {
    root: {
      type: 'root',
      children: [
        {
          type: 'heading',
          tag: 'h2',
          children: [{ type: 'text', text: '📋 Правила МЕГАГЕНЕЗА' }],
        },
        {
          type: 'paragraph',
          children: [
            {
              type: 'text',
              text: 'Без дисциплины свобода невозможна. Поэтому мы ввели обязательное условие участия в ЭТРАГЕНЕЗЕ — отчет, который на ежедневной основе нужно публиковать.',
            },
          ],
        },
        {
          type: 'paragraph',
          children: [
            {
              type: 'text',
              text: 'Отсутствие трех и более отчетов может стать основанием отказа участнику в дальнейшем прохождении курса.',
              format: 'bold',
            },
          ],
        },
        {
          type: 'heading',
          tag: 'h3',
          children: [{ type: 'text', text: 'Первая неделя — переключение' }],
        },
        {
          type: 'paragraph',
          children: [
            {
              type: 'text',
              text: 'Тем, у кого сильные привычки и стандартный образ жизни, нужно помнить — переключаемся без "ломок". Если процесс слишком сложен, то исключаем по 50% массы привычного рациона, заменяя рекомендованным.',
            },
          ],
        },
      ],
    },
  },

  // Шаблон отчёта
  reportTemplate: [
    { item: 'Энзимные напитки', emoji: '🧃' },
    { item: 'Соблюдение рекомендаций по питанию и объема порции', emoji: '🥗' },
    { item: 'Антипаразитарка', emoji: '💊' },
    { item: 'Масла', emoji: '🫒' },
    { item: 'Живое железо', emoji: '💧' },
    { item: 'Сенная палочка', emoji: '🦠' },
    { item: 'Комплекс упражнений Пробуждение (Контрастный душ / лимфодренаж / зарядка)', emoji: '🚿' },
    { item: 'Спорт (в дни спорта)', emoji: '🏋️' },
    { item: 'Дыхательная практика', emoji: '🧘' },
    { item: 'Дополнительно', emoji: '➕' },
  ],

  reportRules: {
    maxMissed: 3,
    penalty: {
      root: {
        type: 'root',
        children: [
          {
            type: 'paragraph',
            children: [
              {
                type: 'text',
                text: 'Отсутствие трех и более отчетов может стать основанием отказа участнику в дальнейшем прохождении курса.',
              },
            ],
          },
        ],
      },
    },
  },

  // Команда
  team: [
    { name: 'Наталья', role: 'Основатель ЭТРА, автор курса' },
    { name: 'Команда поддержки ЭТРА', role: 'Кураторы и организаторы' },
  ],

  // SEO
  seo: {
    title: 'МЕГАГЕНЕЗ — 21-дневный курс очищения | ЭТРА',
    description:
      'Уникальный курс очищения и трансформации. Мягкий, бережный подход к изменениям среди единомышленников при поддержке команды ЭТРА. 21 день к новому уровню осознанности.',
  },
}

// Модули курса
const MODULES = [
  {
    title: 'НАВИГАЦИЯ',
    slug: 'megagenez-navigation',
    type: 'navigation',
    icon: '⭐️',
    order: 1,
    description:
      'Наша группа состоит из тематических веток, каждая из которых посвящена какому-либо аспекту ЭТРАГЕНЕЗА.',
    content: {
      root: {
        type: 'root',
        children: [
          {
            type: 'heading',
            tag: 'h2',
            children: [{ type: 'text', text: '⭐️ НАВИГАЦИЯ ПО КУРСУ' }],
          },
          {
            type: 'paragraph',
            children: [
              {
                type: 'text',
                text: 'Наша группа состоит из тематических веток, каждая из которых посвящена какому-либо аспекту ЭТРАГЕНЕЗА.',
                format: 'bold',
              },
            ],
          },
          {
            type: 'list',
            listType: 'bullet',
            children: [
              {
                type: 'listitem',
                children: [
                  {
                    type: 'text',
                    text: '💬 ОБЩЕНИЕ — Работа над собой в кругу единомышленников. Поддержка, обмен мыслями, достижениями, сомнениями, опытом.',
                  },
                ],
              },
              {
                type: 'listitem',
                children: [
                  {
                    type: 'text',
                    text: '📋 РАСПИСАНИЕ — Ежедневный график питания, упражнений, подготовки к процедурам. Публикуется каждое воскресенье на неделю вперед.',
                  },
                ],
              },
              {
                type: 'listitem',
                children: [
                  {
                    type: 'text',
                    text: '🛍 ПРОДУКЦИЯ — Подробное описание продуктов курса с рекомендациями по применению.',
                  },
                ],
              },
              {
                type: 'listitem',
                children: [
                  {
                    type: 'text',
                    text: '✨ МОТИВАЦИОННАЯ — Вдохновение на пути к чистоте.',
                  },
                ],
              },
              {
                type: 'listitem',
                children: [
                  {
                    type: 'text',
                    text: '🎞 ЭФИРЫ — Расписание и записи всех эфиров.',
                  },
                ],
              },
              {
                type: 'listitem',
                children: [
                  {
                    type: 'text',
                    text: '❔ ВОПРОСЫ К ЭФИРАМ — Задайте любой волнующий вопрос — он будет освещен на ближайшем эфире.',
                  },
                ],
              },
              {
                type: 'listitem',
                children: [
                  {
                    type: 'text',
                    text: '🏄‍♂️ СПОРТ — Упражнения для разного уровня подготовки.',
                  },
                ],
              },
              {
                type: 'listitem',
                children: [
                  {
                    type: 'text',
                    text: '❗️ ОТЧЕТЫ — Ежедневные отчеты участников.',
                  },
                ],
              },
              {
                type: 'listitem',
                children: [
                  {
                    type: 'text',
                    text: '🍹 ЭТРА КАФЕ — Любимые и интересные рецепты.',
                  },
                ],
              },
              {
                type: 'listitem',
                children: [
                  {
                    type: 'text',
                    text: '🏆 РЕЗУЛЬТАТЫ — Промежуточные и итоговые результаты участников.',
                  },
                ],
              },
              {
                type: 'listitem',
                children: [
                  {
                    type: 'text',
                    text: '📑 ПРОТОКОЛЫ — Дополнительная информация и протоколы курса.',
                  },
                ],
              },
            ],
          },
        ],
      },
    },
  },
  {
    title: 'ОБЩЕНИЕ',
    slug: 'megagenez-communication',
    type: 'communication',
    icon: '💬',
    order: 2,
    description:
      'Работа над собой в кругу единомышленников особенно эффективна. Поддержка, обмен мыслями, достижениями, сомнениями, опытом.',
    content: {
      root: {
        type: 'root',
        children: [
          {
            type: 'heading',
            tag: 'h2',
            children: [{ type: 'text', text: '💬 ОБЩЕНИЕ' }],
          },
          {
            type: 'paragraph',
            children: [
              {
                type: 'text',
                text: 'Дорогие друзья! Мы рады приветствовать вас на нашем курсе и в нашем дружном сообществе!',
              },
            ],
          },
          {
            type: 'paragraph',
            children: [
              {
                type: 'text',
                text: 'Мы бесконечно признательны за оказанное доверие!',
                format: 'bold',
              },
            ],
          },
          {
            type: 'paragraph',
            children: [
              {
                type: 'text',
                text: 'Наш проект сделан с большой любовью и мы уверены — эта любовь самое лучшее и чистое топливо для движения по новому пути. 🤍',
              },
            ],
          },
          {
            type: 'paragraph',
            children: [
              {
                type: 'text',
                text: 'ЭТРАГЕНЕЗ — это уникальный курс: подход к изменениям здесь мягкий, бережный, конечно же вкусный, среди единомышленников и при поддержке команды ЭТРА.',
              },
            ],
          },
          {
            type: 'quote',
            children: [
              {
                type: 'text',
                text: 'ГЕНЕЗ — от греч. genesis, возникновение, развитие.',
                format: 'italic',
              },
            ],
          },
          {
            type: 'paragraph',
            children: [
              {
                type: 'text',
                text: 'Совместное развитие, возникновение нового понимания, выход на новый уровень осознанности — вот что мы вложили в название курса.',
              },
            ],
          },
          {
            type: 'paragraph',
            children: [
              {
                type: 'text',
                text: 'Мы желаем вам света, легкости и любви на пути. Начинаем ЭТРАГЕНЕЗ! 🏁',
                format: 'bold',
              },
            ],
          },
        ],
      },
    },
  },
  {
    title: 'РАСПИСАНИЕ',
    slug: 'megagenez-schedule',
    type: 'schedule',
    icon: '📋',
    order: 3,
    description:
      'Ежедневный график питания, упражнений, подготовки к процедурам. Расписание публикуется каждое воскресенье на неделю вперед.',
    content: {
      root: {
        type: 'root',
        children: [
          {
            type: 'heading',
            tag: 'h2',
            children: [{ type: 'text', text: '📋 РАСПИСАНИЕ' }],
          },
          {
            type: 'paragraph',
            children: [
              {
                type: 'text',
                text: 'В этой ветке вы найдете:',
              },
            ],
          },
          {
            type: 'list',
            listType: 'bullet',
            children: [
              {
                type: 'listitem',
                children: [
                  {
                    type: 'text',
                    text: 'Рекомендации по питанию',
                    format: 'bold',
                  },
                ],
              },
              {
                type: 'listitem',
                children: [
                  {
                    type: 'text',
                    text: 'Расписание на каждый день',
                    format: 'bold',
                  },
                ],
              },
              {
                type: 'listitem',
                children: [
                  {
                    type: 'text',
                    text: 'График эфиров и их темы',
                    format: 'bold',
                  },
                ],
              },
            ],
          },
          {
            type: 'paragraph',
            children: [
              {
                type: 'text',
                text: '‼️ Пожалуйста, внимательно ознакомьтесь: график на каждый следующий день может отличаться от предыдущего.',
                format: 'bold',
              },
            ],
          },
        ],
      },
    },
  },
  {
    title: 'ПРОДУКЦИЯ',
    slug: 'megagenez-products',
    type: 'products',
    icon: '🛍',
    order: 4,
    description:
      'Подробное описание продуктов курса с общими рекомендациями по применению.',
    content: {
      root: {
        type: 'root',
        children: [
          {
            type: 'heading',
            tag: 'h2',
            children: [{ type: 'text', text: '🛍 ПРОДУКЦИЯ КУРСА' }],
          },
          {
            type: 'paragraph',
            children: [
              {
                type: 'text',
                text: 'Мы подробно рассказали о продуктах курса и сопроводили их общими рекомендациями по применению.',
              },
            ],
          },
          {
            type: 'paragraph',
            children: [
              {
                type: 'text',
                text: 'Следите за РАСПИСАНИЕМ — там будут указаны более подробные рекомендации по применению.',
                format: 'italic',
              },
            ],
          },
          {
            type: 'heading',
            tag: 'h3',
            children: [{ type: 'text', text: 'Основные продукты:' }],
          },
          {
            type: 'list',
            listType: 'bullet',
            children: [
              {
                type: 'listitem',
                children: [
                  {
                    type: 'text',
                    text: 'Напиток УТРО — энзимный напиток для утреннего приема',
                  },
                ],
              },
              {
                type: 'listitem',
                children: [
                  {
                    type: 'text',
                    text: 'Напиток ДЕНЬ — энзимный напиток для дневного приема',
                  },
                ],
              },
              {
                type: 'listitem',
                children: [
                  {
                    type: 'text',
                    text: 'Напиток ВЕЧЕР — энзимный напиток для вечернего приема',
                  },
                ],
              },
              {
                type: 'listitem',
                children: [
                  {
                    type: 'text',
                    text: 'Антипаразитарка Лайт — для очищения от паразитов',
                  },
                ],
              },
              {
                type: 'listitem',
                children: [
                  {
                    type: 'text',
                    text: 'Живое железо — для поддержки уровня железа',
                  },
                ],
              },
              {
                type: 'listitem',
                children: [
                  {
                    type: 'text',
                    text: 'Сенная палочка — пробиотик',
                  },
                ],
              },
              {
                type: 'listitem',
                children: [
                  {
                    type: 'text',
                    text: 'Бифидумфаната — для поддержки микрофлоры',
                  },
                ],
              },
              {
                type: 'listitem',
                children: [
                  {
                    type: 'text',
                    text: 'Каша ЭТРАСУТРА — для завтрака',
                  },
                ],
              },
              {
                type: 'listitem',
                children: [
                  {
                    type: 'text',
                    text: 'Сыродавленное масло — для приема с горячей водой',
                  },
                ],
              },
              {
                type: 'listitem',
                children: [
                  {
                    type: 'text',
                    text: 'Пихтовое масло — для добавления в воду',
                  },
                ],
              },
              {
                type: 'listitem',
                children: [
                  {
                    type: 'text',
                    text: 'Озонированное масло — для чистки зубов и ноздрей',
                  },
                ],
              },
            ],
          },
        ],
      },
    },
  },
  {
    title: 'МОТИВАЦИОННАЯ',
    slug: 'megagenez-motivation',
    type: 'motivation',
    icon: '✨',
    order: 5,
    description:
      'Здесь мы делимся тем, что вдохновляет нас на пути к чистоте.',
    content: {
      root: {
        type: 'root',
        children: [
          {
            type: 'heading',
            tag: 'h2',
            children: [{ type: 'text', text: '✨ МОТИВАЦИОННАЯ' }],
          },
          {
            type: 'paragraph',
            children: [
              {
                type: 'text',
                text: 'Здесь мы будем делиться тем, что вдохновляет нас на пути к чистоте.',
              },
            ],
          },
          {
            type: 'paragraph',
            children: [
              {
                type: 'text',
                text: 'Потому что мы знаем, как важно найти в себе силы сделать шаг навстречу новому.',
              },
            ],
          },
        ],
      },
    },
  },
  {
    title: 'ЭФИРЫ',
    slug: 'megagenez-broadcasts',
    type: 'broadcasts',
    icon: '🎞',
    order: 6,
    description:
      'Расписание и записи всех эфиров. Рекомендуем подключаться к онлайн-трансляциям.',
    content: {
      root: {
        type: 'root',
        children: [
          {
            type: 'heading',
            tag: 'h2',
            children: [{ type: 'text', text: '🎞 ЭФИРЫ' }],
          },
          {
            type: 'paragraph',
            children: [
              {
                type: 'text',
                text: 'Здесь публикуется расписание эфиров, а также выкладываются их записи.',
              },
            ],
          },
          {
            type: 'paragraph',
            children: [
              {
                type: 'text',
                text: 'Вы сможете посмотреть интересующее вас видео в любой удобный момент. Если вы располагаете временем, то рекомендуем подключиться к онлайн-трансляции 🤗',
              },
            ],
          },
          {
            type: 'heading',
            tag: 'h3',
            children: [{ type: 'text', text: 'Расписание эфиров:' }],
          },
          {
            type: 'list',
            listType: 'bullet',
            children: [
              {
                type: 'listitem',
                children: [
                  {
                    type: 'text',
                    text: '0️⃣ ВВОДНАЯ ЧАСТЬ — Про ЭТРАГЕНЕЗ и его структуру. Как подготовиться к Курсу.',
                  },
                ],
              },
              {
                type: 'listitem',
                children: [
                  {
                    type: 'text',
                    text: 'Еженедельные эфиры с ответами на вопросы участников',
                  },
                ],
              },
              {
                type: 'listitem',
                children: [
                  {
                    type: 'text',
                    text: 'Тематические эфиры по питанию, очищению, спорту',
                  },
                ],
              },
            ],
          },
        ],
      },
    },
  },
  {
    title: 'ВОПРОСЫ К ЭФИРАМ',
    slug: 'megagenez-qa',
    type: 'qa',
    icon: '❔',
    order: 7,
    description:
      'В этой ветке можно задать любой волнующий вопрос — он обязательно будет освещен на ближайшем эфире.',
    content: {
      root: {
        type: 'root',
        children: [
          {
            type: 'heading',
            tag: 'h2',
            children: [{ type: 'text', text: '❔ ВОПРОСЫ К ЭФИРАМ' }],
          },
          {
            type: 'paragraph',
            children: [
              {
                type: 'text',
                text: 'В этой ветке можно задать любой волнующий вопрос — он обязательно будет освещен на ближайшем эфире, посвященном ответам.',
              },
            ],
          },
          {
            type: 'paragraph',
            children: [
              {
                type: 'text',
                text: 'Вопросы к тренеру можно задать с хэштегом #спорт — он обязательно ответит.',
                format: 'italic',
              },
            ],
          },
        ],
      },
    },
  },
  {
    title: 'СПОРТ',
    slug: 'megagenez-sport',
    type: 'sport',
    icon: '🏄‍♂️',
    order: 8,
    description:
      'Программа физических нагрузок для разного уровня подготовки.',
    content: {
      root: {
        type: 'root',
        children: [
          {
            type: 'heading',
            tag: 'h2',
            children: [{ type: 'text', text: '🏄‍♂️ СПОРТ' }],
          },
          {
            type: 'paragraph',
            children: [
              {
                type: 'text',
                text: 'Наша программа подразумевает физические нагрузки для разного уровня подготовки.',
              },
            ],
          },
          {
            type: 'paragraph',
            children: [
              {
                type: 'text',
                text: 'В этой ветке вы найдете упражнения, которые необходимо будет выполнять в соответствии с вашими возможностями.',
              },
            ],
          },
          {
            type: 'heading',
            tag: 'h3',
            children: [{ type: 'text', text: 'Структура тренировки:' }],
          },
          {
            type: 'list',
            listType: 'bullet',
            children: [
              {
                type: 'listitem',
                children: [
                  {
                    type: 'text',
                    text: 'Разминка',
                  },
                ],
              },
              {
                type: 'listitem',
                children: [
                  {
                    type: 'text',
                    text: 'Сет упражнений 1',
                  },
                ],
              },
              {
                type: 'listitem',
                children: [
                  {
                    type: 'text',
                    text: 'Сет упражнений 2',
                  },
                ],
              },
              {
                type: 'listitem',
                children: [
                  {
                    type: 'text',
                    text: 'Сет упражнений 3',
                  },
                ],
              },
            ],
          },
          {
            type: 'paragraph',
            children: [
              {
                type: 'text',
                text: 'Если на спорт не хватает энергии, то за 10 минут до начала можно принять живое железо — 10 капель на язык.',
                format: 'italic',
              },
            ],
          },
        ],
      },
    },
  },
  {
    title: 'ОТЧЕТЫ',
    slug: 'megagenez-reports',
    type: 'reports',
    icon: '❗️',
    order: 9,
    description:
      'Ежедневные отчеты участников. Обязательное условие участия в курсе.',
    content: {
      root: {
        type: 'root',
        children: [
          {
            type: 'heading',
            tag: 'h2',
            children: [{ type: 'text', text: '❗️ ОТЧЕТЫ' }],
          },
          {
            type: 'paragraph',
            children: [
              {
                type: 'text',
                text: 'Мы знаем, без дисциплины свобода невозможна.',
              },
            ],
          },
          {
            type: 'paragraph',
            children: [
              {
                type: 'text',
                text: 'Поэтому мы ввели обязательное условие участия в ЭТРАГЕНЕЗЕ — отчет, который на ежедневной основе нужно публиковать.',
                format: 'bold',
              },
            ],
          },
          {
            type: 'paragraph',
            children: [
              {
                type: 'text',
                text: 'Отсутствие трех и более отчетов может стать основанием отказа участнику в дальнейшем прохождении курса.',
              },
            ],
          },
          {
            type: 'heading',
            tag: 'h3',
            children: [{ type: 'text', text: 'Пример заполнения отчета:' }],
          },
          {
            type: 'paragraph',
            children: [
              {
                type: 'text',
                text: '#ИмяЧислоРождения (например #Кирилл15)',
                format: 'bold',
              },
            ],
          },
          {
            type: 'list',
            listType: 'bullet',
            children: [
              {
                type: 'listitem',
                children: [{ type: 'text', text: 'Энзимные напитки ✅' }],
              },
              {
                type: 'listitem',
                children: [
                  {
                    type: 'text',
                    text: 'Соблюдение рекомендаций по питанию ✅',
                  },
                ],
              },
              {
                type: 'listitem',
                children: [{ type: 'text', text: 'Антипаразитарка ✅' }],
              },
              {
                type: 'listitem',
                children: [{ type: 'text', text: 'Масла ✅' }],
              },
              {
                type: 'listitem',
                children: [{ type: 'text', text: 'Живое железо ✅' }],
              },
              {
                type: 'listitem',
                children: [{ type: 'text', text: 'Сенная палочка ✅' }],
              },
              {
                type: 'listitem',
                children: [
                  { type: 'text', text: 'Комплекс упражнений Пробуждение ✅' },
                ],
              },
              {
                type: 'listitem',
                children: [{ type: 'text', text: 'Спорт ✅ (в дни спорта)' }],
              },
              {
                type: 'listitem',
                children: [{ type: 'text', text: 'Дыхательная практика ✅' }],
              },
              {
                type: 'listitem',
                children: [{ type: 'text', text: 'Дополнительно ✅' }],
              },
            ],
          },
        ],
      },
    },
  },
  {
    title: 'ЭТРА КАФЕ',
    slug: 'megagenez-recipes',
    type: 'recipes',
    icon: '🍹',
    order: 10,
    description: 'Любимые и интересные рецепты — чтобы питаться было вкусно и здорово!',
    content: {
      root: {
        type: 'root',
        children: [
          {
            type: 'heading',
            tag: 'h2',
            children: [{ type: 'text', text: '🍹 ЭТРА КАФЕ' }],
          },
          {
            type: 'paragraph',
            children: [
              {
                type: 'text',
                text: 'Делимся с вами любимыми и интересными рецептами — чтобы питаться было вкусно и здорово! 🤗',
              },
            ],
          },
        ],
      },
    },
  },
  {
    title: 'РЕЗУЛЬТАТЫ',
    slug: 'megagenez-results',
    type: 'results',
    icon: '🏆',
    order: 11,
    description:
      'Промежуточные и итоговые результаты участников ЭТРАГЕНЕЗА.',
    content: {
      root: {
        type: 'root',
        children: [
          {
            type: 'heading',
            tag: 'h2',
            children: [{ type: 'text', text: '🏆 РЕЗУЛЬТАТЫ' }],
          },
          {
            type: 'paragraph',
            children: [
              {
                type: 'text',
                text: 'В этой ветке вы можете поделиться промежуточными и итоговыми результатами ЭТРАГЕНЕЗА и вдохновиться результатами других участников.',
              },
            ],
          },
        ],
      },
    },
  },
  {
    title: 'ПРОТОКОЛЫ',
    slug: 'megagenez-protocols',
    type: 'protocols',
    icon: '📑',
    order: 12,
    description:
      'Дополнительная информация и протоколы, рекомендованные в ходе курса.',
    content: {
      root: {
        type: 'root',
        children: [
          {
            type: 'heading',
            tag: 'h2',
            children: [{ type: 'text', text: '📑 ПРОТОКОЛЫ' }],
          },
          {
            type: 'paragraph',
            children: [
              {
                type: 'text',
                text: 'Здесь собрана дополнительная информация и протоколы, рекомендованные в ходе курса.',
              },
            ],
          },
        ],
      },
    },
  },
]

async function seedMegagenez() {
  console.log('🚀 Starting МЕГАГЕНЕЗ seed...')

  const payload = await getPayload({ config })

  // Check if МЕГАГЕНЕЗ already exists
  const existing = await payload.find({
    collection: 'infoproducts',
    where: { slug: { equals: 'megagenez' } },
    limit: 1,
  })

  let infoproductId: number

  if (existing.docs.length > 0) {
    console.log('⚠️ МЕГАГЕНЕЗ already exists, updating...')
    const updated = await payload.update({
      collection: 'infoproducts',
      id: existing.docs[0].id,
      data: MEGAGENEZ_DATA as any,
    })
    infoproductId = updated.id
    console.log(`✅ Updated infoproduct: ${updated.title} (ID: ${updated.id})`)
  } else {
    const created = await payload.create({
      collection: 'infoproducts',
      data: MEGAGENEZ_DATA as any,
    })
    infoproductId = created.id
    console.log(`✅ Created infoproduct: ${created.title} (ID: ${created.id})`)
  }

  // Create/update modules
  console.log('\n📦 Creating course modules...')

  for (const moduleData of MODULES) {
    const existingModule = await payload.find({
      collection: 'course-modules',
      where: { slug: { equals: moduleData.slug } },
      limit: 1,
    })

    const data = {
      ...moduleData,
      infoproduct: infoproductId,
      visible: true,
    }

    if (existingModule.docs.length > 0) {
      await payload.update({
        collection: 'course-modules',
        id: existingModule.docs[0].id,
        data: data as any,
      })
      console.log(`  ✅ Updated module: ${moduleData.title}`)
    } else {
      await payload.create({
        collection: 'course-modules',
        data: data as any,
      })
      console.log(`  ✅ Created module: ${moduleData.title}`)
    }
  }

  console.log('\n🎉 МЕГАГЕНЕЗ seed completed!')
  console.log(`\n📊 Summary:`)
  console.log(`  - Infoproduct ID: ${infoproductId}`)
  console.log(`  - Modules created: ${MODULES.length}`)
  console.log(`  - Duration: ${MEGAGENEZ_DATA.durationDays} days`)
  console.log(`  - Price: ${MEGAGENEZ_DATA.price}₽`)

  process.exit(0)
}

seedMegagenez().catch((err) => {
  console.error('❌ Seed failed:', err)
  process.exit(1)
})
