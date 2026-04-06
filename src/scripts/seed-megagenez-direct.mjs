/**
 * Direct SQL seed for МЕГАГЕНЕЗ
 * Run: node src/scripts/seed-megagenez-direct.mjs
 */

import pg from 'pg'

const { Client } = pg

const DATABASE_URL = 'postgresql://gen_user:Fk5L%5Es%40Yqw%5EXX%3B@de5da695d6c895f89bec5d5e.twc1.net:5432/default_db'

const client = new Client({ connectionString: DATABASE_URL })

// RichText JSON для Payload Lexical
const createRichText = (content) => JSON.stringify({
  root: {
    type: 'root',
    children: content,
    direction: 'ltr',
    format: '',
    indent: 0,
    version: 1
  }
})

const heading = (text, tag = 'h2') => ({
  type: 'heading',
  tag,
  children: [{ type: 'text', text, format: 0, mode: 'normal', style: '', detail: 0, version: 1 }],
  direction: 'ltr',
  format: '',
  indent: 0,
  version: 1
})

const paragraph = (text, format = 0) => ({
  type: 'paragraph',
  children: [{ type: 'text', text, format, mode: 'normal', style: '', detail: 0, version: 1 }],
  direction: 'ltr',
  format: '',
  indent: 0,
  version: 1,
  textFormat: 0,
  textStyle: ''
})

const listItem = (text) => ({
  type: 'listitem',
  children: [{ type: 'text', text, format: 0, mode: 'normal', style: '', detail: 0, version: 1 }],
  direction: 'ltr',
  format: '',
  indent: 0,
  version: 1,
  value: 1
})

const bulletList = (items) => ({
  type: 'list',
  listType: 'bullet',
  children: items.map(listItem),
  direction: 'ltr',
  format: '',
  indent: 0,
  version: 1,
  start: 1,
  tag: 'ul'
})

