'use client'

import React from 'react'
import Image from 'next/image'

interface Testimonial {
  text: string
  name: string
  role?: string
  avatarUrl?: string | null
  rating?: number
}

interface TestimonialsSectionProps {
  label?: string
  title?: string
  testimonials?: Testimonial[]
}

const defaultTestimonials: Testimonial[] = [
  {
    text: 'Заменила утренний кофе на комбучу ЭТРА. Больше энергии, лучше концентрация, и пищеварение наладилось как никогда.',
    name: 'Анна К.',
    role: 'Велнес-тренер',
    rating: 5,
  },
  {
    text: 'Ягодный фермент — невероятный вкус. Дети тоже в восторге — наконец-то полезный напиток для всей семьи.',
    name: 'Дмитрий П.',
    role: 'Отец троих детей',
    rating: 5,
  },
  {
    text: 'Как нутрициолог, рекомендую ЭТРА всем своим клиентам. Уровень ферментативной активности действительно впечатляет для потребительского продукта.',
    name: 'Елена М.',
    role: 'Клинический нутрициолог',
    rating: 5,
  },
]

function getInitials(name: string): string {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
}

export function TestimonialsSection({
  label = 'Отзывы',
  title = 'Что говорят наши клиенты',
  testimonials,
}: TestimonialsSectionProps) {
  const items = testimonials && testimonials.length > 0 ? testimonials : defaultTestimonials

  return (
    <section className="section section-testimonials" id="reviews">
      <div className="container">
        <div className="section-testimonials__header reveal">
          <div className="section__label">{label}</div>
          <h2 className="section__title">{title}</h2>
        </div>

        <div className="section-testimonials__grid">
          {items.map((t, i) => (
            <div key={i} className={`testimonial-card reveal reveal-delay-${(i % 3) + 1}`}>
              <div className="testimonial-card__stars">{'★'.repeat(t.rating || 5)}</div>
              <p className="testimonial-card__text">&laquo;{t.text}&raquo;</p>
              <div className="testimonial-card__author">
                {t.avatarUrl ? (
                  <Image src={t.avatarUrl} alt={t.name} width={40} height={40} className="testimonial-card__avatar-img" style={{ borderRadius: '50%' }} />
                ) : (
                  <div className="testimonial-card__avatar">{getInitials(t.name)}</div>
                )}
                <div>
                  <div className="testimonial-card__name">{t.name}</div>
                  {t.role && <div className="testimonial-card__role">{t.role}</div>}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
