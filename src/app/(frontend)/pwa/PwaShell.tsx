'use client'

import React, { useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useCart } from '../cart/CartProvider'

export function PwaShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { totalItems } = useCart()

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {})
    }
  }, [])

  const isAbout = pathname === '/'
  const isCatalog = pathname === '/catalog' || pathname.startsWith('/products/')
  const isRecipes = pathname === '/recipes'
  const isCart = pathname === '/cart' || pathname === '/checkout'
  const isAccount = pathname === '/account' || pathname === '/auth'

  return (
    <>
      {/* Static background */}
      <div className="pwa-bg" />

      {/* SVG filters for glassmorphism */}
      <svg className="pwa-filters">
        <defs>
          <filter id="glass-noise">
            <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" result="noise" />
            <feColorMatrix type="saturate" values="0" in="noise" result="gray" />
            <feBlend in="SourceGraphic" in2="gray" mode="soft-light" result="blended" />
            <feComposite in="blended" in2="SourceGraphic" operator="in" />
          </filter>
        </defs>
      </svg>

      <div className="pwa-shell">
        {/* Top bar */}
        <header className="topbar">
          <Link href="/account" aria-label="Аккаунт">
            <div className="topbar__btn">
              <svg viewBox="0 0 24 24">
                <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </div>
          </Link>

          <Link href="/" aria-label="ЭТРА">
            <img src="/images/logo.png" alt="ЭТРА" className="topbar__logo" />
          </Link>

          <Link href="/cart" aria-label="Корзина">
            <div className="topbar__btn">
              <svg viewBox="0 0 24 24">
                <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <path d="M16 10a4 4 0 01-8 0" />
              </svg>
              {totalItems > 0 && <span className="topbar__badge">{totalItems}</span>}
            </div>
          </Link>
        </header>

        {/* Main content */}
        <main className="pwa-main">
          {children}
        </main>

        {/* Bottom navigation */}
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
