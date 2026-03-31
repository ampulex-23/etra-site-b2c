'use client'

import React, { useState, Suspense, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '../../auth/AuthProvider'

declare global {
  interface Window {
    onTelegramAuth?: (user: any) => void
  }
}

export function AuthScreen() {
  return (
    <Suspense fallback={
      <div className="pwa-screen animate-in">
        <div className="empty">
          <div className="btn__spinner" style={{ width: 32, height: 32, borderColor: 'var(--c-primary)', borderTopColor: 'transparent' }} />
        </div>
      </div>
    }>
      <AuthScreenInner />
    </Suspense>
  )
}

function AuthScreenInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirect = searchParams.get('redirect') || '/account'
  const { customer, login, register, loginWithTelegram, loading: authLoading } = useAuth()

  const [tab, setTab] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [telegramBotUsername, setTelegramBotUsername] = useState<string | null>(null)

  // Load Telegram bot username from settings
  useEffect(() => {
    fetch('/api/shop-settings')
      .then(res => res.json())
      .then(data => {
        if (data.telegramBotUsername) {
          setTelegramBotUsername(data.telegramBotUsername)
        }
      })
      .catch(() => {})
  }, [])

  // Setup Telegram callback - must be set BEFORE widget script loads
  useEffect(() => {
    window.onTelegramAuth = async (user: any) => {
      console.log('[Telegram Auth] Callback triggered with user:', user)
      setLoading(true)
      setError('')
      try {
        const result = await loginWithTelegram(user)
        console.log('[Telegram Auth] Login result:', result)
        if (result.success) {
          console.log('[Telegram Auth] Success, redirecting to:', redirect)
          router.replace(redirect)
        } else {
          console.error('[Telegram Auth] Login failed:', result.error)
          setError(result.error || 'Ошибка авторизации через Telegram')
          setLoading(false)
        }
      } catch (err) {
        console.error('[Telegram Auth] Exception:', err)
        setError('Произошла ошибка при авторизации')
        setLoading(false)
      }
    }
    console.log('[Telegram Auth] Callback function registered')
    return () => {
      delete window.onTelegramAuth
    }
  }, [loginWithTelegram, router, redirect])

  // Load Telegram widget script
  useEffect(() => {
    if (!telegramBotUsername) return

    const container = document.getElementById('telegram-login-container')
    if (!container) return

    // Clear container
    container.innerHTML = ''

    // Create script element
    const script = document.createElement('script')
    script.src = 'https://telegram.org/js/telegram-widget.js?22'
    script.async = true
    script.setAttribute('data-telegram-login', telegramBotUsername)
    script.setAttribute('data-size', 'large')
    script.setAttribute('data-onauth', 'onTelegramAuth(user)')
    script.setAttribute('data-request-access', 'write')

    container.appendChild(script)
  }, [telegramBotUsername])

  if (authLoading) {
    return (
      <div className="pwa-screen animate-in">
        <div className="empty">
          <div className="btn__spinner" style={{ width: 32, height: 32, borderColor: 'var(--c-primary)', borderTopColor: 'transparent' }} />
        </div>
      </div>
    )
  }

  if (customer) {
    router.replace(redirect)
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const result = tab === 'login'
        ? await login(email, password)
        : await register(email, password, name)

      if (result.success) {
        router.replace(redirect)
      } else {
        setError(result.error || 'Произошла ошибка')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="pwa-screen animate-in">
      <div style={{ maxWidth: 400, margin: '20px auto 0' }}>
        <div className="glass auth-card">
          <div className="auth-card__tabs">
            <button
              className={`auth-card__tab ${tab === 'login' ? 'auth-card__tab--active' : ''}`}
              onClick={() => { setTab('login'); setError('') }}
            >
              Вход
            </button>
            <button
              className={`auth-card__tab ${tab === 'register' ? 'auth-card__tab--active' : ''}`}
              onClick={() => { setTab('register'); setError('') }}
            >
              Регистрация
            </button>
          </div>

          {error && <div className="auth-card__error mb-12">{error}</div>}

          <form onSubmit={handleSubmit} className="auth-card__form">
            {tab === 'register' && (
              <div className="inp-wrap">
                <label className="inp-label">Имя</label>
                <input
                  className="inp"
                  type="text"
                  placeholder="Ваше имя"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
            )}

            <div className="inp-wrap">
              <label className="inp-label">Email</label>
              <input
                className="inp"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>

            <div className="inp-wrap">
              <label className="inp-label">Пароль</label>
              <input
                className="inp"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                autoComplete={tab === 'login' ? 'current-password' : 'new-password'}
              />
            </div>

            <button
              type="submit"
              className={`btn btn--primary btn--lg btn--full ${loading ? 'btn--loading' : ''}`}
              disabled={loading}
            >
              {loading && <span className="btn__spinner" />}
              {tab === 'login' ? 'Войти' : 'Зарегистрироваться'}
            </button>
          </form>

          {telegramBotUsername && (
            <>
              <div style={{ 
                margin: '20px 0', 
                textAlign: 'center', 
                color: 'var(--c-text-secondary)',
                fontSize: '14px',
                position: 'relative'
              }}>
                <span style={{ 
                  background: 'var(--c-bg)', 
                  padding: '0 12px',
                  position: 'relative',
                  zIndex: 1
                }}>или</span>
                <div style={{
                  position: 'absolute',
                  top: '50%',
                  left: 0,
                  right: 0,
                  height: '1px',
                  background: 'var(--c-border)',
                  zIndex: 0
                }} />
              </div>

              <div id="telegram-login-container" style={{ textAlign: 'center' }} />
            </>
          )}
        </div>
      </div>
    </div>
  )
}
