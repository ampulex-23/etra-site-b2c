'use client'

import React from 'react'

interface QuantityStepperProps {
  value: number
  onChange: (v: number) => void
  min?: number
  max?: number
  size?: 'sm' | 'md'
}

export function QuantityStepper({ value, onChange, min = 1, max = 99, size = 'md' }: QuantityStepperProps) {
  return (
    <div className={`ui-qty ui-qty--${size}`}>
      <button
        className="ui-qty__btn"
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
        aria-label="Уменьшить"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M5 12h14" />
        </svg>
      </button>
      <span className="ui-qty__value">{value}</span>
      <button
        className="ui-qty__btn"
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        aria-label="Увеличить"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M12 5v14M5 12h14" />
        </svg>
      </button>
    </div>
  )
}
