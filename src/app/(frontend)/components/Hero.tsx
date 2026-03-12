'use client'

import React from 'react'

export function Hero() {
  return (
    <section className="hero" id="hero">
      <div className="hero__glow hero__glow--1" />
      <div className="hero__glow hero__glow--2" />
      <div className="hero__grid-overlay" />

      <div className="hero__content">
        <div className="hero__text">
          <div className="hero__badge">
            <span className="hero__badge-dot" />
            Enzyme-Based Beverages
          </div>

          <h1 className="hero__title">
            The Future of<br />
            <span className="hero__title-accent">Fermented</span><br />
            Wellness
          </h1>

          <p className="hero__subtitle">
            ETRA Project creates next-generation probiotic beverages powered
            by living enzymes. Science meets taste in every bottle.
          </p>

          <div className="hero__actions">
            <a href="#flavors" className="hero__cta">
              <span>Explore Flavors</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </a>
            <a href="#science" className="hero__cta-secondary">
              <span>Our Science</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M7 17l9.2-9.2M17 17V7.8H7.8" />
              </svg>
            </a>
          </div>
        </div>

        <div className="hero__visual">
          <div className="hero__bottle">
            <div className="hero__bottle-glow" />
            <svg className="hero__bottle-svg" width="180" height="440" viewBox="0 0 180 440" fill="none">
              <defs>
                <linearGradient id="bottleGrad" x1="90" y1="0" x2="90" y2="440" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="rgba(56,189,248,0.1)" />
                  <stop offset="40%" stopColor="rgba(56,189,248,0.05)" />
                  <stop offset="100%" stopColor="rgba(129,140,248,0.08)" />
                </linearGradient>
                <linearGradient id="liquidGrad" x1="90" y1="240" x2="90" y2="400" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="rgba(56,189,248,0.3)" />
                  <stop offset="100%" stopColor="rgba(129,140,248,0.5)" />
                </linearGradient>
                <linearGradient id="labelGrad" x1="50" y1="200" x2="130" y2="280" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="rgba(56,189,248,0.15)" />
                  <stop offset="100%" stopColor="rgba(192,132,252,0.1)" />
                </linearGradient>
              </defs>
              <path d="M65 0 H115 V40 C115 40 125 50 125 65 V75 C140 85 150 100 150 120 V380 C150 415 125 435 90 440 C55 435 30 415 30 380 V120 C30 100 40 85 55 75 V65 C55 50 65 40 65 40 Z" fill="url(#bottleGrad)" stroke="rgba(56,189,248,0.2)" strokeWidth="1" />
              <path d="M45 250 Q90 235 135 250 V380 C135 408 118 425 90 430 C62 425 45 408 45 380 Z" fill="url(#liquidGrad)" opacity="0.6" />
              <rect x="50" y="195" width="80" height="90" rx="8" fill="url(#labelGrad)" stroke="rgba(56,189,248,0.15)" strokeWidth="0.5" />
              <text x="90" y="232" textAnchor="middle" fill="rgba(56,189,248,0.8)" fontSize="14" fontWeight="800" fontFamily="Inter, system-ui">ETRA</text>
              <text x="90" y="252" textAnchor="middle" fill="rgba(148,163,184,0.6)" fontSize="8" fontFamily="Inter, system-ui" letterSpacing="0.1em">PROJECT</text>
              <text x="90" y="272" textAnchor="middle" fill="rgba(148,163,184,0.4)" fontSize="7" fontFamily="Inter, system-ui">ENZYME BEVERAGE</text>
              <path d="M62 5 H118 V10 H62 Z" fill="rgba(56,189,248,0.15)" rx="2" />
              <ellipse cx="90" cy="435" rx="50" ry="5" fill="rgba(56,189,248,0.05)" />
            </svg>
          </div>

          <div className="hero__float-card hero__float-card--top">
            <div className="hero__float-icon">🧬</div>
            <div>
              <span className="hero__float-value">12+ Enzymes</span>
              <span>Living cultures</span>
            </div>
          </div>

          <div className="hero__float-card hero__float-card--bottom">
            <div className="hero__float-icon">⚡</div>
            <div>
              <span className="hero__float-value">100% Natural</span>
              <span>No preservatives</span>
            </div>
          </div>
        </div>
      </div>

      <div className="hero__scroll-hint">
        <span>Scroll</span>
        <div className="hero__scroll-line" />
      </div>
    </section>
  )
}
