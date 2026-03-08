'use client'

import React from 'react'
import Image from 'next/image'

export function SectionScience() {
  return (
    <section id="science" className="section section-science">
      <div className="container">
        <div className="section-science__grid">
          <div className="section-science__text">
            <h2 className="section__title">Our Science</h2>
            <p className="section__desc">
              Etra Project is an enzyme-based fermented beverage. We combine ancient fermentation
              traditions with modern biotechnology, creating unique probiotic drinks with a rich
              spectrum of beneficial enzymes and microorganisms.
            </p>
            <a href="#" className="section__link">
              Learn More
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </a>
          </div>

          <div className="section-science__media glass-panel neon-border">
            <div className="section-science__image-wrap">
              <Image
                src="/images/hero-bg.jpg"
                alt="Our Science"
                width={400}
                height={260}
                style={{ objectFit: 'cover', borderRadius: 'var(--radius-sm)' }}
              />
            </div>
          </div>

          <div className="section-science__points">
            <ul className="section-science__list">
              <li>Our Science</li>
              <li>Contemporary Conservation and Notifications</li>
              <li>Phlesemed blimkurt Revolution</li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  )
}
