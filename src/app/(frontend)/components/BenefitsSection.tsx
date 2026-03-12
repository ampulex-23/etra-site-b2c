'use client'

import React from 'react'

const stats = [
  { number: '12+', label: 'Active Enzymes' },
  { number: '21', label: 'Days Fermentation' },
  { number: '100%', label: 'Natural Ingredients' },
  { number: '50K+', label: 'Happy Customers' },
]

export function BenefitsSection() {
  return (
    <section className="section-benefits">
      <div className="container">
        <div className="section-benefits__grid">
          {stats.map((s, i) => (
            <div key={i} className={`benefit-stat reveal reveal-delay-${i + 1}`}>
              <div className="benefit-stat__number">{s.number}</div>
              <div className="benefit-stat__label">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
