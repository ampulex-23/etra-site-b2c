'use client'

import React from 'react'
import Image from 'next/image'

const flavors = [
  { id: 1, title: 'Classic Blue', image: '/images/hero-bg.jpg' },
  { id: 2, title: 'Berry Mix', image: '/images/hero-bg.jpg' },
  { id: 3, title: 'Tropical Gold', image: '/images/hero-bg.jpg' },
]

export function SectionFlavors() {
  return (
    <section id="flavors" className="section section-flavors">
      <div className="container">
        <div className="section-flavors__grid">
          <div className="section-flavors__text">
            <h2 className="section__title">
              Discover<br />Our Flavors
            </h2>
            <p className="section__desc">
              Etra Project is an enzyme-based fermented beverage. It combines with somenos, drains,
              coni flavors, haracdanee, and enzyme-based flavors crafted through months of careful fermentation.
            </p>
            <a href="#" className="section__link">
              Learn More
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </a>
          </div>

          <div className="section-flavors__cards">
            {flavors.map((f) => (
              <div key={f.id} className="flavor-card glass-panel neon-border">
                <Image
                  src={f.image}
                  alt={f.title}
                  width={280}
                  height={200}
                  style={{ objectFit: 'cover', borderRadius: 'var(--radius-sm)', width: '100%', height: 'auto' }}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
