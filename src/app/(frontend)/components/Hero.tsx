'use client'

import React from 'react'
import Image from 'next/image'
import { motion } from 'framer-motion'

interface HeroProps {
  title?: string
  subtitle?: string
  ctaText?: string
  ctaLink?: string
  secondaryCtaText?: string
  secondaryCtaLink?: string
}

export function Hero({
  title = 'Живые ферменты нового поколения',
  subtitle = 'Пробиотики и энзимы в каждой бутылке. Наука, которую можно попробовать на вкус.',
  ctaText = 'Смотреть каталог',
  ctaLink = '/catalog',
  secondaryCtaText = 'Узнать больше',
  secondaryCtaLink = '#science',
}: HeroProps) {
  return (
    <section className="hero-section" id="hero">
      {/* Background with cosmic spiral */}
      <div className="hero-section__bg">
        <Image
          src="/images/bg-purple.png"
          alt=""
          fill
          priority
          quality={90}
          sizes="100vw"
          style={{ objectFit: 'cover', objectPosition: 'center 30%' }}
        />
        <div className="hero-section__overlay" />
      </div>

      <div className="hero-section__content">
        {/* Floating bottle */}
        <motion.div 
          className="hero-section__bottle"
          initial={{ opacity: 0, y: 40, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 1, ease: 'easeOut' }}
        >
          <motion.div
            animate={{ y: [0, -12, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            className="hero-section__bottle-float"
          >
            <Image
              src="/images/bottle-hero.png"
              alt="ЭТРА Закваска"
              width={280}
              height={560}
              priority
              className="hero-section__bottle-img"
            />
            {/* Glow effect behind bottle */}
            <div className="hero-section__bottle-glow" />
          </motion.div>
        </motion.div>

        {/* Text content */}
        <motion.div 
          className="hero-section__text"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
        >
          <motion.div 
            className="hero-section__badge"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            <span className="hero-section__badge-dot" />
            ЭТРА Project
          </motion.div>

          <h1 className="hero-section__title">
            {title}
          </h1>

          <p className="hero-section__subtitle">
            {subtitle}
          </p>

          <div className="hero-section__actions">
            <motion.a 
              href={ctaLink} 
              className="btn btn--primary btn--lg"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
            >
              <span>{ctaText}</span>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </motion.a>
            <motion.a 
              href={secondaryCtaLink} 
              className="btn btn--outline"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
            >
              <span>{secondaryCtaText}</span>
            </motion.a>
          </div>
        </motion.div>

        {/* Feature cards */}
        <div className="hero-section__features">
          {[
            { icon: '⚡', title: 'Живая энергия', text: 'Активные ферменты' },
            { icon: '🛡️', title: 'Иммунитет', text: 'Пробиотики' },
            { icon: '✨', title: 'Чистота', text: 'Без консервантов' },
          ].map((feature, i) => (
            <motion.div
              key={feature.title}
              className="hero-feature"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.7 + i * 0.1 }}
            >
              <span className="hero-feature__icon">{feature.icon}</span>
              <div>
                <div className="hero-feature__title">{feature.title}</div>
                <div className="hero-feature__text">{feature.text}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Scroll indicator */}
      <motion.div 
        className="hero-section__scroll"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
      >
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 5v14M5 12l7 7 7-7" />
          </svg>
        </motion.div>
      </motion.div>
    </section>
  )
}
