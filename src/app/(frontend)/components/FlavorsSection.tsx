'use client'

import React from 'react'
import Image from 'next/image'

interface ProductItem {
  id: string
  title: string
  slug: string
  shortDescription?: string
  price: number
  oldPrice?: number
  imageUrl?: string | null
  featured?: boolean
  inStock?: boolean
}

interface FlavorsProps {
  label?: string
  title?: string
  desc?: string
  products?: ProductItem[]
}

export function FlavorsSection({
  label = 'Наши напитки',
  title = 'Попробуйте революцию вкуса',
  desc = 'Каждый вкус создан с живыми ферментами и натуральными ингредиентами. Без консервантов, без красителей — чистый ферментированный продукт.',
  products = [],
}: FlavorsProps) {
  return (
    <section className="section section-flavors" id="catalog">
      <div className="container">
        <div className="section-flavors__header reveal">
          <div className="section__label">{label}</div>
          <h2 className="section__title">{title}</h2>
          <p className="section__desc">{desc}</p>
        </div>

        {products.length > 0 ? (
          <div className="section-flavors__grid">
            {products.map((p, i) => (
              <a
                key={p.id}
                href={`/products/${p.slug}`}
                className={`flavor-card reveal reveal-delay-${(i % 3) + 1}`}
              >
                <div className="flavor-card__image">
                  {p.imageUrl ? (
                    <Image
                      src={p.imageUrl}
                      alt={p.title}
                      fill
                      sizes="(max-width: 768px) 100vw, 33vw"
                      style={{ objectFit: 'cover' }}
                    />
                  ) : (
                    <div className="flavor-card__image-placeholder">
                      <span>🧪</span>
                    </div>
                  )}
                  <div className="flavor-card__overlay" />
                  <div className="flavor-card__content">
                    {p.featured && <span className="flavor-card__tag">Хит</span>}
                    {!p.inStock && <span className="flavor-card__tag flavor-card__tag--out">Нет в наличии</span>}
                    <h3 className="flavor-card__name">{p.title}</h3>
                    {p.shortDescription && (
                      <p className="flavor-card__desc">{p.shortDescription}</p>
                    )}
                    <div className="flavor-card__price">
                      <span className="flavor-card__price-value">{p.price} ₽</span>
                      {p.oldPrice && (
                        <span className="flavor-card__price-old">{p.oldPrice} ₽</span>
                      )}
                      <button className="flavor-card__price-btn" aria-label="В корзину">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <path d="M12 5v14M5 12h14" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </a>
            ))}
          </div>
        ) : (
          <div className="section-flavors__empty reveal">
            <p style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: '3rem 0' }}>
              Товары скоро появятся. Добавьте их через панель администратора.
            </p>
          </div>
        )}
      </div>
    </section>
  )
}
