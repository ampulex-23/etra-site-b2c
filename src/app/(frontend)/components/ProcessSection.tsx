'use client'

import React from 'react'

interface ProcessStep {
  title: string
  description: string
}

interface ProcessSectionProps {
  label?: string
  title?: string
  desc?: string
  steps?: ProcessStep[]
}

const defaultSteps: ProcessStep[] = [
  {
    title: 'Отбор',
    description: 'Дикие культуры и органические ингредиенты от проверенных фермерских хозяйств.',
  },
  {
    title: 'Ферментация',
    description: '21-дневная контролируемая ферментация сохраняет живые ферменты и пробиотики.',
  },
  {
    title: 'Контроль',
    description: 'Каждая партия проверяется в лаборатории на активность ферментов, КОЕ и безопасность.',
  },
  {
    title: 'Доставка',
    description: 'Холодовая цепочка логистики гарантирует, что живые культуры попадут к вам на пике активности.',
  },
]

export function ProcessSection({
  label = 'Как это работает',
  title = 'От культуры до бутылки',
  desc = 'Наш четырёхэтапный процесс гарантирует, что каждая бутылка содержит живые ферменты максимальной активности.',
  steps,
}: ProcessSectionProps) {
  const items = steps && steps.length > 0 ? steps : defaultSteps

  return (
    <section className="section section-process" id="process">
      <div className="container">
        <div className="section-process__header reveal">
          <div className="section__label">{label}</div>
          <h2 className="section__title">{title}</h2>
          <p className="section__desc">{desc}</p>
        </div>

        <div className="section-process__steps">
          <div className="section-process__line" />
          {items.map((s, i) => (
            <div key={i} className={`process-step reveal reveal-delay-${i + 1}`}>
              <div className="process-step__number">{String(i + 1).padStart(2, '0')}</div>
              <h3 className="process-step__title">{s.title}</h3>
              <p className="process-step__desc">{s.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
