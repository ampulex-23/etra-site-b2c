'use client'

import React from 'react'
import Link from 'next/link'
import { Hero } from '../../components/Hero'
import { QuickLinks } from '../../components/QuickLinks'
import { GetStarted } from '../../components/GetStarted'

export function AboutScreen() {
  return (
    <div className="pwa-screen pwa-screen--flush">
      {/* ─── HERO ─── */}
      <Hero />

      {/* ─── QUICK LINKS ─── */}
      <QuickLinks />

      {/* ─── GET STARTED ─── */}
      <GetStarted />

      {/* ─── О НАС ─── */}
      <section id="about" className="landing-section">
        <div className="landing-section__label">О компании</div>
        <h2 className="landing-section__title">Мы — ЭТРА</h2>
        <p className="landing-section__desc">
          Производим живые ферментированные напитки из натурального сырья. Наша миссия — сделать пробиотики
          доступными и вкусными. Каждая бутылка — результат научных исследований и бережной ферментации.
        </p>
        <div className="landing-grid">
          <LandingCard
            icon={<><path d="M12 2a7 7 0 017 7c0 5-7 13-7 13S5 14 5 9a7 7 0 017-7z" /><circle cx="12" cy="9" r="2.5" /></>}
            title="Натуральные ингредиенты"
            text="Только органическое сырьё, без консервантов и красителей. Каждая партия проходит лабораторный контроль."
          />
          <LandingCard
            icon={<><path d="M3 3h7l2 7-3 2a16 16 0 006 6l2-3 7 2v7a2 2 0 01-2 2A18 18 0 013 3z" /></>}
            title="Личный подход"
            text="Консультируем каждого клиента. Подбираем программу на основе индивидуальных потребностей организма."
          />
          <LandingCard
            icon={<><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></>}
            title="Контроль качества"
            text="Собственная лаборатория. Все партии проверяются на микробиологическую чистоту и содержание полезных культур."
          />
        </div>
      </section>

      {/* ─── ЭНЗИМЫ ─── */}
      <section id="enzymes" className="landing-section">
        <div className="landing-section__label">Наука</div>
        <h2 className="landing-section__title">Энзимы — двигатели жизни</h2>
        <p className="landing-section__desc">
          Энзимы (ферменты) — это белковые молекулы, которые ускоряют биохимические реакции в организме.
          Без них невозможны пищеварение, обмен веществ, восстановление клеток и детоксикация.
        </p>
        <div className="landing-grid">
          <LandingCard
            icon={<><path d="M22 12h-4l-3 9L9 3l-3 9H2" /></>}
            title="Пищеварительные энзимы"
            text="Расщепляют белки, жиры и углеводы. Улучшают усвоение питательных веществ и снижают нагрузку на ЖКТ."
            color="accent"
          />
          <LandingCard
            icon={<><circle cx="12" cy="12" r="10" /><path d="M8 12l2 2 4-4" /></>}
            title="Метаболические энзимы"
            text="Управляют клеточным обменом, выводят токсины, поддерживают иммунитет и энергетический баланс."
            color="accent"
          />
          <LandingCard
            icon={<><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" /></>}
            title="Ферментация"
            text="Естественный процесс, при котором микроорганизмы обогащают продукт энзимами, витаминами и органическими кислотами."
            color="accent"
          />
        </div>
      </section>

      {/* ─── БАКТЕРИИ ─── */}
      <section id="bacteria" className="landing-section">
        <div className="landing-section__label">Микробиом</div>
        <h2 className="landing-section__title">Бактерии — наши союзники</h2>
        <p className="landing-section__desc">
          В каждой бутылке ЭТРА — миллиарды живых пробиотических культур. Они заселяют кишечник полезной
          микрофлорой, вытесняют патогены и укрепляют иммунную систему.
        </p>
        <div className="landing-grid">
          <LandingCard
            icon={<><circle cx="12" cy="12" r="3" /><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" /></>}
            title="Lactobacillus"
            text="Молочнокислые бактерии. Поддерживают кислотный баланс кишечника и помогают усваивать минералы."
            color="violet"
          />
          <LandingCard
            icon={<><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 000-7.78z" /></>}
            title="Bifidobacterium"
            text="Бифидобактерии — основа здоровой микрофлоры. Синтезируют витамины группы B и защищают стенки кишечника."
            color="violet"
          />
          <LandingCard
            icon={<><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></>}
            title="Bacillus subtilis"
            text="Сенная палочка. Мощный природный иммуномодулятор, подавляет рост патогенных микроорганизмов."
            color="violet"
          />
        </div>
      </section>

      {/* ─── ТЕХНОЛОГИЯ ─── */}
      <section id="technology" className="landing-section">
        <div className="landing-section__label">Производство</div>
        <h2 className="landing-section__title">Технология ферментации</h2>
        <p className="landing-section__desc">
          Используем метод многоступенчатой ферментации при контролируемой температуре.
          Это позволяет сохранить максимум живых культур и ферментов в готовом продукте.
        </p>
        <div className="landing-grid">
          <LandingCard
            icon={<><rect x="2" y="3" width="20" height="14" rx="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" /></>}
            title="1. Подготовка сырья"
            text="Отбираем только экологически чистые ингредиенты. Проводим первичный микробиологический контроль."
          />
          <LandingCard
            icon={<><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" /></>}
            title="2. Ферментация"
            text="Процесс длится от 14 до 30 дней. Температура и влажность контролируются автоматически 24/7."
          />
          <LandingCard
            icon={<><path d="M22 11.08V12a10 10 0 11-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></>}
            title="3. Контроль и розлив"
            text="Каждая партия проходит лабораторный анализ. Бережный розлив сохраняет живые культуры."
          />
        </div>
      </section>

      {/* ─── КАТАЛОГ (ссылка) ─── */}
      <section id="catalog" className="landing-section" style={{ textAlign: 'center' }}>
        <div className="landing-section__label">Продукция</div>
        <h2 className="landing-section__title">Наш каталог</h2>
        <p className="landing-section__desc" style={{ marginInline: 'auto' }}>
          Ферментированные напитки, пробиотические комплексы и натуральные масла.
          Всё для здоровья вашего микробиома.
        </p>
        <Link href="/catalog" className="btn btn--primary btn--lg">Перейти в каталог</Link>
      </section>

      {/* ─── НОВИНКИ ─── */}
      <section id="new" className="landing-section">
        <div className="landing-section__label">Новое</div>
        <h2 className="landing-section__title">Новинки</h2>
        <p className="landing-section__desc">
          Мы постоянно расширяем линейку. Следите за новыми вкусами и форматами — от ферментированных
          смузи до пробиотических концентратов.
        </p>
        <div className="landing-grid">
          <LandingCard
            icon={<><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></>}
            title="ЭТРА Утро"
            text="Утренний ферментированный напиток с энзимами для бодрого старта дня и поддержки пищеварения."
          />
          <LandingCard
            icon={<><circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" /><line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" /><line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" /><line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" /></>}
            title="ЭТРА День"
            text="Дневной комплекс с пробиотиками и бифидобактериями. Поддерживает энергию и ментальную ясность."
          />
          <LandingCard
            icon={<><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" /></>}
            title="ЭТРА Вечер"
            text="Вечерний напиток с успокаивающими травами и сенной палочкой. Для восстановления и глубокого сна."
          />
        </div>
      </section>

      {/* ─── МЕСТА ─── */}
      <section id="places" className="landing-section">
        <div className="landing-section__label">Где купить</div>
        <h2 className="landing-section__title">Точки продаж</h2>
        <p className="landing-section__desc">
          Наши продукты можно купить онлайн с доставкой по всей России или найти в партнёрских магазинах.
        </p>
        <div className="places-grid">
          <PlaceCard name="Интернет-магазин ЭТРА" addr="etraproject.ru — доставка СДЭК по всей России" />
          <PlaceCard name="Маркетплейсы" addr="Wildberries, Ozon — ищите «ЭТРА ферменты»" />
          <PlaceCard name="Эко-магазины Москвы" addr="Сеть партнёрских точек здорового питания" />
          <PlaceCard name="Фермерские рынки" addr="Ежемесячные ярмарки в Москве и Подмосковье" />
        </div>
      </section>

      {/* ─── ОТЗЫВЫ ─── */}
      <section id="reviews" className="landing-section">
        <div className="landing-section__label">Отзывы</div>
        <h2 className="landing-section__title">Что говорят наши клиенты</h2>
        <div className="landing-grid">
          <ReviewCard
            stars={5}
            text="Пью ЭТРА каждое утро уже полгода. Пищеварение наладилось, энергии стало заметно больше. Рекомендую!"
            author="Анна К."
          />
          <ReviewCard
            stars={5}
            text="Наконец-то нашла натуральные пробиотики без химии. Вкус приятный, дети тоже пьют с удовольствием."
            author="Мария С."
          />
          <ReviewCard
            stars={5}
            text="После курса МЕГАГЕНЕЗ похудела на 5 кг и полностью пересмотрела питание. Невероятный результат!"
            author="Елена В."
          />
          <ReviewCard
            stars={4}
            text="Отличные продукты. Доставка быстрая, упаковка аккуратная. Буду заказывать ещё."
            author="Дмитрий П."
          />
        </div>
      </section>

      {/* ─── ЭНЦИКЛОПЕДИЯ ─── */}
      <section id="encyclopedia" className="landing-section">
        <div className="landing-section__label">Знания</div>
        <h2 className="landing-section__title">Энциклопедия ферментации</h2>
        <p className="landing-section__desc">
          Раздел в разработке. Здесь появится база знаний о ферментации, пробиотиках, микробиоме
          и здоровом питании — статьи, исследования и полезные материалы.
        </p>
        <div className="landing-grid">
          <LandingCard
            icon={<><path d="M4 19.5A2.5 2.5 0 016.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" /></>}
            title="Статьи"
            text="Научно-популярные материалы о ферментах, бактериях и их роли в здоровье человека."
          />
          <LandingCard
            icon={<><polygon points="23 7 16 12 23 17 23 7" /><rect x="1" y="5" width="15" height="14" rx="2" /></>}
            title="Видео"
            text="Обучающие ролики от наших экспертов: от основ ферментации до продвинутых протоколов."
          />
          <LandingCard
            icon={<><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 00-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0020 4.77 5.07 5.07 0 0019.91 1S18.73.65 16 2.48a13.38 13.38 0 00-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 005 4.77a5.44 5.44 0 00-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 009 18.13V22" /></>}
            title="Исследования"
            text="Обзоры научных публикаций и клинических испытаний пробиотических штаммов."
          />
        </div>
      </section>

      {/* ─── ПРОИЗВОДСТВО ВМЕСТЕ ─── */}
      <section id="production" className="landing-section">
        <div className="landing-section__label">Сотрудничество</div>
        <h2 className="landing-section__title">Производство вместе</h2>
        <p className="landing-section__desc">
          Мы открыты к партнёрству. Производим ферментированные продукты под вашим брендом
          или разрабатываем уникальные рецептуры на заказ. Контрактное производство с полным
          лабораторным сопровождением.
        </p>
        <div className="landing-grid">
          <LandingCard
            icon={<><rect x="1" y="4" width="22" height="16" rx="2" /><line x1="1" y1="10" x2="23" y2="10" /></>}
            title="White Label"
            text="Выпускаем продукцию под вашей торговой маркой. Полный цикл: рецептура → производство → упаковка."
          />
          <LandingCard
            icon={<><path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z" /></>}
            title="Контрактное производство"
            text="Производственные мощности для малых и средних объёмов. Гибкие условия сотрудничества."
          />
          <LandingCard
            icon={<><path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z" /><path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z" /></>}
            title="Разработка рецептур"
            text="Наши технологи создадут уникальный ферментированный продукт под ваши задачи и целевую аудиторию."
          />
        </div>
      </section>

      {/* ─── КОМАНДА ─── */}
      <section id="team" className="landing-section">
        <div className="landing-section__label">Люди</div>
        <h2 className="landing-section__title">Наша команда</h2>
        <p className="landing-section__desc">
          За каждой бутылкой ЭТРА стоят увлечённые профессионалы — от микробиологов до технологов.
        </p>
        <div className="landing-grid">
          <TeamCard initials="КШ" name="Кирилл" role="Основатель, идеолог проекта" />
          <TeamCard initials="ЕВ" name="Елена" role="Технолог-микробиолог" />
          <TeamCard initials="АМ" name="Алексей" role="Производство и логистика" />
          <TeamCard initials="НК" name="Наталья" role="Нутрициолог, разработка программ" />
          <TeamCard initials="ДС" name="Дарья" role="Маркетинг и клиентский сервис" />
          <TeamCard initials="ИП" name="Игорь" role="Контроль качества, лаборатория" />
        </div>
      </section>

      {/* ─── ПАРТНЁРЫ ─── */}
      <section id="partners" className="landing-section">
        <div className="landing-section__label">Партнёры</div>
        <h2 className="landing-section__title">Нам доверяют</h2>
        <p className="landing-section__desc">
          Работаем с лидерами рынка здорового питания, маркетплейсами и розничными сетями.
        </p>
        <div className="landing-grid">
          <LandingCard
            icon={<><rect x="2" y="7" width="20" height="15" rx="2" /><polyline points="17 2 12 7 7 2" /></>}
            title="Маркетплейсы"
            text="Wildberries, Ozon, Яндекс Маркет — наши продукты доступны на крупнейших площадках."
          />
          <LandingCard
            icon={<><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></>}
            title="Розничные сети"
            text="Эко-магазины, аптеки здорового питания и фермерские лавки по всей России."
          />
          <LandingCard
            icon={<><circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" /></>}
            title="Международное сотрудничество"
            text="Экспортные поставки в страны СНГ. Готовимся к выходу на европейский рынок."
          />
        </div>
      </section>
    </div>
  )
}

/* ── Reusable section components ── */

function LandingCard({ icon, title, text, color }: {
  icon: React.ReactNode; title: string; text: string; color?: 'accent' | 'violet'
}) {
  const strokeColor = color === 'accent' ? 'var(--c-accent)' : color === 'violet' ? 'var(--c-accent-violet)' : 'var(--c-primary)'
  const bgColor = color === 'accent' ? 'rgba(110,198,255,0.1)' : color === 'violet' ? 'rgba(176,154,255,0.1)' : 'rgba(59,236,160,0.1)'
  return (
    <div className="landing-card">
      <div className="landing-card__icon" style={{ background: bgColor }}>
        <svg viewBox="0 0 24 24" style={{ stroke: strokeColor }}>{icon}</svg>
      </div>
      <div className="landing-card__title">{title}</div>
      <div className="landing-card__text">{text}</div>
    </div>
  )
}

function PlaceCard({ name, addr }: { name: string; addr: string }) {
  return (
    <div className="place-card">
      <div className="place-card__icon">
        <svg viewBox="0 0 24 24">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
          <circle cx="12" cy="10" r="3" />
        </svg>
      </div>
      <div>
        <div className="place-card__name">{name}</div>
        <div className="place-card__addr">{addr}</div>
      </div>
    </div>
  )
}

function ReviewCard({ stars, text, author }: { stars: number; text: string; author: string }) {
  return (
    <div className="review-card">
      <div className="review-card__stars">{'★'.repeat(stars)}{'☆'.repeat(5 - stars)}</div>
      <div className="review-card__text">&ldquo;{text}&rdquo;</div>
      <div className="review-card__author">— {author}</div>
    </div>
  )
}

function TeamCard({ initials, name, role }: { initials: string; name: string; role: string }) {
  return (
    <div className="team-card">
      <div className="team-card__avatar">{initials}</div>
      <div className="team-card__name">{name}</div>
      <div className="team-card__role">{role}</div>
    </div>
  )
}
