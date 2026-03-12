'use client'

import React from 'react'
import Image from 'next/image'

interface ScienceFeature {
  icon?: string
  title: string
  description: string
}

interface ScienceSectionProps {
  label?: string
  title?: string
  desc?: string
  features?: ScienceFeature[]
  imageUrl?: string | null
}

const defaultFeatures: ScienceFeature[] = [
  {
    icon: '🧪',
    title: 'Живые ферменты',
    description: 'Наш процесс ферментации сохраняет 12+ активных ферментов, которые поддерживают пищеварение и усвоение питательных веществ.',
  },
  {
    icon: '🌿',
    title: 'Натуральная ферментация',
    description: 'Традиционные техники встречаются с современной наукой. Каждая партия ферментируется 21 день с использованием диких культур и органических ингредиентов.',
  },
  {
    icon: '🔬',
    title: 'Лабораторный контроль',
    description: 'Каждая бутылка проходит тестирование на количество КОЕ, активность ферментов и pH-баланс. Наука, которую можно попробовать.',
  },
]

export function ScienceSection({
  label = 'Наша технология',
  title = 'Сила природы, подтверждённая наукой',
  desc = 'Напитки ЭТРА используют силу живых ферментов через контролируемый процесс ферментации, который максимизирует биодоступность и вкус.',
  features,
  imageUrl,
}: ScienceSectionProps) {
  const items = features && features.length > 0 ? features : defaultFeatures

  return (
    <section className="section section-science" id="science">
      <div className="container">
        <div className="section-science__grid">
          <div className="section-science__visual reveal">
            <div className="section-science__image-wrap">
              {imageUrl ? (
                <Image src={imageUrl} alt={title} fill style={{ objectFit: 'cover', borderRadius: 'var(--radius-lg)' }} />
              ) : (
                <div className="section-science__image-placeholder">
                  <svg width="200" height="200" viewBox="0 0 200 200" fill="none">
                    <circle cx="100" cy="100" r="80" stroke="rgba(56,189,248,0.2)" strokeWidth="1" strokeDasharray="4 4" />
                    <circle cx="100" cy="100" r="50" stroke="rgba(129,140,248,0.15)" strokeWidth="1" />
                    <circle cx="100" cy="100" r="4" fill="rgba(56,189,248,0.6)" />
                    <circle cx="60" cy="80" r="3" fill="rgba(129,140,248,0.5)" />
                    <circle cx="140" cy="75" r="2.5" fill="rgba(192,132,252,0.5)" />
                    <circle cx="80" cy="140" r="2" fill="rgba(56,189,248,0.4)" />
                    <circle cx="130" cy="130" r="3.5" fill="rgba(129,140,248,0.4)" />
                    <path d="M60 80 L100 100 L140 75" stroke="rgba(56,189,248,0.15)" strokeWidth="0.5" />
                    <path d="M80 140 L100 100 L130 130" stroke="rgba(129,140,248,0.1)" strokeWidth="0.5" />
                    <text x="100" y="170" textAnchor="middle" fill="rgba(148,163,184,0.4)" fontSize="10" fontFamily="Inter, system-ui" letterSpacing="0.15em">ФЕРМЕНТЫ</text>
                  </svg>
                </div>
              )}
            </div>
          </div>

          <div>
            <div className="reveal">
              <div className="section__label">{label}</div>
              <h2 className="section__title">{title}</h2>
              <p className="section__desc">{desc}</p>
            </div>

            <div className="section-science__features">
              {items.map((f, i) => (
                <div key={i} className={`science-feature reveal reveal-delay-${i + 1}`}>
                  <div className="science-feature__icon">{f.icon || '🧪'}</div>
                  <div>
                    <div className="science-feature__title">{f.title}</div>
                    <div className="science-feature__desc">{f.description}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
