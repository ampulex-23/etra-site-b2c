'use client'

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { THEMES, DEFAULT_THEME, type ThemeConfig } from './types'

interface ThemeContextValue {
  theme: ThemeConfig
  themeId: string
  setTheme: (id: string) => void
  availableThemes: ThemeConfig[]
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

const STORAGE_KEY = 'etra-theme'

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [themeId, setThemeId] = useState(DEFAULT_THEME)

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved && THEMES[saved]) {
      setThemeId(saved)
    }
  }, [])

  const setTheme = useCallback((id: string) => {
    if (THEMES[id]) {
      setThemeId(id)
      localStorage.setItem(STORAGE_KEY, id)
    }
  }, [])

  const theme = THEMES[themeId] || THEMES[DEFAULT_THEME]

  return (
    <ThemeContext.Provider
      value={{
        theme,
        themeId,
        setTheme,
        availableThemes: Object.values(THEMES),
      }}
    >
      <div className={theme.cssClass}>{children}</div>
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
  return ctx
}
