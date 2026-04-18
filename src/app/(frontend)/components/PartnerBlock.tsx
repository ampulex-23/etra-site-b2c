'use client'

import React from 'react'
import Link from 'next/link'
import { Factory, Share2 } from 'lucide-react'

const cards = [
  {
    icon: Factory,
    kicker: 'Для бизнеса',
    title: 'White Label и контракт',
    text: 'Производим ферментированные продукты под вашим брендом. Полный цикл: рецептура → лаборатория → розлив → упаковка.',
    points: ['Малые и средние объёмы', 'Разработка рецептур', 'Сертификация и документация'],
    href: '/partner',
    cta: 'Оставить заявку',
  },
  {
    icon: Share2,
    kicker: 'Для каждого',
    title: 'Реферальная программа',
    text: 'Приглашайте друзей, делитесь пользой ферментации — и получайте процент с каждой покупки. Многоуровневые вознаграждения.',
    points: ['До 15% комиссии', 'Личный кабинет партнёра', 'Выплаты на карту'],
    href: '/partner/referral',
    cta: 'Стать партнёром',
  },
]

export function PartnerBlock() {
  return (
    <section id="partner" className="landing-section partner-block reveal">
      <div className="landing-section__label">Сотрудничество</div>
      <h2 className="landing-section__title">Расти вместе с ЭТРА</h2>
      <p className="landing-section__desc">
        От контрактного производства до личной реферальной программы — мы строим экосистему,
        в которой выигрывают все.
      </p>

      <div className="partner-block__grid">
        {cards.map(({ icon: Icon, kicker, title, text, points, href, cta }) => (
          <article key={title} className="partner-card">
            <div className="partner-card__icon">
              <Icon size={28} strokeWidth={1.6} />
            </div>
            <div className="partner-card__kicker">{kicker}</div>
            <h3 className="partner-card__title">{title}</h3>
            <p className="partner-card__text">{text}</p>
            <ul className="partner-card__points">
              {points.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
            <Link href={href} className="btn btn--primary btn--sm partner-card__cta">
              {cta}
            </Link>
          </article>
        ))}
      </div>
    </section>
  )
}
