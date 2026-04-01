'use client'

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react'

export interface CustomerUser {
  id: string
  email: string
  name?: string
  phone?: string
  telegramId?: string
  bonusBalance?: number
  addresses?: Array<{
    id?: string
    title?: string
    city?: string
    street?: string
    apartment?: string
    zip?: string
  }>
  favorites?: Array<{ id: string; title?: string; slug?: string; price?: number; images?: Array<{ url?: string }> } | string>
  telegram?: {
    chatId?: string
    username?: string
    firstName?: string
    lastName?: string
    phone?: string
    photoUrl?: string
  }
  avatar?: { url?: string } | string
}

interface AuthContextValue {
  customer: CustomerUser | null
  token: string | null
  loading: boolean
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  register: (email: string, password: string, name: string) => Promise<{ success: boolean; error?: string }>
  loginWithTelegram: (telegramData: Record<string, unknown>) => Promise<{ success: boolean; error?: string }>
  logout: () => void
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

const TOKEN_KEY = 'etra-customer-token'

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [customer, setCustomer] = useState<CustomerUser | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const saveToken = (t: string | null) => {
    setToken(t)
    if (t) localStorage.setItem(TOKEN_KEY, t)
    else localStorage.removeItem(TOKEN_KEY)
  }

  const fetchMe = useCallback(async (jwt: string) => {
    try {
      const res = await fetch('/api/profile', {
        headers: { Authorization: `JWT ${jwt}` },
      })
      if (!res.ok) throw new Error('unauthorized')
      const data = await res.json()
      setCustomer({
        id: data.id,
        email: data.email,
        name: data.name,
        phone: data.phone,
        telegramId: data.telegram?.chatId,
        bonusBalance: data.bonusBalance,
        addresses: data.addresses,
        favorites: data.favorites,
        telegram: data.telegram,
        avatar: data.avatar,
      })
      return true
    } catch {
      saveToken(null)
      setCustomer(null)
      return false
    }
  }, [])

  useEffect(() => {
    const stored = localStorage.getItem(TOKEN_KEY)
    if (stored) {
      setToken(stored)
      fetchMe(stored).finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [fetchMe])

  const login = useCallback(
    async (email: string, password: string) => {
      try {
        const res = await fetch('/api/customers/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        })
        const data = await res.json()
        if (!res.ok) return { success: false, error: data.errors?.[0]?.message || 'Неверный email или пароль' }
        saveToken(data.token)
        setCustomer({
          id: data.user.id,
          email: data.user.email,
          name: data.user.name,
          phone: data.user.phone,
          telegramId: data.user.telegramId,
        })
        return { success: true }
      } catch {
        return { success: false, error: 'Ошибка сети' }
      }
    },
    [],
  )

  const register = useCallback(
    async (email: string, password: string, name: string) => {
      try {
        const res = await fetch('/api/customers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password, name }),
        })
        const data = await res.json()
        if (!res.ok) return { success: false, error: data.errors?.[0]?.message || 'Ошибка регистрации' }
        // auto-login after registration
        return login(email, password)
      } catch {
        return { success: false, error: 'Ошибка сети' }
      }
    },
    [login],
  )

  const loginWithTelegram = useCallback(
    async (telegramData: Record<string, unknown>) => {
      try {
        console.log('[AuthProvider] loginWithTelegram called with:', telegramData)
        const res = await fetch('/api/auth/telegram', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(telegramData),
        })
        const data = await res.json()
        console.log('[AuthProvider] API response:', { ok: res.ok, status: res.status, data })
        if (!res.ok) return { success: false, error: data.error || 'Ошибка авторизации через Telegram' }
        console.log('[AuthProvider] Saving token and setting customer')
        saveToken(data.token)
        setCustomer(data.user)
        setToken(data.token)
        return { success: true }
      } catch (err) {
        console.error('[AuthProvider] Exception in loginWithTelegram:', err)
        return { success: false, error: 'Ошибка сети' }
      }
    },
    [],
  )

  const logout = useCallback(() => {
    saveToken(null)
    setCustomer(null)
  }, [])

  const refreshUser = useCallback(async () => {
    if (token) await fetchMe(token)
  }, [token, fetchMe])

  return (
    <AuthContext.Provider
      value={{ customer, token, loading, login, register, loginWithTelegram, logout, refreshUser }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
