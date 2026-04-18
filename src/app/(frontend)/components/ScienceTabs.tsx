'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { FlaskConical, Microscope, Thermometer } from 'lucide-react'

const tabs = [
  {
    id: 'enzymes',
    label: 'Энзимы',
    icon: FlaskConical,
    title: 'Энзимы — двигатели жизни',
    text: 'Белковые молекулы, которые ускоряют биохимические реакции. Без них невозможны пищеварение, обмен веществ и восстановление клеток.',
    bullets: [
      { title: 'Пищеварительные', text: 'Расщепляют белки, жиры и углеводы, улучшают усвоение питательных веществ.' },
      { title: 'Метаболические', text: 'Управляют клеточным обменом, выводят токсины, поддерживают иммунитет.' },
      { title: 'Ферментация', text: 'Естественный процесс, при котором микроорганизмы обогащают продукт биоактивными соединениями.' },
    ],
  },
  {
    id: 'bacteria',
    label: 'Бактерии',
    icon: Microscope,
    title: 'Бактерии — наши союзники',
    text: 'В каждой бутылке ЭТРА — миллиарды живых пробиотических культур. Они заселяют кишечник полезной микрофлорой и укрепляют иммунитет.',
    bullets: [
      { title: 'Lactobacillus', text: 'Молочнокислые бактерии. Поддерживают баланс микрофлоры и защищают от патогенов.' },
      { title: 'Bifidobacterium', text: 'Основа здоровой микрофлоры. Синтезируют витамины группы B и аминокислоты.' },
      { title: 'Bacillus subtilis', text: 'Сенная палочка. Природный иммуномодулятор, подавляет гнилостную флору.' },
    ],
  },
  {
    id: 'tech',
    label: 'Технология',
    icon: Thermometer,
    title: 'Технология ферментации',
    text: 'Многоступенчатая ферментация при контролируемой температуре сохраняет максимум живых культур и ферментов в готовом продукте.',
    bullets: [
      { title: 'Отбор сырья', text: 'Только сертифицированные органические ингредиенты от проверенных фермеров.' },
      { title: 'Контроль процесса', text: 'Постоянный мониторинг pH, температуры и активности культур в лаборатории.' },
      { title: 'Щадящий розлив', text: 'Без пастеризации — все культуры и ферменты остаются живыми до момента употребления.' },
    ],
  },
]

export function ScienceTabs() {
  const [active, setActive] = useState(tabs[0].id)
  const current = tabs.find((t) => t.id === active) ?? tabs[0]

  return (
    <section id="science" className="landing-section science-tabs reveal">
      <div className="landing-section__label">Наука</div>
      <h2 className="landing-section__title">Как это работает</h2>
      <p className="landing-section__desc">
        Ферментация — древний биотехнологический процесс. Мы возвращаем его в современную жизнь с
        научной точностью.
      </p>

      <div className="science-tabs__tabs" role="tablist">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            role="tab"
            aria-selected={active === id}
            className={`science-tabs__tab ${active === id ? 'science-tabs__tab--active' : ''}`}
            onClick={() => setActive(id)}
          >
            <Icon size={18} strokeWidth={1.8} />
            <span>{label}</span>
          </button>
        ))}
      </div>

      <div className="science-tabs__panel" key={current.id}>
        <h3 className="science-tabs__heading">{current.title}</h3>
        <p className="science-tabs__lead">{current.text}</p>
        <div className="science-tabs__grid">
          {current.bullets.map((b) => (
            <div key={b.title} className="landing-card">
              <div className="landing-card__title">{b.title}</div>
              <div className="landing-card__text">{b.text}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="science-tabs__cta">
        <Link href="/articles" className="btn btn--outline">
          Читать энциклопедию →
        </Link>
      </div>
    </section>
  )
}
