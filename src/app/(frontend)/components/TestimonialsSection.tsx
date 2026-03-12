'use client'

import React from 'react'

const testimonials = [
  {
    text: 'I replaced my morning coffee with ETRA Golden Kombucha. More energy, better focus, and my digestion has never been better.',
    name: 'Анна К.',
    role: 'Wellness Coach',
    initials: 'АК',
  },
  {
    text: 'The Berry Enzyme flavor is incredible. My kids love it too — finally a healthy drink the whole family enjoys.',
    name: 'Дмитрий П.',
    role: 'Father of 3',
    initials: 'ДП',
  },
  {
    text: 'As a nutritionist, I recommend ETRA to all my clients. The enzyme activity levels are genuinely impressive for a consumer product.',
    name: 'Елена М.',
    role: 'Clinical Nutritionist',
    initials: 'ЕМ',
  },
]

export function TestimonialsSection() {
  return (
    <section className="section section-testimonials" id="reviews">
      <div className="container">
        <div className="section-testimonials__header reveal">
          <div className="section__label">Testimonials</div>
          <h2 className="section__title">What People Say</h2>
        </div>

        <div className="section-testimonials__grid">
          {testimonials.map((t, i) => (
            <div key={i} className={`testimonial-card reveal reveal-delay-${i + 1}`}>
              <div className="testimonial-card__stars">★★★★★</div>
              <p className="testimonial-card__text">&ldquo;{t.text}&rdquo;</p>
              <div className="testimonial-card__author">
                <div className="testimonial-card__avatar">{t.initials}</div>
                <div>
                  <div className="testimonial-card__name">{t.name}</div>
                  <div className="testimonial-card__role">{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
