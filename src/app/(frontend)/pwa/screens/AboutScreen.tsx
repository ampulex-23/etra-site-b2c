'use client'

import React from 'react'
import Link from 'next/link'
import { Hero } from '../../components/Hero'
import { GetStarted } from '../../components/GetStarted'
import { TrustStrip } from '../../components/TrustStrip'
import { FeaturedProducts, type HomeFeaturedProduct } from '../../components/FeaturedProducts'

export type { HomeFeaturedProduct }
import { ProblemSolution } from '../../components/ProblemSolution'
import { ScienceTabs } from '../../components/ScienceTabs'
import { ProgramsBlock } from '../../components/ProgramsBlock'
import { PartnerBlock } from '../../components/PartnerBlock'
import { NewsletterCTA } from '../../components/NewsletterCTA'
import { FinalCTA } from '../../components/FinalCTA'
import { StickyMobileCTA } from '../../components/StickyMobileCTA'
import { useScrollReveal } from '../../components/useScrollReveal'

interface AboutScreenProps {
  featuredProducts?: HomeFeaturedProduct[]
}

export function AboutScreen({ featuredProducts = [] }: AboutScreenProps) {
  useScrollReveal()

  return (
    <div className="pwa-screen pwa-screen--flush home-screen">
      {/* 1. HERO */}
      <Hero />

      {/* 2. TRUST STRIP */}
      <TrustStrip />

      {/* 3. FEATURED PRODUCTS — primary sales block */}
      <FeaturedProducts products={featuredProducts} />

      {/* 4. PROBLEM → SOLUTION */}
      <ProblemSolution />

      {/* 5. HOW IT WORKS — "С чего начать" */}
      <section id="how" className="home-how-wrap reveal">
        <GetStarted />
      </section>

      {/* 6. SCIENCE — tabs (Энзимы / Бактерии / Технология) */}
      <ScienceTabs />

      {/* 7. COURSES & RETREATS */}
      <ProgramsBlock />

      {/* 8. SOCIAL PROOF — reviews + partner logos + counters */}
      <section id="reviews" className="landing-section social-proof reveal">
        <div className="landing-section__label">Отзывы</div>
        <h2 className="landing-section__title">Нам доверяют</h2>

        <div className="social-proof__stats">
          <div className="sp-stat">
            <span className="sp-stat__num">1000+</span>
            <span className="sp-stat__label">клиентов</span>
          </div>
          <div className="sp-stat">
            <span className="sp-stat__num">50+</span>
            <span className="sp-stat__label">городов доставки</span>
          </div>
          <div className="sp-stat">
            <span className="sp-stat__num">4.9</span>
            <span className="sp-stat__label">средний рейтинг</span>
          </div>
        </div>

        <div className="social-proof__reviews">
          {[
            {
              stars: 5,
              text: 'Пью ЭТРА каждое утро уже полгода. Пищеварение наладилось, энергии стало заметно больше. Рекомендую!',
              author: 'Анна М., Москва',
            },
            {
              stars: 5,
              text: 'Вкусно и полезно. Сложно найти натуральные напитки без сахара — ЭТРА именно такой продукт.',
              author: 'Дмитрий К., СПб',
            },
            {
              stars: 5,
              text: 'Прошёл курс «Детокс» — самочувствие кардинально улучшилось. Команда очень внимательная.',
              author: 'Ольга П., Казань',
            },
          ].map((r) => (
            <div key={r.author} className="review-card">
              <div className="review-card__stars">{'★'.repeat(r.stars)}</div>
              <p className="review-card__text">«{r.text}»</p>
              <div className="review-card__author">{r.author}</div>
            </div>
          ))}
        </div>

        <div className="social-proof__brands">
          <span className="sp-brand">Wildberries</span>
          <span className="sp-brand">Ozon</span>
          <span className="sp-brand">Яндекс Маркет</span>
          <span className="sp-brand">СДЭК</span>
        </div>
      </section>

      {/* 9. DELIVERY & PLACES */}
      <section id="places" className="landing-section reveal">
        <div className="landing-section__label">Где купить</div>
        <h2 className="landing-section__title">Доставка и точки продаж</h2>
        <p className="landing-section__desc">
          Онлайн-заказ с доставкой СДЭК по всей России или офлайн — в партнёрских магазинах.
        </p>
        <div className="places-grid">
          <div className="place-card">
            <div className="place-card__icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <circle cx="12" cy="12" r="10" />
                <line x1="2" y1="12" x2="22" y2="12" />
                <path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
              </svg>
            </div>
            <div>
              <div className="place-card__name">Интернет-магазин ЭТРА</div>
              <div className="place-card__addr">Доставка СДЭК по всей России, 2-5 дней</div>
            </div>
          </div>
          <div className="place-card">
            <div className="place-card__icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <rect x="2" y="7" width="20" height="15" rx="2" />
                <polyline points="17 2 12 7 7 2" />
              </svg>
            </div>
            <div>
              <div className="place-card__name">Маркетплейсы</div>
              <div className="place-card__addr">Wildberries, Ozon, Яндекс Маркет — «ЭТРА ферменты»</div>
            </div>
          </div>
          <div className="place-card">
            <div className="place-card__icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
            </div>
            <div>
              <div className="place-card__name">Эко-магазины</div>
              <div className="place-card__addr">Сеть партнёрских точек здорового питания по городам</div>
            </div>
          </div>
        </div>
      </section>

      {/* 10. PARTNER PROGRAM */}
      <PartnerBlock />

      {/* 11. BRAND STORY + TEAM (compact) */}
      <section id="about" className="landing-section brand-story reveal">
        <div className="landing-section__label">О команде</div>
        <h2 className="landing-section__title">Мы — ЭТРА</h2>
        <p className="landing-section__desc">
          Производим живые ферментированные напитки из натурального сырья. Наша миссия — сделать
          пробиотики доступными и вкусными. Каждая бутылка — результат научных исследований и
          бережной ферментации.
        </p>
        <div className="brand-story__team">
          {[
            { i: 'КШ', n: 'Кирилл', r: 'Основатель' },
            { i: 'ЕВ', n: 'Елена', r: 'Микробиолог' },
            { i: 'АМ', n: 'Алексей', r: 'Производство' },
            { i: 'НК', n: 'Наталья', r: 'Нутрициолог' },
            { i: 'ДС', n: 'Дарья', r: 'Маркетинг' },
            { i: 'ИП', n: 'Игорь', r: 'Лаборатория' },
          ].map((t) => (
            <div key={t.i} className="team-chip">
              <div className="team-chip__avatar">{t.i}</div>
              <div className="team-chip__meta">
                <div className="team-chip__name">{t.n}</div>
                <div className="team-chip__role">{t.r}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 12. BLOG TEASER — placeholder */}
      <section id="blog" className="landing-section reveal">
        <div className="landing-section__label">Знания</div>
        <h2 className="landing-section__title">Энциклопедия ферментации</h2>
        <p className="landing-section__desc">
          Статьи, исследования и видео от наших экспертов — разбираем ферментацию, микробиом и
          здоровое питание простым языком.
        </p>
        <div className="landing-grid">
          {[
            { t: 'Что такое живые культуры?', s: 'Разбор основных штаммов пробиотиков и их влияния на здоровье кишечника.' },
            { t: '5 мифов о ферментации', s: 'Пастеризация, кисломолочка, квашение — где правда, а где маркетинг.' },
            { t: 'Микробиом за 10 минут', s: 'Как 3 кг бактерий внутри нас управляют иммунитетом и настроением.' },
          ].map((p) => (
            <article key={p.t} className="landing-card">
              <div className="landing-card__title">{p.t}</div>
              <div className="landing-card__text">{p.s}</div>
            </article>
          ))}
        </div>
        <div className="science-tabs__cta">
          <Link href="/articles" className="btn btn--outline">
            Все статьи →
          </Link>
        </div>
      </section>

      {/* 13. NEWSLETTER */}
      <NewsletterCTA />

      {/* 14. FINAL CTA */}
      <FinalCTA />

      {/* Sticky mobile "Buy" CTA */}
      <StickyMobileCTA />
    </div>
  )
}
