'use client'

import React from 'react'
import Image from 'next/image'

interface HeroProps {
  title?: string
  subtitle?: string
  ctaText?: string
  ctaLink?: string
  secondaryCtaText?: string
  secondaryCtaLink?: string
  bgImageUrl?: string | null
}

export function Hero({
  title = 'Ферментированные напитки нового поколения',
  subtitle = 'Живые ферменты и пробиотики в каждой бутылке. Наука, которую можно попробовать на вкус.',
  ctaText = 'Смотреть каталог',
  ctaLink = '#catalog',
  secondaryCtaText = 'Узнать больше',
  secondaryCtaLink = '#science',
  bgImageUrl,
}: HeroProps) {
  return (
    <section className="hero" id="hero">
      <div className="hero__bg">
        <Image
          src={bgImageUrl || '/images/hero-bg.jpg'}
          alt="ЭТРА Project"
          fill
          priority
          quality={90}
          sizes="100vw"
          style={{ objectFit: 'cover', objectPosition: 'center center' }}
        />
        <div className="hero__overlay" />
      </div>

      <div className="hero__content">
        <div className="hero__text">
          <div className="hero__badge">
            <span className="hero__badge-dot" />
            ЭТРА Project
          </div>

          <h1 className="hero__title">
            {title}
          </h1>

          <p className="hero__subtitle">
            {subtitle}
          </p>

          <div className="hero__actions">
            <a href={ctaLink} className="hero__cta">
              <span>{ctaText}</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </a>
            <a href={secondaryCtaLink} className="hero__cta-secondary">
              <span>{secondaryCtaText}</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M7 17l9.2-9.2M17 17V7.8H7.8" />
              </svg>
            </a>
          </div>
        </div>
      </div>

      <div className="hero__scroll-hint">
        <span>Вниз</span>
        <div className="hero__scroll-line" />
      </div>
    </section>
  )
}
