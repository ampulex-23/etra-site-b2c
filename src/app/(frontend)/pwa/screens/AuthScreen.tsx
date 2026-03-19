'use client'

import React, { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '../../auth/AuthProvider'

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
  const { customer, login, register, loading: authLoading } = useAuth()

  const [tab, setTab] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

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
        </div>
      </div>
    </div>
  )
}
