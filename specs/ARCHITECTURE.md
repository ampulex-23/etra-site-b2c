# Архитектура etraproject.ru

## Структура проекта

```
site-b2c/
├── public/                     # статические файлы (favicon, robots.txt)
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (frontend)/         # публичные страницы (layout без админки)
│   │   │   ├── page.tsx        # главная / лендинг
│   │   │   ├── catalog/
│   │   │   │   ├── page.tsx    # каталог товаров
│   │   │   │   └── [slug]/
│   │   │   │       └── page.tsx # карточка товара
│   │   │   ├── blog/
│   │   │   │   ├── page.tsx    # список статей
│   │   │   │   └── [slug]/
│   │   │   │       └── page.tsx # статья
│   │   │   ├── recipes/
│   │   │   │   ├── page.tsx    # рецепты
│   │   │   │   └── [slug]/
│   │   │   │       └── page.tsx # рецепт
│   │   │   ├── about/
│   │   │   │   └── page.tsx    # о проекте
│   │   │   ├── contacts/
│   │   │   │   └── page.tsx    # контакты
│   │   │   ├── cart/
│   │   │   │   └── page.tsx    # корзина
│   │   │   ├── checkout/
│   │   │   │   └── page.tsx    # оформление заказа
│   │   │   ├── auth/
│   │   │   │   ├── login/
│   │   │   │   ├── register/
│   │   │   │   ├── reset-password/
│   │   │   │   └── verify/
│   │   │   ├── account/        # ЛК клиента
│   │   │   │   ├── page.tsx    # профиль
│   │   │   │   ├── orders/
│   │   │   │   ├── favorites/
│   │   │   │   └── settings/
│   │   │   ├── legal/
│   │   │   │   ├── privacy/
│   │   │   │   ├── terms/
│   │   │   │   ├── offer/
│   │   │   │   └── delivery/
│   │   │   └── layout.tsx      # публичный layout (header, footer)
│   │   ├── (payload)/          # Payload Admin UI (автогенерация)
│   │   │   └── admin/
│   │   │       └── [[...segments]]/
│   │   │           └── page.tsx
│   │   ├── api/                # API routes
│   │   │   ├── payment/
│   │   │   │   ├── create/route.ts
│   │   │   │   └── webhook/route.ts
│   │   │   ├── delivery/
│   │   │   │   └── calculate/route.ts
│   │   │   ├── crm/
│   │   │   │   ├── sync/route.ts
│   │   │   │   └── webhook/route.ts
│   │   │   ├── auth/
│   │   │   │   ├── otp/route.ts
│   │   │   │   └── [...callback]/route.ts
│   │   │   └── revalidate/route.ts
│   │   ├── layout.tsx          # root layout
│   │   ├── not-found.tsx
│   │   └── sitemap.ts          # динамический sitemap
│   ├── payload/                # Payload CMS конфигурация
│   │   ├── collections/
│   │   │   ├── Products.ts
│   │   │   ├── Categories.ts
│   │   │   ├── Orders.ts
│   │   │   ├── Customers.ts
│   │   │   ├── Pages.ts
│   │   │   ├── Posts.ts        # статьи блога
│   │   │   ├── Recipes.ts
│   │   │   ├── Reviews.ts
│   │   │   ├── FAQ.ts
│   │   │   ├── Media.ts
│   │   │   ├── Banners.ts
│   │   │   ├── PromoCodes.ts
│   │   │   └── Admins.ts       # пользователи админки
│   │   ├── globals/
│   │   │   ├── SiteSettings.ts # логотип, контакты, соцсети
│   │   │   ├── Navigation.ts   # меню, footer
│   │   │   ├── SEO.ts          # глобальные мета-теги
│   │   │   └── EmailTemplates.ts
│   │   ├── blocks/             # блоки для блокового редактора
│   │   │   ├── Hero.ts
│   │   │   ├── ProductGrid.ts
│   │   │   ├── TextWithImage.ts
│   │   │   ├── Testimonials.ts
│   │   │   ├── FAQ.ts
│   │   │   ├── CTA.ts
│   │   │   └── Gallery.ts
│   │   ├── hooks/              # Payload hooks (before/after change)
│   │   │   ├── syncOrderToAmo.ts
│   │   │   ├── syncCustomerToAmo.ts
│   │   │   └── revalidateOnChange.ts
│   │   ├── access/             # access control
│   │   │   ├── isAdmin.ts
│   │   │   ├── isCustomer.ts
│   │   │   └── isOwner.ts
│   │   └── payload.config.ts   # главный конфиг Payload
│   ├── components/
│   │   ├── ui/                 # shadcn/ui компоненты
│   │   ├── layout/
│   │   │   ├── Header.tsx
│   │   │   ├── Footer.tsx
│   │   │   ├── MobileMenu.tsx
│   │   │   └── Breadcrumbs.tsx
│   │   ├── catalog/
│   │   │   ├── ProductCard.tsx
│   │   │   ├── ProductGrid.tsx
│   │   │   ├── ProductGallery.tsx
│   │   │   ├── Filters.tsx
│   │   │   └── QuickView.tsx
│   │   ├── cart/
│   │   │   ├── CartDrawer.tsx
│   │   │   ├── CartItem.tsx
│   │   │   └── CartSummary.tsx
│   │   ├── checkout/
│   │   │   ├── CheckoutForm.tsx
│   │   │   ├── DeliverySelect.tsx
│   │   │   └── PaymentSelect.tsx
│   │   ├── account/
│   │   │   ├── OrderHistory.tsx
│   │   │   ├── ProfileForm.tsx
│   │   │   └── FavoritesList.tsx
│   │   ├── blog/
│   │   │   ├── PostCard.tsx
│   │   │   └── PostContent.tsx
│   │   └── shared/
│   │       ├── SEOHead.tsx
│   │       ├── JsonLd.tsx
│   │       ├── Newsletter.tsx
│   │       └── ReviewCard.tsx
│   ├── lib/
│   │   ├── amo/                # amoCRM интеграция
│   │   │   ├── client.ts       # API-клиент
│   │   │   ├── contacts.ts     # CRUD контактов
│   │   │   ├── deals.ts        # CRUD сделок
│   │   │   └── catalog.ts      # синхронизация каталога
│   │   ├── payment/
│   │   │   ├── yokassa.ts      # ЮKassa SDK
│   │   │   └── types.ts
│   │   ├── delivery/
│   │   │   ├── cdek.ts         # CDEK API
│   │   │   └── types.ts
│   │   ├── auth/
│   │   │   ├── otp.ts          # SMS OTP
│   │   │   └── oauth.ts        # Яндекс, VK, Telegram
│   │   ├── email/
│   │   │   └── send.ts
│   │   ├── utils.ts
│   │   └── constants.ts
│   ├── hooks/                  # React hooks
│   │   ├── useCart.ts
│   │   ├── useAuth.ts
│   │   └── useFilters.ts
│   ├── store/                  # Zustand store
│   │   ├── cart.ts
│   │   └── ui.ts
│   └── types/
│       ├── payload-types.ts    # автогенерация из Payload
│       └── index.ts
├── migrations/                 # Drizzle миграции
├── specs/                      # спецификации
├── assets/                     # исходники дизайна
├── Dockerfile
├── docker-compose.yml          # для локальной разработки
├── .env.example
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── package.json
└── README.md
```

