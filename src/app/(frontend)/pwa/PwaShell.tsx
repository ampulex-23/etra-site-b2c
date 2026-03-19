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

      {/* SVG filters for glassmorphism with displacement maps */}
      <svg className="pwa-filters" xmlns="http://www.w3.org/2000/svg">
        <defs>
          {/* ── Displacement map for rounded-rect cards/containers ── */}
          {/* Generates a soft lens-like distortion shaped as a rounded rectangle */}
          <filter id="glass-card" x="-5%" y="-5%" width="110%" height="110%" colorInterpolationFilters="sRGB">
            {/* Base shape: rounded rect gradient for displacement intensity */}
            <feFlood floodColor="#808080" result="base" />
            {/* Radial lens warp — center pushes outward, edges neutral */}
            <feGaussianBlur in="SourceGraphic" stdDeviation="0.5" result="srcBlur" />
            {/* Noise texture for organic glass imperfections */}
            <feTurbulence type="fractalNoise" baseFrequency="0.03 0.03" numOctaves="3" seed="1" stitchTiles="stitch" result="noise" />
            {/* Fine grain for frosted texture */}
            <feTurbulence type="fractalNoise" baseFrequency="0.4 0.35" numOctaves="2" seed="5" stitchTiles="stitch" result="grain" />
            {/* Combine noise into displacement: large warp + fine grain */}
            <feDisplacementMap in="srcBlur" in2="noise" scale="8" xChannelSelector="R" yChannelSelector="G" result="warped" />
            {/* Subtle grain overlay for frosted look */}
            <feColorMatrix type="saturate" values="0" in="grain" result="grainGray" />
            <feBlend in="warped" in2="grainGray" mode="soft-light" result="frosted" />
            <feComposite in="frosted" in2="SourceGraphic" operator="in" />
          </filter>

          {/* ── Displacement map for pill-shaped buttons ── */}
          {/* Stronger warp for small pill shapes, more pronounced lens effect */}
          <filter id="glass-pill" x="-8%" y="-15%" width="116%" height="130%" colorInterpolationFilters="sRGB">
            <feGaussianBlur in="SourceGraphic" stdDeviation="0.4" result="srcBlur" />
            {/* Low-freq warp for pill lens curvature */}
            <feTurbulence type="fractalNoise" baseFrequency="0.02 0.04" numOctaves="2" seed="3" stitchTiles="stitch" result="pillNoise" />
            {/* Stronger displacement for small elements */}
            <feDisplacementMap in="srcBlur" in2="pillNoise" scale="6" xChannelSelector="R" yChannelSelector="G" result="pillWarp" />
            {/* Frosted grain */}
            <feTurbulence type="fractalNoise" baseFrequency="0.5 0.4" numOctaves="2" seed="7" stitchTiles="stitch" result="pillGrain" />
            <feColorMatrix type="saturate" values="0" in="pillGrain" result="pillGrainGray" />
            <feBlend in="pillWarp" in2="pillGrainGray" mode="soft-light" result="pillFrosted" />
            <feComposite in="pillFrosted" in2="SourceGraphic" operator="in" />
          </filter>

          {/* ── Strong glass for containers (summary, auth card, etc) ── */}
          <filter id="glass-container" x="-3%" y="-3%" width="106%" height="106%" colorInterpolationFilters="sRGB">
            <feGaussianBlur in="SourceGraphic" stdDeviation="0.3" result="cBlur" />
            <feTurbulence type="fractalNoise" baseFrequency="0.025 0.025" numOctaves="4" seed="2" stitchTiles="stitch" result="cNoise" />
            <feDisplacementMap in="cBlur" in2="cNoise" scale="6" xChannelSelector="R" yChannelSelector="G" result="cWarp" />
            <feTurbulence type="fractalNoise" baseFrequency="0.35 0.3" numOctaves="2" seed="9" stitchTiles="stitch" result="cGrain" />
            <feColorMatrix type="saturate" values="0" in="cGrain" result="cGrainG" />
            <feBlend in="cWarp" in2="cGrainG" mode="soft-light" result="cFrost" />
            <feComposite in="cFrost" in2="SourceGraphic" operator="in" />
          </filter>

          {/* ── Noise-only overlay (for topbar/botnav) ── */}
          <filter id="glass-noise" colorInterpolationFilters="sRGB">
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
