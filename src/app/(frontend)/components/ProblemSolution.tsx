'use client'

import React from 'react'
import { Battery, Activity, Shield } from 'lucide-react'

const problems = [
  {
    icon: Battery,
    problem: 'Усталость и тяжесть',
    solution:
      'Живые энзимы ЭТРА ускоряют метаболизм и помогают телу восстанавливать энергию естественным путём.',
  },
  {
    icon: Activity,
    problem: 'Сбитое пищеварение',
    solution:
      'Миллиарды пробиотических культур в каждой бутылке восстанавливают микрофлору и работу ЖКТ.',
  },
  {
    icon: Shield,
    problem: 'Слабый иммунитет',
    solution:
      '80% иммунитета живёт в кишечнике. Ферментированные напитки поддерживают защитные силы организма.',
  },
]

export function ProblemSolution() {
  return (
    <section id="why" className="landing-section problem-solution reveal">
      <div className="landing-section__label">Зачем это тебе</div>
      <h2 className="landing-section__title">Что решает ЭТРА</h2>
      <div className="problem-solution__grid">
        {problems.map(({ icon: Icon, problem, solution }) => (
          <article key={problem} className="ps-card">
            <div className="ps-card__icon">
              <Icon size={26} strokeWidth={1.6} />
            </div>
            <div className="ps-card__problem">{problem}</div>
            <div className="ps-card__arrow" aria-hidden>
              ↓
            </div>
            <p className="ps-card__solution">{solution}</p>
          </article>
        ))}
      </div>
    </section>
  )
}
