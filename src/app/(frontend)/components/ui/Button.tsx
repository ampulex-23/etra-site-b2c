'use client'

import React from 'react'
import Link from 'next/link'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  href?: string
  loading?: boolean
  icon?: React.ReactNode
  iconRight?: React.ReactNode
  fullWidth?: boolean
}

export function Button({
  variant = 'primary',
  size = 'md',
  href,
  loading,
  icon,
  iconRight,
  fullWidth,
  children,
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  const cls = [
    'ui-btn',
    `ui-btn--${variant}`,
    `ui-btn--${size}`,
    fullWidth && 'ui-btn--full',
    loading && 'ui-btn--loading',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  const content = (
    <>
      {loading && <span className="ui-btn__spinner" />}
      {icon && <span className="ui-btn__icon">{icon}</span>}
      {children && <span className="ui-btn__label">{children}</span>}
      {iconRight && <span className="ui-btn__icon ui-btn__icon--right">{iconRight}</span>}
    </>
  )

  if (href && !disabled) {
    return (
      <Link href={href} className={cls}>
        {content}
      </Link>
    )
  }

  return (
    <button className={cls} disabled={disabled || loading} {...props}>
      {content}
    </button>
  )
}