---

## Payload CMS — коллекции (Collections)

### Products
```
- title: text (required)
- slug: text (auto from title)
- description: richText
- shortDescription: text
- price: number (required)
- oldPrice: number (зачёркнутая цена)
- sku: text (unique)
- images: array of upload (Media)
- category: relationship → Categories
- variants: array { name, price, sku }
- composition: richText (состав)
- usage: richText (способ применения)
- weight: number (г)
- inStock: boolean (default true)
- featured: boolean (показывать на главной)
- status: select [active, hidden, archived]
- amoCrmId: number (ID в amoCRM, read-only)
- seo: group { title, description, ogImage }
```

### Categories
```
- title: text (required)
- slug: text
- description: text
- icon: upload (Media)
- parent: relationship → Categories (self, для дерева)
- order: number (сортировка)
```

### Orders
```
- orderNumber: text (auto-increment, unique)
- customer: relationship → Customers
- items: array { product → Products, variant, quantity, price }
- subtotal: number
- discount: number
- deliveryCost: number
- total: number
- status: select [new, processing, shipped, delivered, completed, cancelled]
- payment: group { method, transactionId, status, paidAt }
- delivery: group { method, address, trackingNumber, cdekId }
- promoCode: relationship → PromoCodes
- amoCrmDealId: number
- notes: textarea
```