// Данные инфопродукта
const MEGAGENEZ = {
  title: 'МЕГАГЕНЕЗ',
  slug: 'megagenez',
  type: 'course',
  status: 'active',
  short_description: 'Уникальный 21-дневный курс очищения и трансформации. Мягкий, бережный подход к изменениям среди единомышленников при поддержке команды ЭТРА.',
  price: 45000,
  old_price: 55000,
  duration_days: 21,
  
  schedule_morning: createRichText([
    heading('⭐️ У Т Р О', 'h3'),
    bulletList([
      'Пробуждение: Зарядка + Контрастный душ',
      'Живое железо — за 5 минут до приема антипаразитарки на язык 15 капель',
      'Антипаразитарка Лайт — за 10-15 минут до приема масла',
      'Сыродавленное масло + горячая вода (1-2 ст ложки масла запить не более 150 мл полугорячей воды)',
      'Напиток УТРО 150 мл за 15 минут до приема пищи',
      'Завтрак (Каша ЭТРАСУТРА или другой завтрак из предложенных рецептов)'
    ]),
    paragraph('☝🏼 Если после антипаразитарки нет желания завтракать — пропускаем прием пищи. Но тогда не перекусываем фруктами до обеда, только горячая вода с 10 каплями пихтового масла.', 2)
  ]),

  schedule_day: createRichText([
    heading('☀️ Д Е Н Ь', 'h3'),
    bulletList([
      'Напиток ДЕНЬ 150 мл в обеденное время, за 15 минут до приема пищи',
      'Обед',
      'Бифидумфаната 150мл через час после еды'
    ]),
    paragraph('В течение дня добавляем в воду/напитки сенную палочку по схеме 🪄', 2)
  ]),

  schedule_evening: createRichText([
    heading('🌙 В Е Ч Е Р', 'h3'),
    bulletList([
      'Чистим кровь: горячая вода 150 мл + пихтовое масло 10 капель + озонированное масло 5 капель',
      'Спорт (Разминка + Сеты упражнений) — в дни спорта',
      'Напиток ВЕЧЕР 150 мл за 15 минут до приема пищи',
      'Ужин (25% порции не доедаем — ломаем привычки)',
      'При вечерней чистке зубов в пасту добавляем озонированное масло',
      'Дыхательная практика за 2 часа до сна',
      'Озонированным и пихтовым маслами смазываем ноздри перед сном',
      'Отправляем отчет'
    ])
  ]),

  diet_recommendations: createRichText([
    heading('👍 Р Е К О М Е Н Д У Е М', 'h2'),
    bulletList([
      'Брать с собой боксы с едой. Готовьте еду заранее 🤗',
      'Пусть под рукой всегда будет каша ЭТРАСУТРА и антипаразитарка',
      'Перерывы между приемами пищи не менее 4 часов',
      'Включаем в рацион: авокадо, редис, зелень, дайкон, репа, редька, спаржа, крестоцветы, проростки, сок лимона, приправы без соли, орехи замоченные 🌰',
      'Побольше сыродавленного масла',
      'Огурцы, морковь, свеклу и твердые овощи натираем',
      'Фрукты употребляем до 20:00. Дыню лучше не включать',
      'Фрукты и овощи — не более 2-3 видов за раз'
    ]),
    heading('👎 И С К Л Ю Ч А Е М', 'h2'),
    bulletList([
      '❌ Любой хлеб (исключение: бездрожжевой, ржаной или пп хлебцы)',
      '❌ Молочку',
      '❌ Красное мясо',
      '❌ Птицу кроме индейки',
      '❌ Рыбу (исключение: белая рыба, форель)',
      '❌ Алкоголь'
    ])
  ]),

  contraindications: createRichText([
    heading('❗️ ПРОТИВОПОКАЗАНИЯ', 'h2'),
    paragraph('В случае если у вас имеются противопоказания (воспалительные процессы, язва, хронические заболевания, беременность и пр.), пожалуйста, обратитесь к организаторам для коррекции программы.')
  ]),

  rules: createRichText([
    heading('📋 Правила МЕГАГЕНЕЗА', 'h2'),
    paragraph('Без дисциплины свобода невозможна. Поэтому мы ввели обязательное условие участия в ЭТРАГЕНЕЗЕ — отчет, который на ежедневной основе нужно публиковать.'),
    paragraph('Отсутствие трех и более отчетов может стать основанием отказа участнику в дальнейшем прохождении курса.', 1),
    heading('Первая неделя — переключение', 'h3'),
    paragraph('Тем, у кого сильные привычки и стандартный образ жизни, нужно помнить — переключаемся без "ломок". Если процесс слишком сложен, то исключаем по 50% массы привычного рациона, заменяя рекомендованным.')
  ]),

  report_template: JSON.stringify([
    { item: 'Энзимные напитки', emoji: '🧃' },
    { item: 'Соблюдение рекомендаций по питанию и объема порции', emoji: '🥗' },
    { item: 'Антипаразитарка', emoji: '💊' },
    { item: 'Масла', emoji: '🫒' },
    { item: 'Живое железо', emoji: '💧' },
    { item: 'Сенная палочка', emoji: '🦠' },
    { item: 'Комплекс упражнений Пробуждение (Контрастный душ / лимфодренаж / зарядка)', emoji: '🚿' },
    { item: 'Спорт (в дни спорта)', emoji: '🏋️' },
    { item: 'Дыхательная практика', emoji: '🧘' },
    { item: 'Дополнительно', emoji: '➕' }
  ]),

  report_rules_max_missed: 3,
  report_rules_penalty: createRichText([
    paragraph('Отсутствие трех и более отчетов может стать основанием отказа участнику в дальнейшем прохождении курса.')
  ]),

  team: JSON.stringify([
    { name: 'Наталья', role: 'Основатель ЭТРА, автор курса' },
    { name: 'Команда поддержки ЭТРА', role: 'Кураторы и организаторы' }
  ]),

  seo_title: 'МЕГАГЕНЕЗ — 21-дневный курс очищения | ЭТРА',
  seo_description: 'Уникальный курс очищения и трансформации. Мягкий, бережный подход к изменениям среди единомышленников при поддержке команды ЭТРА.'
}

