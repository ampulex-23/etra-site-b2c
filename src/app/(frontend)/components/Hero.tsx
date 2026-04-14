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

      <div className="hero-section__container">
        <div className="hero-section__content">
        {/* Logo with float animation */}
        <motion.div 
          className="hero-section__logo"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, ease: 'easeOut' }}
        >
          <div className="hero-section__logo-float">
            <Image
              src="https://etraproject.ru/api/media/file/Stiker%20ETRA%20LOGO%20-%20Main%202025%20V2-5.png"
              alt="ЭТРА"
              width={400}
              height={400}
              priority
              className="hero-section__logo-img"
            />
          </div>
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
      </div>
    </section>
  )
}
