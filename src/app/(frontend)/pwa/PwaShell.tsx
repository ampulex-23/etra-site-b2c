'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useCart } from '../cart/CartProvider'
import { useAuth } from '../auth/AuthProvider'

const menuLinks = [
  { href: '#', label: 'О НАС' },
  { href: '/catalog', label: 'КАТАЛОГ' },
  { href: '/courses', label: 'КУРСЫ' },
  { href: '#', label: 'НОВИНКИ' },
  { href: '#', label: 'МЕСТА' },
  { href: '#', label: 'ЭНЦИКЛОПЕДИЯ' },
  { href: '#', label: 'ПРОИЗВОДСТВО ВМЕСТЕ' },
  { href: '#', label: 'КОМАНДА' },
  { href: '#', label: 'ПАРТНЁРЫ' },
]

export function PwaShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { totalItems } = useCart()
  const { customer } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {})
    }
  }, [])

  // Close menu on route change
  useEffect(() => {
    setMenuOpen(false)
  }, [pathname])

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [menuOpen])

  const isAbout = pathname === '/'
  const isCatalog = pathname === '/catalog' || pathname.startsWith('/products/')
  const isCourses = pathname === '/courses' || pathname.startsWith('/courses/')
  const isRecipes = pathname === '/recipes'
  const isCart = pathname === '/cart' || pathname === '/checkout'

  return (
    <>
      {/* Static background */}

      <div className="pwa-shell">
        {/* Top bar */}
        <header className="topbar">
          <div className="topbar__inner">
            {/* Mobile: account button (left) */}
            <Link href={customer ? '/account' : '/auth/login'} className="topbar__btn topbar__btn--mobile-only" aria-label={customer ? 'Аккаунт' : 'Войти'}>
              <svg viewBox="0 0 24 24">
                <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </Link>

            <Link href="/" aria-label="ЭТРА" className="topbar__logo-link">
              <img src="/images/logo.png" alt="ЭТРА" className="topbar__logo" />
            </Link>

            {/* Desktop: inline nav links */}
            <nav className="topbar__nav">
              {menuLinks.map((link) => (
                <Link key={link.href} href={link.href} className="topbar__nav-link">
                  {link.label}
                </Link>
              ))}
            </nav>

          {/* Desktop: cart + account icons (right) */}
          <div className="topbar__actions">
            <Link href="/cart" className="topbar__btn topbar__btn--desktop-only" aria-label="Корзина">
              <svg viewBox="0 0 24 24">
                <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <path d="M16 10a4 4 0 01-8 0" />
              </svg>
              {totalItems > 0 && <span className="topbar__badge">{totalItems}</span>}
            </Link>
            <Link href={customer ? '/account' : '/auth/login'} className="topbar__btn topbar__btn--desktop-only" aria-label={customer ? 'Аккаунт' : 'Войти'}>
              <svg viewBox="0 0 24 24">
                <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </Link>
          </div>

          {/* Mobile: burger button (right) */}
          <button
            className={`topbar__burger ${menuOpen ? 'topbar__burger--open' : ''}`}
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Меню"
          >
            <span /><span /><span />
          </button>
          </div>
        </header>

        {/* Mobile menu overlay */}
        <div className={`mobile-menu ${menuOpen ? 'mobile-menu--open' : ''}`}>
          <nav className="mobile-menu__nav">
            {menuLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="mobile-menu__link"
                onClick={() => setMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <hr className="divider" />
            <Link href="/cart" className="mobile-menu__link" onClick={() => setMenuOpen(false)}>
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <path d="M16 10a4 4 0 01-8 0" />
              </svg>
              КОРЗИНА
              {totalItems > 0 && <span className="mobile-menu__badge">{totalItems}</span>}
            </Link>
            <Link href={customer ? '/account' : '/auth/login'} className="mobile-menu__link" onClick={() => setMenuOpen(false)}>
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              КАБИНЕТ
            </Link>
          </nav>
        </div>

        {/* Main content */}
        <main className="pwa-main">
          {children}
        </main>

        {/* Bottom navigation — mobile only */}
        <nav className="botnav">
          <Link href="/" className={`botnav__item ${isAbout ? 'botnav__item--active' : ''}`}>
            <svg viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
            <span className="botnav__label">О нас</span>
          </Link>

          <Link href="/catalog" className={`botnav__item ${isCatalog ? 'botnav__item--active' : ''}`}>
            <svg viewBox="0 0 24 24">
              <rect x="3" y="3" width="7" height="7" rx="1" />
              <rect x="14" y="3" width="7" height="7" rx="1" />
              <rect x="3" y="14" width="7" height="7" rx="1" />
              <rect x="14" y="14" width="7" height="7" rx="1" />
            </svg>
            <span className="botnav__label">Каталог</span>
          </Link>

          <Link href="/courses" className={`botnav__item ${isCourses ? 'botnav__item--active' : ''}`}>
            <svg viewBox="0 0 24 24">
              <path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z" />
              <path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z" />
            </svg>
            <span className="botnav__label">Курсы</span>
          </Link>

          <Link href="/cart" className={`botnav__item ${isCart ? 'botnav__item--active' : ''}`}>
            <svg viewBox="0 0 24 24">
              <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <path d="M16 10a4 4 0 01-8 0" />
            </svg>
            {totalItems > 0 && <span className="botnav__badge">{totalItems}</span>}
            <span className="botnav__label">Корзина</span>
          </Link>

          <Link href="/recipes" className={`botnav__item ${isRecipes ? 'botnav__item--active' : ''}`}>
            <svg viewBox="0 0 24 24">
              <path d="M4 19.5A2.5 2.5 0 016.5 17H20" />
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
            </svg>
            <span className="botnav__label">Рецепты</span>
          </Link>
        </nav>
      </div>
    </>
  )
}
