'use client'

import React, { useState } from 'react'
import { Mail, Check } from 'lucide-react'

export function NewsletterCTA() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return
    // Phase B: wire real endpoint
    setSent(true)
    setEmail('')
  }

  return (
    <section className="newsletter-cta reveal" aria-label="Подписка на рассылку">
      <div className="newsletter-cta__inner">
        <div className="newsletter-cta__text">
          <div className="newsletter-cta__icon" aria-hidden>
            <Mail size={28} strokeWidth={1.6} />
          </div>
          <div>
            <h3 className="newsletter-cta__title">Письма о ферментации</h3>
            <p className="newsletter-cta__sub">
              Раз в неделю — статьи, рецепты и закрытые скидки на новинки.
            </p>
          </div>
        </div>
        {sent ? (
          <div className="newsletter-cta__done">
            <Check size={20} strokeWidth={2.2} /> Готово, проверьте почту.
          </div>
        ) : (
          <form className="newsletter-cta__form" onSubmit={handleSubmit}>
            <input
              type="email"
              required
              placeholder="your@email.ru"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="inp newsletter-cta__input"
              aria-label="Email"
            />
            <button type="submit" className="btn btn--primary newsletter-cta__btn">
              Подписаться
            </button>
          </form>
        )}
      </div>
    </section>
  )
}