### Customers (auth collection)
```
- email: email (unique, required)
- phone: text
- name: text
- avatar: upload (Media)
- addresses: array { title, city, street, building, apartment, zip }
- defaultAddress: number (index)
- role: select [customer, vip, blocked]
- amoCrmContactId: number
- bonusBalance: number (default 0)
- favorites: relationship → Products (hasMany)
- emailVerified: boolean
- auth: { password, otp, oauth providers }
```

### Pages
```
- title: text
- slug: text
- layout: blocks [Hero, TextWithImage, ProductGrid, Testimonials, FAQ, CTA, Gallery]
- seo: group { title, description, ogImage }
- status: select [draft, published]
```

### Posts (блог)
```
- title: text
- slug: text
- excerpt: text
- content: richText
- coverImage: upload (Media)
- category: relationship → PostCategories
- tags: array of text
- author: text
- publishedAt: date
- status: select [draft, published]
- seo: group { title, description, ogImage }
```

### Recipes
```
- title: text
- slug: text
- description: text
- coverImage: upload (Media)
- difficulty: select [easy, medium, hard]
- prepTime: number (минуты)
- ingredients: array { name, amount, unit }
- steps: array { order, text, image }
- video: text (YouTube URL)
- relatedProducts: relationship → Products (hasMany)
- status: select [draft, published]
```

### Reviews
```
- product: relationship → Products
- customer: relationship → Customers
- rating: number (1-5)
- text: textarea
- approved: boolean (модерация)
```

### FAQ
```
- question: text
- answer: richText
- category: text
- order: number
```

### Media
```
- upload: file (images, video, documents)
- alt: text
- caption: text
- storage: S3 via @payloadcms/storage-s3
- sizes: auto-generated [thumbnail, card, full]
```

### Banners
```
- title: text
- image: upload (Media)
- imageMobile: upload (Media)
- link: text
- position: select [hero, promo, catalog]
- active: boolean
- order: number
```

### PromoCodes
```
- code: text (unique, uppercase)
- discountType: select [percent, fixed]
- discountValue: number
- minOrderAmount: number
- maxUses: number
- usedCount: number (auto)
- validFrom: date
- validTo: date
- active: boolean
```

### Admins
```
- email: email
- password: hashed
- role: select [superadmin, editor, manager]
- name: text
```

---

## Globals (Payload)

### SiteSettings
```
- siteName: text
- logo: upload (Media)
- favicon: upload (Media)
- phone: text
- email: text
- address: text
- socialLinks: array { platform, url }
- requisites: richText
```

### Navigation
```
- mainMenu: array { label, link, children[] }
- footerMenu: array { group, links[] }
```

### SEO
```
- titleTemplate: text ('%s | ЭТРА')
- defaultDescription: text
- defaultOgImage: upload (Media)
- scripts: code (Яндекс.Метрика, GA4)
```

---

## Рендеринг

