'use client'

import React from 'react'

export interface BadgeProps {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'accent' | 'info'
  size?: 'sm' | 'md'
  children: React.ReactNode
  className?: string
}

export function Badge({ variant = 'default', size = 'sm', children, className = '' }: BadgeProps) {
  return (
    <span className={`ui-badge ui-badge--${variant} ui-badge--${size} ${className}`}>
      {children}
    </span>
  )
}
