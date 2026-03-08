'use client'

import React from 'react'
import Image from 'next/image'

export function SectionJoin() {
  return (
    <section id="join" className="section section-join">
      <div className="container">
        <div className="section-join__grid">
          <div className="section-join__text">
            <h2 className="section__title">Join the Movement</h2>
            <p className="section__desc">
              Join us for a high-quality blend of enzyme-based beverage and hospitality,
              and opportunity for enzyme-based beverage.
            </p>
            <form className="section-join__form" onSubmit={(e) => e.preventDefault()}>
              <input type="text" placeholder="First name" className="section-join__input glass-panel" />
              <input type="text" placeholder="Last Name" className="section-join__input glass-panel" />
              <input type="email" placeholder="Email" className="section-join__input glass-panel" />
              <button type="submit" className="section-join__btn">Join Now</button>
            </form>
          </div>

          <div className="section-join__media">
            <div className="section-join__image-wrap glass-panel neon-border">
              <Image
                src="/images/hero-bg.jpg"
                alt="Join the Movement"
                width={480}
                height={360}
                style={{ objectFit: 'cover', borderRadius: 'var(--radius-sm)', width: '100%', height: 'auto' }}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