| Страница | Метод | Revalidate |
|----------|-------|-----------|
| Главная | ISR | 60s |
| Каталог | ISR | 60s |
| Карточка товара | ISR | 120s |
| Блог (список) | ISR | 300s |
| Статья | ISR | 300s |
| Рецепты | ISR | 300s |
| О проекте | ISR | 3600s |
| Контакты | ISR | 3600s |
| Юридические | ISR | 86400s |
| Корзина | CSR | — |
| Checkout | SSR | — |
| ЛК | SSR | — |
| Авторизация | SSR | — |

---

## Аутентификация

Payload CMS 3.x имеет встроенную систему auth. Customers — auth-enabled collection.

```
Стратегии:
1. Email + пароль     → Payload built-in
2. Телефон + OTP      → Custom API route → verify → Payload login
3. Яндекс OAuth       → /api/auth/callback/yandex → Payload login
4. VK ID              → /api/auth/callback/vk → Payload login
5. Telegram Widget    → /api/auth/callback/telegram → Payload login
```

Сессия: HTTP-only cookie (Payload default) + JWT refresh.

---

## Корзина и заказы

```
Корзина:
- Хранится в Zustand store + localStorage (гости)
- При авторизации — мерж с серверной корзиной
- Payload REST API для CRUD

Заказ:
1. Клиент → POST /api/orders (items, address, delivery, promoCode)
2. Сервер → валидация цен, расчёт итога
3. Сервер → создание Payment (ЮKassa)
4. Клиент → редирект на оплату
5. ЮKassa webhook → /api/payment/webhook
6. Сервер → обновление статуса заказа
7. Hook → syncOrderToAmo (создание сделки)
8. Email → подтверждение заказа клиенту
```

---

## amoCRM синхронизация

```
Направление: amoCRM ↔ Site

Каталог (amoCRM → Site):
- Cron job / webhook: синхронизация товаров из каталога amoCRM
- amoCRM = источник истины для цен и наличия
- Payload hook afterChange: revalidate ISR

Контакты (Site → amoCRM):
- При регистрации / заказе → upsert контакт в amoCRM
- Payload afterChange hook на Customers

Сделки (Site → amoCRM):
- При создании заказа → создание сделки в воронке
- Смена статуса заказа ↔ смена этапа сделки
```

---

## Env-переменные

```env
# App
NEXT_PUBLIC_SITE_URL=https://etraproject.ru
PAYLOAD_SECRET=<random-32-chars>

# Database
DATABASE_URI=postgresql://gen_user:Fk5L^s@Yqw^XX;@de5da695d6c895f89bec5d5e.twc1.net:5432/default_db?sslmode=require

# S3 (Timeweb)
S3_ENDPOINT=https://s3.twcstorage.ru
S3_REGION=ru-1
S3_BUCKET=etra-media
S3_ACCESS_KEY=YVD1TNJWTUIX0FU5NU6A
S3_SECRET_KEY=<see secrets/auth.md>

# amoCRM
AMO_BASE_URL=https://<subdomain>.amocrm.ru
AMO_CLIENT_ID=<id>
AMO_CLIENT_SECRET=<secret>
AMO_REDIRECT_URI=<uri>
AMO_ACCESS_TOKEN=<token>
AMO_REFRESH_TOKEN=<token>

# Payment (ЮKassa)
YOKASSA_SHOP_ID=<id>
YOKASSA_SECRET_KEY=<key>
YOKASSA_WEBHOOK_SECRET=<secret>

# CDEK
CDEK_CLIENT_ID=<id>
CDEK_CLIENT_SECRET=<secret>

# Email
SMTP_HOST=smtp.timeweb.cloud
SMTP_PORT=465
SMTP_USER=noreply@etraproject.ru
SMTP_PASS=<pass>

# Auth OAuth
YANDEX_CLIENT_ID=<id>
YANDEX_CLIENT_SECRET=<secret>
VK_CLIENT_ID=<id>
VK_CLIENT_SECRET=<secret>
TELEGRAM_BOT_TOKEN=<token>

# OTP (SMS)
SMS_PROVIDER_API_KEY=<key>
```
