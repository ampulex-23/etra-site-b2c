'use client'

import React from 'react'

interface Stat {
  number: string
  label: string
}

interface BenefitsSectionProps {
  stats?: Stat[]
}

const defaultStats: Stat[] = [
  { number: '12+', label: 'Активных ферментов' },
  { number: '21', label: 'День ферментации' },
  { number: '100%', label: 'Натуральный состав' },
  { number: '50K+', label: 'Довольных клиентов' },
]

export function BenefitsSection({ stats }: BenefitsSectionProps) {
  const items = stats && stats.length > 0 ? stats : defaultStats

  return (
    <section className="section-benefits">
      <div className="container">
        <div className="section-benefits__grid">
          {items.map((s, i) => (
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
