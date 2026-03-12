'use client'

import React from 'react'

interface JoinSectionProps {
  title?: string
  desc?: string
  buttonText?: string
}

export function JoinSection({
  title = 'Готовы почувствовать разницу?',
  desc = 'Подпишитесь на эксклюзивные предложения, новые вкусы и советы по здоровому питанию от наших учёных.',
  buttonText = 'Подписаться',
}: JoinSectionProps) {
  return (
    <section className="section section-join" id="join">
      <div className="container">
        <div className="section-join__glow" />
        <div className="section-join__wrapper reveal">
          <div className="section__label" style={{ justifyContent: 'center' }}>Присоединяйтесь</div>
          <h2 className="section-join__title">{title}</h2>
          <p className="section-join__desc">{desc}</p>
          <form className="section-join__form" onSubmit={(e) => e.preventDefault()}>
            <input
              type="email"
              placeholder="Ваш email"
              className="section-join__input"
              required
            />
            <button type="submit" className="section-join__btn">
              {buttonText}
            </button>
          </form>
        </div>
      </div>
    </section>
  )
}
