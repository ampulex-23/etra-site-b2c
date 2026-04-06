import pg from 'pg'
const { Client } = pg

const DATABASE_URL = 'postgresql://gen_user:Fk5L^s@Yqw^XX;@de5da695d6c895f89bec5d5e.twc1.net:5432/default_db'

const DELIVERY_PAYMENT_CONTENT = {
  root: {
    type: 'root',
    direction: 'ltr',
    format: '',
    indent: 0,
    version: 1,
    children: [
      {
        type: 'heading',
        tag: 'h2',
        direction: 'ltr',
        format: '',
        indent: 0,
        version: 1,
        children: [
          {
            type: 'text',
            text: '📦 Доставка',
            format: 1,
            mode: 'normal',
            style: '',
            detail: 0,
            version: 1
          }
        ]
      },
      {
        type: 'paragraph',
        direction: 'ltr',
        format: '',
        indent: 0,
        version: 1,
        textFormat: 0,
        textStyle: '',
        children: [
          {
            type: 'text',
            text: 'Мы доставляем продукцию ЭТРА по всей России через надёжные службы доставки.',
            format: 0,
            mode: 'normal',
            style: '',
            detail: 0,
            version: 1
          }
        ]
      },
      {
        type: 'heading',
        tag: 'h3',
        direction: 'ltr',
        format: '',
        indent: 0,
        version: 1,
        children: [
          {
            type: 'text',
            text: '🚚 Способы доставки',
            format: 1,
            mode: 'normal',
            style: '',
            detail: 0,
            version: 1
          }
        ]
      },
      {
        type: 'paragraph',
        direction: 'ltr',
        format: '',
        indent: 0,
        version: 1,
        textFormat: 0,
        textStyle: '',
        children: [
          {
            type: 'text',
            text: '1. СДЭК до пункта выдачи',
            format: 1,
            mode: 'normal',
            style: '',
            detail: 0,
            version: 1
          }
        ]
      },
      {
        type: 'paragraph',
        direction: 'ltr',
        format: '',
        indent: 0,
        version: 1,
        textFormat: 0,
        textStyle: '',
        children: [
          {
            type: 'text',
            text: 'Самый популярный и выгодный способ. Вы выбираете удобный пункт выдачи СДЭК в вашем городе, и мы отправляем туда заказ. Стоимость и сроки доставки рассчитываются автоматически при оформлении заказа.',
            format: 0,
            mode: 'normal',
            style: '',
            detail: 0,
            version: 1
          }
        ]
      },
      {
        type: 'paragraph',
        direction: 'ltr',
        format: '',
        indent: 0,
        version: 1,
        textFormat: 0,
        textStyle: '',
        children: [
          {
            type: 'text',
            text: '✅ Срок доставки: 2-7 дней в зависимости от региона',
            format: 0,
            mode: 'normal',
            style: '',
            detail: 0,
            version: 1
          }
        ]
      },
      {
        type: 'paragraph',
        direction: 'ltr',
        format: '',
        indent: 0,
        version: 1,
        textFormat: 0,
        textStyle: '',
        children: [
          {
            type: 'text',
            text: '✅ Бесплатное хранение в пункте выдачи до 7 дней',
            format: 0,
            mode: 'normal',
            style: '',
            detail: 0,
            version: 1
          }
        ]
      },
      {
        type: 'paragraph',
        direction: 'ltr',
        format: '',
        indent: 0,
        version: 1,
        textFormat: 0,
        textStyle: '',
        children: [
          {
            type: 'text',
            text: '2. СДЭК курьером до двери',
            format: 1,
            mode: 'normal',
            style: '',
            detail: 0,
            version: 1
          }
        ]
      },
      {
        type: 'paragraph',
        direction: 'ltr',
        format: '',
        indent: 0,
        version: 1,
        textFormat: 0,
        textStyle: '',
        children: [
          {
            type: 'text',
            text: 'Курьер СДЭК доставит заказ прямо к вашей двери. Стоимость выше, чем до пункта выдачи, но максимально удобно.',
            format: 0,
            mode: 'normal',
            style: '',
            detail: 0,
            version: 1
          }
        ]
      },
      {
        type: 'paragraph',
        direction: 'ltr',
        format: '',
        indent: 0,
        version: 1,
        textFormat: 0,
        textStyle: '',
        children: [
          {
            type: 'text',
            text: '✅ Срок доставки: 2-7 дней',
            format: 0,
            mode: 'normal',
            style: '',
            detail: 0,
            version: 1
          }
        ]
      },
      {
        type: 'paragraph',
        direction: 'ltr',
        format: '',
        indent: 0,
        version: 1,
        textFormat: 0,
        textStyle: '',
        children: [
          {
            type: 'text',
            text: '✅ Доставка в удобное время',
            format: 0,
            mode: 'normal',
            style: '',
            detail: 0,
            version: 1
          }
        ]
      },
      {
        type: 'paragraph',
        direction: 'ltr',
        format: '',
        indent: 0,
        version: 1,
        textFormat: 0,
        textStyle: '',
        children: [
          {
            type: 'text',
            text: '3. Почта России',
            format: 1,
            mode: 'normal',
            style: '',
            detail: 0,
            version: 1
          }
        ]
      },
      {
        type: 'paragraph',
        direction: 'ltr',
        format: '',
        indent: 0,
        version: 1,
        textFormat: 0,
        textStyle: '',
        children: [
          {
            type: 'text',
            text: 'Доставка в любую точку России, включая отдалённые регионы.',
            format: 0,
            mode: 'normal',
            style: '',
            detail: 0,
            version: 1
          }
        ]
      },
      {
        type: 'paragraph',
        direction: 'ltr',
        format: '',
        indent: 0,
        version: 1,
        textFormat: 0,
        textStyle: '',
        children: [
          {
            type: 'text',
            text: '✅ Срок доставки: 7-14 дней',
            format: 0,
            mode: 'normal',
            style: '',
            detail: 0,
            version: 1
          }
        ]
      },
      {
        type: 'paragraph',
        direction: 'ltr',
        format: '',
        indent: 0,
        version: 1,
        textFormat: 0,
        textStyle: '',
        children: [
          {
            type: 'text',
            text: '✅ Доступна для всех регионов',
            format: 0,
            mode: 'normal',
            style: '',
            detail: 0,
            version: 1
          }
        ]
      },
      {
        type: 'paragraph',
        direction: 'ltr',
        format: '',
        indent: 0,
        version: 1,
        textFormat: 0,
        textStyle: '',
        children: [
          {
            type: 'text',
            text: '4. Самовывоз',
            format: 1,
            mode: 'normal',
            style: '',
            detail: 0,
            version: 1
          }
        ]
      },
      {
        type: 'paragraph',
        direction: 'ltr',
        format: '',
        indent: 0,
        version: 1,
        textFormat: 0,
        textStyle: '',
        children: [
          {
            type: 'text',
            text: 'Вы можете забрать заказ самостоятельно с нашего склада. При оформлении заказа выберите способ доставки "Самовывоз" и мы свяжемся с вами для согласования времени.',
            format: 0,
            mode: 'normal',
            style: '',
            detail: 0,
            version: 1
          }
        ]
      },
      {
        type: 'paragraph',
        direction: 'ltr',
        format: '',
        indent: 0,
        version: 1,
        textFormat: 0,
        textStyle: '',
        children: [
          {
            type: 'text',
            text: '✅ Бесплатно',
            format: 0,
            mode: 'normal',
            style: '',
            detail: 0,
            version: 1
          }
        ]
      },
      {
        type: 'paragraph',
        direction: 'ltr',
        format: '',
        indent: 0,
        version: 1,
        textFormat: 0,
        textStyle: '',
        children: [
          {
            type: 'text',
            text: '✅ Готово в течение 1-2 дней',
            format: 0,
            mode: 'normal',
            style: '',
            detail: 0,
            version: 1
          }
        ]
      },
      {
        type: 'heading',
        tag: 'h3',
        direction: 'ltr',
        format: '',
        indent: 0,
        version: 1,
        children: [
          {
            type: 'text',
            text: '📍 Отслеживание заказа',
            format: 1,
            mode: 'normal',
            style: '',
            detail: 0,
            version: 1
          }
        ]
      },
      {
        type: 'paragraph',
        direction: 'ltr',
        format: '',
        indent: 0,
        version: 1,
        textFormat: 0,
        textStyle: '',
        children: [
          {
            type: 'text',
            text: 'После отправки заказа вы получите трек-номер для отслеживания. Статус доставки можно проверить:',
            format: 0,
            mode: 'normal',
            style: '',
            detail: 0,
            version: 1
          }
        ]
      },
      {
        type: 'paragraph',
        direction: 'ltr',
        format: '',
        indent: 0,
        version: 1,
        textFormat: 0,
        textStyle: '',
        children: [
          {
            type: 'text',
            text: '• В личном кабинете на сайте в разделе "Мои заказы"',
            format: 0,
            mode: 'normal',
            style: '',
            detail: 0,
            version: 1
          }
        ]
      },
      {
        type: 'paragraph',
        direction: 'ltr',
        format: '',
        indent: 0,
        version: 1,
        textFormat: 0,
        textStyle: '',
        children: [
          {
            type: 'text',
            text: '• На сайте службы доставки по трек-номеру',
            format: 0,
            mode: 'normal',
            style: '',
            detail: 0,
            version: 1
          }
        ]
      },
      {
        type: 'heading',
        tag: 'h2',
        direction: 'ltr',
        format: '',
        indent: 0,
        version: 1,
        children: [
          {
            type: 'text',
            text: '💳 Оплата',
            format: 1,
            mode: 'normal',
            style: '',
            detail: 0,
            version: 1
          }
        ]
      },
      {
        type: 'paragraph',
        direction: 'ltr',
        format: '',
        indent: 0,
        version: 1,
        textFormat: 0,
        textStyle: '',
        children: [
          {
            type: 'text',
            text: 'Мы принимаем различные способы оплаты для вашего удобства.',
            format: 0,
            mode: 'normal',
            style: '',
            detail: 0,
            version: 1
          }
        ]
      },
      {
        type: 'heading',
        tag: 'h3',
        direction: 'ltr',
        format: '',
        indent: 0,
        version: 1,
        children: [
          {
            type: 'text',
            text: '💰 Способы оплаты',
            format: 1,
            mode: 'normal',
            style: '',
            detail: 0,
            version: 1
          }
        ]
      },
      {
        type: 'paragraph',
        direction: 'ltr',
        format: '',
        indent: 0,
        version: 1,
        textFormat: 0,
        textStyle: '',
        children: [
          {
            type: 'text',
            text: '1. Онлайн-оплата банковской картой',
            format: 1,
            mode: 'normal',
            style: '',
            detail: 0,
            version: 1
          }
        ]
      },
      {
        type: 'paragraph',
        direction: 'ltr',
        format: '',
        indent: 0,
        version: 1,
        textFormat: 0,
        textStyle: '',
        children: [
          {
            type: 'text',
            text: 'Оплата картами Visa, MasterCard, МИР через защищённую платёжную систему. Данные вашей карты защищены и не передаются третьим лицам.',
            format: 0,
            mode: 'normal',
            style: '',
            detail: 0,
            version: 1
          }
        ]
      },
      {
        type: 'paragraph',
        direction: 'ltr',
        format: '',
        indent: 0,
        version: 1,
        textFormat: 0,
        textStyle: '',
        children: [
          {
            type: 'text',
            text: '✅ Мгновенное подтверждение оплаты',
            format: 0,
            mode: 'normal',
            style: '',
            detail: 0,
            version: 1
          }
        ]
      },
      {
        type: 'paragraph',
        direction: 'ltr',
        format: '',
        indent: 0,
        version: 1,
        textFormat: 0,
        textStyle: '',
        children: [
          {
            type: 'text',
            text: '✅ Безопасно и надёжно',
            format: 0,
            mode: 'normal',
            style: '',
            detail: 0,
            version: 1
          }
        ]
      },
      {
        type: 'paragraph',
        direction: 'ltr',
        format: '',
        indent: 0,
        version: 1,
        textFormat: 0,
        textStyle: '',
        children: [
          {
            type: 'text',
            text: '2. Оплата при получении',
            format: 1,
            mode: 'normal',
            style: '',
            detail: 0,
            version: 1
          }
        ]
      },
      {
        type: 'paragraph',
        direction: 'ltr',
        format: '',
        indent: 0,
        version: 1,
        textFormat: 0,
        textStyle: '',
        children: [
          {
            type: 'text',
            text: 'Вы можете оплатить заказ наличными или картой при получении в пункте выдачи или курьеру.',
            format: 0,
            mode: 'normal',
            style: '',
            detail: 0,
            version: 1
          }
        ]
      },
      {
        type: 'paragraph',
        direction: 'ltr',
        format: '',
        indent: 0,
        version: 1,
        textFormat: 0,
        textStyle: '',
        children: [
          {
            type: 'text',
            text: '✅ Оплата после осмотра товара',
            format: 0,
            mode: 'normal',
            style: '',
            detail: 0,
            version: 1
          }
        ]
      },
      {
        type: 'paragraph',
        direction: 'ltr',
        format: '',
        indent: 0,
        version: 1,
        textFormat: 0,
        textStyle: '',
        children: [
          {
            type: 'text',
            text: '⚠️ Комиссия службы доставки за наложенный платёж',
            format: 0,
            mode: 'normal',
            style: '',
            detail: 0,
            version: 1
          }
        ]
      },
      {
        type: 'paragraph',
        direction: 'ltr',
        format: '',
        indent: 0,
        version: 1,
        textFormat: 0,
        textStyle: '',
        children: [
          {
            type: 'text',
            text: '3. Банковский перевод для юридических лиц',
            format: 1,
            mode: 'normal',
            style: '',
            detail: 0,
            version: 1
          }
        ]
      },
      {
        type: 'paragraph',
        direction: 'ltr',
        format: '',
        indent: 0,
        version: 1,
        textFormat: 0,
        textStyle: '',
        children: [
          {
            type: 'text',
            text: 'Работаем с юридическими лицами по безналичному расчёту. Предоставляем все необходимые документы.',
            format: 0,
            mode: 'normal',
            style: '',
            detail: 0,
            version: 1
          }
        ]
      },
      {
        type: 'paragraph',
        direction: 'ltr',
        format: '',
        indent: 0,
        version: 1,
        textFormat: 0,
        textStyle: '',
        children: [
          {
            type: 'text',
            text: '✅ Договор и закрывающие документы',
            format: 0,
            mode: 'normal',
            style: '',
            detail: 0,
            version: 1
          }
        ]
      },
      {
        type: 'paragraph',
        direction: 'ltr',
        format: '',
        indent: 0,
        version: 1,
        textFormat: 0,
        textStyle: '',
        children: [
          {
            type: 'text',
            text: '✅ Работа с НДС и без НДС',
            format: 0,
            mode: 'normal',
            style: '',
            detail: 0,
            version: 1
          }
        ]
      },
      {
        type: 'heading',
        tag: 'h3',
        direction: 'ltr',
        format: '',
        indent: 0,
        version: 1,
        children: [
          {
            type: 'text',
            text: '🔒 Безопасность платежей',
            format: 1,
            mode: 'normal',
            style: '',
            detail: 0,
            version: 1
          }
        ]
      },
      {
        type: 'paragraph',
        direction: 'ltr',
        format: '',
        indent: 0,
        version: 1,
        textFormat: 0,
        textStyle: '',
        children: [
          {
            type: 'text',
            text: 'Все онлайн-платежи проходят через защищённое соединение с использованием протокола SSL. Данные вашей карты шифруются и не сохраняются на нашем сервере.',
            format: 0,
            mode: 'normal',
            style: '',
            detail: 0,
            version: 1
          }
        ]
      },
      {
        type: 'paragraph',
        direction: 'ltr',
        format: '',
        indent: 0,
        version: 1,
        textFormat: 0,
        textStyle: '',
        children: [
          {
            type: 'text',
            text: 'После успешной оплаты вы получите электронный чек на указанный email.',
            format: 0,
            mode: 'normal',
            style: '',
            detail: 0,
            version: 1
          }
        ]
      },
      {
        type: 'heading',
        tag: 'h2',
        direction: 'ltr',
        format: '',
        indent: 0,
        version: 1,
        children: [
          {
            type: 'text',
            text: '📞 Остались вопросы?',
            format: 1,
            mode: 'normal',
            style: '',
            detail: 0,
            version: 1
          }
        ]
      },
      {
        type: 'paragraph',
        direction: 'ltr',
        format: '',
        indent: 0,
        version: 1,
        textFormat: 0,
        textStyle: '',
        children: [
          {
            type: 'text',
            text: 'Если у вас возникли вопросы по доставке или оплате, свяжитесь с нами любым удобным способом:',
            format: 0,
            mode: 'normal',
            style: '',
            detail: 0,
            version: 1
          }
        ]
      },
      {
        type: 'paragraph',
        direction: 'ltr',
        format: '',
        indent: 0,
        version: 1,
        textFormat: 0,
        textStyle: '',
        children: [
          {
            type: 'text',
            text: '📧 Email: info@etraproject.ru',
            format: 0,
            mode: 'normal',
            style: '',
            detail: 0,
            version: 1
          }
        ]
      },
      {
        type: 'paragraph',
        direction: 'ltr',
        format: '',
        indent: 0,
        version: 1,
        textFormat: 0,
        textStyle: '',
        children: [
          {
            type: 'text',
            text: '💬 Telegram: @etra_support',
            format: 0,
            mode: 'normal',
            style: '',
            detail: 0,
            version: 1
          }
        ]
      },
      {
        type: 'paragraph',
        direction: 'ltr',
        format: '',
        indent: 0,
        version: 1,
        textFormat: 0,
        textStyle: '',
        children: [
          {
            type: 'text',
            text: 'Мы работаем ежедневно с 9:00 до 21:00 по московскому времени.',
            format: 0,
            mode: 'normal',
            style: '',
            detail: 0,
            version: 1
          }
        ]
      }
    ]
  }
}

