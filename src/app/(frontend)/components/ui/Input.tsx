'use client'

import React, { forwardRef } from 'react'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
  icon?: React.ReactNode
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, icon, className = '', id, ...props }, ref) => {
    const inputId = id || props.name
    return (
      <div className={`ui-input-wrap ${error ? 'ui-input-wrap--error' : ''} ${className}`}>
        {label && (
          <label htmlFor={inputId} className="ui-input__label">
            {label}
          </label>
        )}
        <div className="ui-input__field-wrap">
          {icon && <span className="ui-input__icon">{icon}</span>}
          <input
            ref={ref}
            id={inputId}
            className={`ui-input ${icon ? 'ui-input--has-icon' : ''}`}
            {...props}
          />
        </div>
        {error && <span className="ui-input__error">{error}</span>}
        {hint && !error && <span className="ui-input__hint">{hint}</span>}
      </div>
    )
  },
)

Input.displayName = 'Input'

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, className = '', id, ...props }, ref) => {
    const inputId = id || props.name
    return (
      <div className={`ui-input-wrap ${error ? 'ui-input-wrap--error' : ''} ${className}`}>
        {label && (
          <label htmlFor={inputId} className="ui-input__label">
            {label}
          </label>
        )}
        <textarea ref={ref} id={inputId} className="ui-input ui-textarea" {...props} />
        {error && <span className="ui-input__error">{error}</span>}
      </div>
    )
  },
)

Textarea.displayName = 'Textarea'

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  options: { value: string; label: string }[]
  placeholder?: string
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, options, placeholder, className = '', id, ...props }, ref) => {
    const inputId = id || props.name
    return (
      <div className={`ui-input-wrap ${error ? 'ui-input-wrap--error' : ''} ${className}`}>
        {label && (
          <label htmlFor={inputId} className="ui-input__label">
            {label}
          </label>
        )}
        <select ref={ref} id={inputId} className="ui-input ui-select" {...props}>
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        {error && <span className="ui-input__error">{error}</span>}
      </div>
    )
  },
)

Select.displayName = 'Select'
