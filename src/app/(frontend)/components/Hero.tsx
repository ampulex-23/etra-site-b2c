'use client'

import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Sparkles, MapPin, Leaf } from 'lucide-react'

const arcLinks = [
  { title: 'НОВИНКИ', href: '/catalog?filter=new', icon: Sparkles, pos: 'left' as const },
  { title: 'МЕСТА', href: '/locations', icon: MapPin, pos: 'center' as const },
  { title: 'КУРСЫ', href: '/retreat', icon: Leaf, pos: 'right' as const },
]

export function Hero() {
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
                width={600}
                height={600}
                priority
                className="hero-section__logo-img"
              />
            </div>
          </motion.div>

          {/* Arc of quick links hugging the logo from below */}
          <motion.nav
            className="hero-arc"
            aria-label="Быстрые ссылки"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4, ease: 'easeOut' }}
          >
            {arcLinks.map(({ title, href, icon: Icon, pos }) => (
              <Link
                key={title}
                href={href}
                className={`hero-arc__item hero-arc__item--${pos}`}
              >
                <span className="hero-arc__bubble">
                  <Icon className="hero-arc__icon" aria-hidden />
                </span>
                <span className="hero-arc__title">{title}</span>
              </Link>
            ))}
          </motion.nav>

          {/* Slogan + primary/secondary CTA */}
          <motion.div
            className="hero-section__pitch"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6, ease: 'easeOut' }}
          >
            <h1 className="hero-section__slogan">
              Живые ферментированные напитки.
              <br />
              <span>Здоровье, которое ты чувствуешь.</span>
            </h1>
            <div className="hero-section__actions">
              <Link href="/catalog" className="btn btn--primary btn--lg">
                Купить напитки
              </Link>
              <Link href="#how" className="btn btn--outline btn--lg">
                С чего начать
              </Link>
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
