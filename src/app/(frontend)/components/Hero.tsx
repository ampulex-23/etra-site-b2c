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
        {/* Floating bottle - 3x larger */}
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
              width={840}
              height={1680}
              priority
              className="hero-section__bottle-img"
            />
            {/* Glow effect behind bottle */}
            <div className="hero-section__bottle-glow" />
          </motion.div>
        </motion.div>
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
