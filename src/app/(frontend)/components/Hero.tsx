'use client'

import React from 'react'
import Image from 'next/image'

export function Hero() {
  return (
    <section className="hero">
      <div className="hero__bg">
        <Image
          src="/images/hero-bg.jpg"
          alt="ЭТРА Project"
          fill
          priority
          quality={85}
          sizes="100vw"
          style={{ objectFit: 'cover', objectPosition: 'center top' }}
        />
        <div className="hero__overlay" />
      </div>

      <div className="hero__content cyber-slide-up">
        <h1 className="hero__title glow-text">
          Etra Project:<br />
          The Enzyme<br />
          Revolution
        </h1>
        <p className="hero__subtitle">An enzyme-based beverage</p>
        <a href="#shop" className="hero__cta">
          <span>Shop Now</span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </a>
      </div>
    </section>
  )
}
