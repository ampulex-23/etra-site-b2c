'use client'

import React from 'react'
import Link from 'next/link'
import { GraduationCap, Mountain } from 'lucide-react'

const programs = [
  {
    icon: GraduationCap,
    kicker: 'Онлайн',
    title: 'Курсы ферментации',
    text: 'Пошаговые программы от основ микробиома до продвинутых протоколов восстановления ЖКТ.',
    stat: '12 курсов',
    href: '/courses',
    cta: 'Смотреть программы',
  },
  {
    icon: Mountain,
    kicker: 'Офлайн',
    title: 'Ретриты и места',
    text: 'Погружение в природу: детокс, практики, сопровождение нутрициологов и технологов ЭТРА.',
    stat: '5 локаций',
    href: '/locations',
    cta: 'Записаться',
  },
]

export function ProgramsBlock() {
  return (
    <section id="courses" className="landing-section programs-block reveal">
      <div className="landing-section__label">Программы</div>
      <h2 className="landing-section__title">Больше чем напиток</h2>
      <p className="landing-section__desc">
        Учим выстраивать здоровье как систему — от онлайн-курсов до выездных ретритов с командой ЭТРА.
      </p>

      <div className="programs-block__grid">
        {programs.map(({ icon: Icon, kicker, title, text, stat, href, cta }) => (
          <Link key={title} href={href} className="program-card">
            <div className="program-card__media" aria-hidden>
              <Icon size={56} strokeWidth={1.3} />
            </div>
            <div className="program-card__body">
              <div className="program-card__kicker">{kicker}</div>
              <h3 className="program-card__title">{title}</h3>
              <p className="program-card__text">{text}</p>
              <div className="program-card__footer">
                <span className="program-card__stat">{stat}</span>
                <span className="program-card__cta">{cta} →</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}
