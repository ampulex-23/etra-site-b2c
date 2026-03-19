'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react'
import { useField } from '@payloadcms/ui'
import type { TextFieldClientProps } from 'payload'

type Suggestion = {
  value: string
  city: string
  street: string
  house: string
  flat: string
  postalCode: string
  region: string
  lat: string | null
  lon: string | null
}

const AddressAutocomplete: React.FC<TextFieldClientProps> = (props) => {
  const { path, field } = props
  const { value = '', setValue } = useField<string>({ path })
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [showDropdown, setShowDropdown] = useState(false)
  const [loading, setLoading] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)

  const fetchSuggestions = useCallback(async (query: string) => {
    if (!query || query.length < 3) {
      setSuggestions([])
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/address-suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, count: 7 }),
      })
      const data = await res.json()
      setSuggestions(data.suggestions || [])
      setShowDropdown(true)
    } catch {
      setSuggestions([])
    } finally {
      setLoading(false)
    }
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const newValue = e.target.value
    setValue(newValue)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => fetchSuggestions(newValue), 300)
  }

  const handleSelect = (suggestion: Suggestion) => {
    setValue(suggestion.value)
    setSuggestions([])
    setShowDropdown(false)
  }

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [])

  const label = (field as any)?.label || path
  const isTextarea = (field as any)?.type === 'textarea'

  return (
    <div ref={wrapperRef} className="field-type text" style={{ position: 'relative' }}>
      <label className="field-label" htmlFor={`field-${path}`}>
        {typeof label === 'string' ? label : path}
      </label>
      {(field as any)?.admin?.description && (
        <div className="field-description" style={{ marginBottom: 8, fontSize: '0.85em', opacity: 0.7 }}>
          {(field as any).admin.description}
        </div>
      )}
      {isTextarea ? (
        <textarea
          id={`field-${path}`}
          value={value || ''}
          onChange={handleChange}
          onFocus={() => { if (suggestions.length) setShowDropdown(true) }}
          rows={3}
          style={{ width: '100%' }}
        />
      ) : (
        <input
          id={`field-${path}`}
          type="text"
          value={value || ''}
          onChange={handleChange}
          onFocus={() => { if (suggestions.length) setShowDropdown(true) }}
          style={{ width: '100%' }}
        />
      )}
      {loading && (
        <div style={{ position: 'absolute', right: 12, top: 38, fontSize: '0.8em', opacity: 0.5 }}>
          ...
        </div>
      )}
      {showDropdown && suggestions.length > 0 && (
        <ul
          style={{
            position: 'absolute',
            zIndex: 1000,
            background: 'var(--theme-elevation-0, #fff)',
            border: '1px solid var(--theme-elevation-150, #ddd)',
            borderRadius: 4,
            width: '100%',
            maxHeight: 250,
            overflowY: 'auto',
            margin: 0,
            padding: 0,
            listStyle: 'none',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          }}
        >
          {suggestions.map((s, i) => (
            <li
              key={i}
              onClick={() => handleSelect(s)}
              style={{
                padding: '8px 12px',
                cursor: 'pointer',
                borderBottom: '1px solid var(--theme-elevation-100, #eee)',
                fontSize: '0.9em',
              }}
              onMouseEnter={(e) => {
                (e.target as HTMLElement).style.background = 'var(--theme-elevation-50, #f5f5f5)'
              }}
              onMouseLeave={(e) => {
                (e.target as HTMLElement).style.background = 'transparent'
              }}
            >
              {s.value}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default AddressAutocomplete