// Модули курса
const MODULES = [
  { title: 'НАВИГАЦИЯ', slug: 'megagenez-navigation', type: 'navigation', icon: '⭐️', order: 1, description: 'Наша группа состоит из тематических веток, каждая из которых посвящена какому-либо аспекту ЭТРАГЕНЕЗА.' },
  { title: 'ОБЩЕНИЕ', slug: 'megagenez-communication', type: 'communication', icon: '💬', order: 2, description: 'Работа над собой в кругу единомышленников. Поддержка, обмен мыслями, достижениями, сомнениями, опытом.' },
  { title: 'РАСПИСАНИЕ', slug: 'megagenez-schedule', type: 'schedule', icon: '📋', order: 3, description: 'Ежедневный график питания, упражнений, подготовки к процедурам.' },
  { title: 'ПРОДУКЦИЯ', slug: 'megagenez-products', type: 'products', icon: '🛍', order: 4, description: 'Подробное описание продуктов курса с рекомендациями по применению.' },
  { title: 'МОТИВАЦИОННАЯ', slug: 'megagenez-motivation', type: 'motivation', icon: '✨', order: 5, description: 'Вдохновение на пути к чистоте.' },
  { title: 'ЭФИРЫ', slug: 'megagenez-broadcasts', type: 'broadcasts', icon: '🎞', order: 6, description: 'Расписание и записи всех эфиров.' },
  { title: 'ВОПРОСЫ К ЭФИРАМ', slug: 'megagenez-qa', type: 'qa', icon: '❔', order: 7, description: 'Задайте любой волнующий вопрос — он будет освещен на ближайшем эфире.' },
  { title: 'СПОРТ', slug: 'megagenez-sport', type: 'sport', icon: '🏄‍♂️', order: 8, description: 'Упражнения для разного уровня подготовки.' },
  { title: 'ОТЧЕТЫ', slug: 'megagenez-reports', type: 'reports', icon: '❗️', order: 9, description: 'Ежедневные отчеты участников. Обязательное условие участия.' },
  { title: 'ЭТРА КАФЕ', slug: 'megagenez-recipes', type: 'recipes', icon: '🍹', order: 10, description: 'Любимые и интересные рецепты.' },
  { title: 'РЕЗУЛЬТАТЫ', slug: 'megagenez-results', type: 'results', icon: '🏆', order: 11, description: 'Промежуточные и итоговые результаты участников.' },
  { title: 'ПРОТОКОЛЫ', slug: 'megagenez-protocols', type: 'protocols', icon: '📑', order: 12, description: 'Дополнительная информация и протоколы курса.' }
]

