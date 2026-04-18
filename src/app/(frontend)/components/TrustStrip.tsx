'use client'

import React from 'react'
import { Sprout, Droplet, Truck, Users } from 'lucide-react'

const items = [
  { icon: Sprout, title: 'Живые культуры', text: 'Без пастеризации' },
  { icon: Droplet, title: 'Без сахара', text: 'Натуральная ферментация' },
  { icon: Truck, title: 'Доставка СДЭК', text: 'По всей России' },
  { icon: Users, title: '1000+ клиентов', text: 'Доверяют здоровью' },
]

export function TrustStrip() {
  return (
    <section className="trust-strip" aria-label="Наши преимущества">
      <div className="trust-strip__inner">
        {items.map(({ icon: Icon, title, text }) => (
          <div key={title} className="trust-strip__item">
            <span className="trust-strip__icon">
              <Icon size={22} strokeWidth={1.8} />
            </span>
            <div className="trust-strip__text">
              <div className="trust-strip__title">{title}</div>
              <div className="trust-strip__sub">{text}</div>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
