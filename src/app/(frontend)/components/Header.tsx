'use client'

import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'

const navLinks = [
  { href: '#catalog', label: 'Каталог' },
  { href: '#science', label: 'Технология' },
  { href: '#process', label: 'Производство' },
  { href: '#reviews', label: 'Отзывы' },
]

export function Header() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header className={`site-header ${scrolled ? 'site-header--scrolled' : ''}`}>
      <div className="site-header__inner">
        <Link href="/" className="site-header__logo">
          <Image
            src="/images/logo.png"
            alt="ЭТРА"
            width={80}
            height={32}
            priority
          />
        </Link>

        <nav className={`site-header__nav ${menuOpen ? 'site-header__nav--open' : ''}`}>
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="site-header__link"
              onClick={() => setMenuOpen(false)}
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="site-header__actions">
          <button className="site-header__icon-btn" aria-label="Поиск">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
          </button>
          <button className="site-header__icon-btn" aria-label="Корзина">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <path d="M16 10a4 4 0 0 1-8 0" />
            </svg>
            <span className="site-header__cart-badge">0</span>
          </button>
          <a href="#catalog" className="site-header__cta">В магазин</a>
        </div>

        <button
          className={`site-header__burger ${menuOpen ? 'site-header__burger--open' : ''}`}
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Меню"
        >
          <span />
          <span />
          <span />
        </button>
      </div>
    </header>
  )
}