async function seed() {
  console.log('🚀 Connecting to database...')
  await client.connect()
  console.log('✅ Connected!')

  try {
    // Check if infoproduct exists
    const existing = await client.query(
      `SELECT id FROM infoproducts WHERE slug = $1`,
      [MEGAGENEZ.slug]
    )

    let infoproductId

    if (existing.rows.length > 0) {
      infoproductId = existing.rows[0].id
      console.log(`⚠️ МЕГАГЕНЕЗ already exists (ID: ${infoproductId}), updating...`)
      
      await client.query(`
        UPDATE infoproducts SET
          title = $1,
          type = $2,
          status = $3,
          short_description = $4,
          price = $5,
          old_price = $6,
          duration_days = $7,
          schedule_morning = $8,
          schedule_day = $9,
          schedule_evening = $10,
          diet_recommendations = $11,
          contraindications = $12,
          rules = $13,
          report_rules_max_missed = $14,
          report_rules_penalty = $15,
          seo_title = $16,
          seo_description = $17,
          updated_at = NOW()
        WHERE id = $18
      `, [
        MEGAGENEZ.title,
        MEGAGENEZ.type,
        MEGAGENEZ.status,
        MEGAGENEZ.short_description,
        MEGAGENEZ.price,
        MEGAGENEZ.old_price,
        MEGAGENEZ.duration_days,
        MEGAGENEZ.schedule_morning,
        MEGAGENEZ.schedule_day,
        MEGAGENEZ.schedule_evening,
        MEGAGENEZ.diet_recommendations,
        MEGAGENEZ.contraindications,
        MEGAGENEZ.rules,
        MEGAGENEZ.report_rules_max_missed,
        MEGAGENEZ.report_rules_penalty,
        MEGAGENEZ.seo_title,
        MEGAGENEZ.seo_description,
        infoproductId
      ])
      console.log(`✅ Updated infoproduct`)
    } else {
      const result = await client.query(`
        INSERT INTO infoproducts (
          title, slug, type, status, short_description, price, old_price, duration_days,
          schedule_morning, schedule_day, schedule_evening,
          diet_recommendations, contraindications, rules,
          report_rules_max_missed, report_rules_penalty,
          seo_title, seo_description,
          created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, NOW(), NOW()
        ) RETURNING id
      `, [
        MEGAGENEZ.title,
        MEGAGENEZ.slug,
        MEGAGENEZ.type,
        MEGAGENEZ.status,
        MEGAGENEZ.short_description,
        MEGAGENEZ.price,
        MEGAGENEZ.old_price,
        MEGAGENEZ.duration_days,
        MEGAGENEZ.schedule_morning,
        MEGAGENEZ.schedule_day,
        MEGAGENEZ.schedule_evening,
        MEGAGENEZ.diet_recommendations,
        MEGAGENEZ.contraindications,
        MEGAGENEZ.rules,
        MEGAGENEZ.report_rules_max_missed,
        MEGAGENEZ.report_rules_penalty,
        MEGAGENEZ.seo_title,
        MEGAGENEZ.seo_description
      ])
      infoproductId = result.rows[0].id
      console.log(`✅ Created infoproduct (ID: ${infoproductId})`)
    }

    // Create modules
    console.log('\n📦 Creating course modules...')
    
    for (const mod of MODULES) {
      const existingMod = await client.query(
        `SELECT id FROM course_modules WHERE slug = $1`,
        [mod.slug]
      )

      const content = createRichText([
        heading(`${mod.icon} ${mod.title}`, 'h2'),
        paragraph(mod.description)
      ])

      if (existingMod.rows.length > 0) {
        await client.query(`
          UPDATE course_modules SET
            title = $1, type = $2, icon = $3, description = $4, content = $5,
            "order" = $6, visible = true, infoproduct_id = $7, updated_at = NOW()
          WHERE id = $8
        `, [mod.title, mod.type, mod.icon, mod.description, content, mod.order, infoproductId, existingMod.rows[0].id])
        console.log(`  ✅ Updated: ${mod.title}`)
      } else {
        await client.query(`
          INSERT INTO course_modules (
            title, slug, type, icon, description, content, "order", visible, infoproduct_id, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, true, $8, NOW(), NOW())
        `, [mod.title, mod.slug, mod.type, mod.icon, mod.description, content, mod.order, infoproductId])
        console.log(`  ✅ Created: ${mod.title}`)
      }
    }

    console.log('\n🎉 МЕГАГЕНЕЗ seed completed!')
    console.log(`\n📊 Summary:`)
    console.log(`  - Infoproduct ID: ${infoproductId}`)
    console.log(`  - Modules: ${MODULES.length}`)
    console.log(`  - Duration: ${MEGAGENEZ.duration_days} days`)
    console.log(`  - Price: ${MEGAGENEZ.price}₽`)

  } catch (err) {
    console.error('❌ Error:', err.message)
    throw err
  } finally {
    await client.end()
  }
}

seed().catch(err => {
  console.error('❌ Seed failed:', err)
  process.exit(1)
})
