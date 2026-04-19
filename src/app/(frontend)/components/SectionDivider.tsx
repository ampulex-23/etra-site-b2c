import React from 'react'

export function SectionDivider({ flip = false }: { flip?: boolean }) {
  return (
    <div className={`section-divider ${flip ? 'section-divider--flip' : ''}`} aria-hidden>
      <svg viewBox="0 0 1440 80" preserveAspectRatio="none">
        <path
          d="M0,40 C240,80 480,0 720,40 C960,80 1200,0 1440,40 L1440,80 L0,80 Z"
          fill="currentColor"
        />
      </svg>
    </div>
  )
}
