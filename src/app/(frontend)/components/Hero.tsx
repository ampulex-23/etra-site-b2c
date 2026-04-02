'use client'

import React from 'react'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { FeatureDrops } from './FeatureDrops'

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

      <div className="hero-section__container">
        <div className="hero-section__content">
        {/* Static bottle - 6x larger, shifted left */}
        <motion.div 
          className="hero-section__bottle"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, ease: 'easeOut' }}
        >
          <div className="hero-section__bottle-float">
            <Image
              src="/images/bottle-hero.png"
              alt="ЭТРА Закваска"
              width={448}
              height={1304}
              priority
              className="hero-section__bottle-img"
            />
            {/* Glow effect behind bottle */}
            <div className="hero-section__bottle-glow" />
          </div>
        </motion.div>
      </div>

        {/* Feature drops — outside content to fix backdrop-filter stacking context */}
        <FeatureDrops />

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
      </div>
    </section>
  )
}
