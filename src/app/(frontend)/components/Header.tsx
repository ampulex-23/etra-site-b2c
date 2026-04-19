'use client'

import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useCart } from '@/app/(frontend)/cart/CartProvider'
import { useAuth } from '@/app/(frontend)/auth/AuthProvider'

const navLinks = [
  { href: '/catalog', label: 'Каталог' },
  { href: '/#how', label: 'С чего начать' },
  { href: '/#science', label: 'Наука' },
  { href: '/#courses', label: 'Курсы' },
  { href: '/#reviews', label: 'Отзывы' },
  { href: '/#partner', label: 'Партнёрам' },
]

export function Header() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const { totalItems } = useCart()
  const { customer } = useAuth()

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
            <Link
              key={link.href}
              href={link.href}
              className="site-header__link"
              onClick={() => setMenuOpen(false)}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="site-header__actions">
          <Link href={customer ? '/account' : '/auth/login'} className="site-header__icon-btn" aria-label={customer ? 'Аккаунт' : 'Войти'}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </Link>
          <Link href="/cart" className="header-cart-btn" aria-label="Корзина">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <path d="M16 10a4 4 0 0 1-8 0" />
            </svg>
            {totalItems > 0 && (
              <span className="header-cart-badge">{totalItems}</span>
            )}
          </Link>
          <Link href="/catalog" className="site-header__cta">В магазин</Link>
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
