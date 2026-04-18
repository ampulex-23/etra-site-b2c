'use client'

import React from 'react'
import Link from 'next/link'

export function FinalCTA() {
  return (
    <section className="final-cta reveal" aria-label="Начните с одной бутылки">
      <div className="final-cta__inner">
        <h2 className="final-cta__title">Начни с одной бутылки</h2>
        <p className="final-cta__text">
          Попробуй живую ферментацию — организм почувствует разницу уже через неделю.
        </p>
        <div className="final-cta__actions">
          <Link href="/catalog" className="btn btn--primary btn--lg">
            В каталог
          </Link>
          <Link href="#how" className="btn btn--outline btn--lg">
            С чего начать
          </Link>
        </div>
      </div>
    </section>
  )
}
