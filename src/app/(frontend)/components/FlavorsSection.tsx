'use client'

import React from 'react'

const flavors = [
  {
    name: 'Golden Kombucha',
    tag: 'Bestseller',
    desc: 'Classic fermented tea with honey and ginger notes',
    price: '490 ₽',
    emoji: '🍯',
    bg: 'linear-gradient(135deg, rgba(251,191,36,0.08) 0%, rgba(245,158,11,0.12) 100%)',
  },
  {
    name: 'Berry Enzyme',
    tag: 'New',
    desc: 'Wild berries infused with active probiotic cultures',
    price: '520 ₽',
    emoji: '🫐',
    bg: 'linear-gradient(135deg, rgba(129,140,248,0.08) 0%, rgba(192,132,252,0.12) 100%)',
  },
  {
    name: 'Citrus Vitality',
    tag: 'Popular',
    desc: 'Lemon, orange & grapefruit with enzyme complex',
    price: '490 ₽',
    emoji: '🍊',
    bg: 'linear-gradient(135deg, rgba(251,146,60,0.08) 0%, rgba(245,158,11,0.12) 100%)',
  },
]

export function FlavorsSection() {
  return (
    <section className="section section-flavors" id="flavors">
      <div className="container">
        <div className="section-flavors__header reveal">
          <div className="section__label">Discover Our Flavors</div>
          <h2 className="section__title">Taste the Revolution</h2>
          <p className="section__desc">
            Each flavor is carefully crafted with living enzymes and natural ingredients.
            No preservatives, no artificial colors — just pure fermented wellness.
          </p>
        </div>

        <div className="section-flavors__grid">
          {flavors.map((f, i) => (
            <div key={i} className={`flavor-card reveal reveal-delay-${i + 1}`}>
              <div className="flavor-card__image">
                <div className="flavor-card__image-placeholder" style={{ background: f.bg }}>
                  <span>{f.emoji}</span>
                </div>
                <div className="flavor-card__overlay" />
                <div className="flavor-card__content">
                  <span className="flavor-card__tag">{f.tag}</span>
                  <h3 className="flavor-card__name">{f.name}</h3>
                  <p className="flavor-card__desc">{f.desc}</p>
                  <div className="flavor-card__price">
                    <span className="flavor-card__price-value">{f.price}</span>
                    <button className="flavor-card__price-btn" aria-label="Add to cart">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M12 5v14M5 12h14" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
