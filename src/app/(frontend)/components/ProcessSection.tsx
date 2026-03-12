'use client'

import React from 'react'

const steps = [
  {
    num: '01',
    title: 'Source',
    desc: 'Wild cultures and organic ingredients sourced from trusted farms.',
  },
  {
    num: '02',
    title: 'Ferment',
    desc: '21-day controlled fermentation preserves living enzymes and probiotics.',
  },
  {
    num: '03',
    title: 'Test',
    desc: 'Every batch is lab-verified for enzyme activity, CFU count, and safety.',
  },
  {
    num: '04',
    title: 'Deliver',
    desc: 'Cold-chain logistics ensure live cultures reach you at peak potency.',
  },
]

export function ProcessSection() {
  return (
    <section className="section section-process" id="process">
      <div className="container">
        <div className="section-process__header reveal">
          <div className="section__label">How It Works</div>
          <h2 className="section__title">From Culture to Bottle</h2>
          <p className="section__desc">
            Our four-step process ensures every bottle contains living enzymes at maximum potency.
          </p>
        </div>

        <div className="section-process__steps">
          <div className="section-process__line" />
          {steps.map((s, i) => (
            <div key={i} className={`process-step reveal reveal-delay-${i + 1}`}>
              <div className="process-step__number">{s.num}</div>
              <h3 className="process-step__title">{s.title}</h3>
              <p className="process-step__desc">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
