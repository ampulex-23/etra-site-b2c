# Интеграция платежного шлюза T-Bank (Tinkoff)

## Обзор

Интеграция с интернет-эквайрингом T-Bank позволяет принимать платежи на сайте через:
- Банковские карты (Visa, MasterCard, МИР)
- T-Pay (оплата через приложение T-Bank)
- СБП (Система быстрых платежей)
- SberPay, Alfa Pay, Mir Pay

## Архитектура

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Frontend      │     │   Backend API   │     │   T-Bank API    │
│   (Next.js)     │────▶│   (Next.js)     │────▶│   securepay     │
└─────────────────┘     └─────────────────┘     └─────────────────┘
        │                       │                       │
        │                       │                       │
        ▼                       ▼                       ▼
   Checkout Page         /api/payments/init      POST /v2/Init
        │                       │                       │
        │                       │                       │
        ▼                       ▼                       ▼
   Redirect to           PaymentURL              Payment Form
   PaymentURL                                    (T-Bank hosted)
        │                                               │
        │                                               │
        ▼                                               ▼
   Success/Fail          /api/payments/          Notification
   Page                  notification            (webhook)
```

## Файлы проекта

```
src/
├── lib/
│   └── tbank-payment.ts          # Основной модуль API
├── app/
│   ├── api/payments/
│   │   ├── init/route.ts         # Инициализация платежа
│   │   ├── notification/route.ts # Webhook уведомлений
│   │   └── status/route.ts       # Проверка статуса
│   └── (frontend)/payment/
│       ├── success/page.tsx      # Страница успешной оплаты
│       └── fail/page.tsx         # Страница неуспешной оплаты
```

## Настройка

### 1. Получение credentials в ЛК T-Bank

1. Войдите в [T-Бизнес](https://business.tbank.ru)
2. Перейдите: **Интернет-эквайринг → Магазины**
3. Создайте новый магазин (как на скриншоте пользователя):
   - Ссылка на сайт: `https://etraproject.ru`
   - Включите "Сайт в разработке или есть приложение"
   - Укажите доступ к тестированию
4. На вкладке **Терминалы** нажмите **Настроить**
5. Выберите тип подключения: **Универсальное**
6. Настройте URLs:
   - **NotificationURL**: `https://etraproject.ru/api/payments/notification`
   - **SuccessURL**: `https://etraproject.ru/payment/success`
   - **FailURL**: `https://etraproject.ru/payment/fail`
7. Скопируйте **TerminalKey** и **Password**

### 2. Настройка переменных окружения

Скопируйте `.env.tbank.example` в `.env.local` и заполните:

```bash
# Production
TBANK_TERMINAL_KEY=your_terminal_key
TBANK_PASSWORD=your_password

# Demo (для тестирования)
TBANK_DEMO_TERMINAL_KEY=your_demo_terminal_key
TBANK_DEMO_PASSWORD=your_demo_password

# Site URL
NEXT_PUBLIC_SITE_URL=https://etraproject.ru
```

### 3. Включение способов оплаты

В ЛК T-Bank → Магазины → Прием оплаты → Настроить:
- ✅ Оплата картой
- ✅ T-Pay
- ✅ СБП
- ✅ SberPay (опционально)

## Использование

### Инициализация платежа

```typescript
// Frontend: вызов API
const response = await fetch('/api/payments/init', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    amount: 1500, // 1500 рублей
    description: 'Заказ ЭТРА #12345',
    customerEmail: 'customer@example.com',
    items: [
      { name: 'ЭТРА Закваска', price: 500, quantity: 3 }
    ]
  })
})

const { paymentUrl } = await response.json()

// Редирект на платежную форму T-Bank
window.location.href = paymentUrl
```

### Обработка уведомлений

Webhook `/api/payments/notification` автоматически:
1. Проверяет подпись токена
2. Обрабатывает статусы: AUTHORIZED, CONFIRMED, REJECTED, REFUNDED
3. Возвращает "OK" для подтверждения

### Проверка статуса

```typescript
const response = await fetch(`/api/payments/status?paymentId=${paymentId}`)
const { status, orderId, amount } = await response.json()
```

## Тестирование

### Тестовые карты

| Сценарий | Номер карты | CVV | Результат |
|----------|-------------|-----|-----------|
| Успешная оплата | 4300 0000 0000 0777 | любой | Success |
| Отклонено | 4300 0000 0000 0000 | любой | Fail |
| 3D-Secure | 5100 0000 0000 0008 | любой | Код: 12345678 |

### Локальное тестирование

Для тестирования webhook локально используйте ngrok:

```bash
ngrok http 3000
```

Затем обновите NotificationURL в ЛК T-Bank на ngrok URL.

## Статусы платежа

| Статус | Описание |
|--------|----------|
| NEW | Платеж создан |
| FORM_SHOWED | Форма показана покупателю |
| AUTHORIZING | Авторизация |
| 3DS_CHECKING | Проверка 3D-Secure |
| 3DS_CHECKED | 3D-Secure пройден |
| AUTHORIZED | Авторизован (для двухстадийной) |
| CONFIRMING | Подтверждение |
| CONFIRMED | Подтвержден (деньги списаны) |
| REVERSING | Отмена |
| REVERSED | Отменен |
| REFUNDING | Возврат |
| REFUNDED | Возвращен |
| REJECTED | Отклонен |

## Безопасность

1. **Токен подписи** — каждый запрос подписывается SHA-256 хешем
2. **Проверка уведомлений** — webhook проверяет подпись от T-Bank
3. **HTTPS** — все запросы только через HTTPS
4. **Credentials** — храните в переменных окружения, не в коде

## Фискализация (54-ФЗ)

Для соответствия 54-ФЗ передавайте объект `Receipt` с товарами:

```typescript
{
  Receipt: {
    Email: 'customer@example.com',
    Phone: '+79001234567',
    Taxation: 'usn_income', // Система налогообложения
    Items: [
      {
        Name: 'ЭТРА Закваска',
        Price: 50000, // в копейках
        Quantity: 1,
        Amount: 50000,
        Tax: 'none', // НДС
        PaymentMethod: 'full_prepayment',
        PaymentObject: 'commodity'
      }
    ]
  }
}
```

## Ссылки

- [Документация T-Bank API](https://developer.tbank.ru/eacq/api/init)
- [Личный кабинет](https://business.tbank.ru/oplata/main)
- [Сценарии интеграции](https://developer.tbank.ru/eacq/scenarios/payments/nonPCI)
- [Формирование токена](https://developer.tbank.ru/eacq/intro/developer/token)