async function createDeliveryPaymentPage() {
  const client = new Client({ connectionString: DATABASE_URL })
  await client.connect()

  try {
    console.log('📄 Creating "Доставка и Оплата" page...')

    // Check if page already exists
    const existing = await client.query(
      'SELECT id FROM posts WHERE slug = $1',
      ['dostavka-i-oplata']
    )

    if (existing.rows.length > 0) {
      console.log('⚠️  Page already exists, updating...')
      await client.query(
        `UPDATE posts 
         SET title = $1, 
             excerpt = $2, 
             content = $3, 
             category = $4, 
             status = $5, 
             published_at = $6,
             updated_at = NOW()
         WHERE slug = $7`,
        [
          'Доставка и Оплата',
          'Информация о способах доставки и оплаты заказов в интернет-магазине ЭТРА',
          JSON.stringify(DELIVERY_PAYMENT_CONTENT),
          'Служебные страницы',
          'published',
          new Date().toISOString(),
          'dostavka-i-oplata'
        ]
      )
      console.log('✅ Page updated successfully!')
    } else {
      await client.query(
        `INSERT INTO posts (
          title, slug, excerpt, content, category, status, published_at, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())`,
        [
          'Доставка и Оплата',
          'dostavka-i-oplata',
          'Информация о способах доставки и оплаты заказов в интернет-магазине ЭТРА',
          JSON.stringify(DELIVERY_PAYMENT_CONTENT),
          'Служебные страницы',
          'published',
          new Date().toISOString()
        ]
      )
      console.log('✅ Page created successfully!')
    }

    console.log('\n🔗 Page URL: https://etraproject.ru/articles/dostavka-i-oplata')
    console.log('📁 Category: Служебные страницы')

  } catch (err) {
    console.error('❌ Error:', err.message)
  } finally {
    await client.end()
  }
}

createDeliveryPaymentPage()
