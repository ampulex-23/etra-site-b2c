'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ThemeProvider } from '../../themes/ThemeProvider'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { useAuth } from '../AuthProvider'

export default function LoginPage() {
  const router = useRouter()
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const result = await login(email, password)
    setLoading(false)
    if (result.success) {
      router.push('/account')
    } else {
      setError(result.error || 'Ошибка авторизации')
    }
  }

  return (
    <ThemeProvider>
      <div className="auth-page">
        <div className="auth-card">
          <div className="auth-card__logo">
            <Link href="/">ЭТРА</Link>
          </div>
          <h1 className="auth-card__title">Вход в аккаунт</h1>
          <p className="auth-card__subtitle">Войдите, чтобы управлять заказами</p>

          {error && <div className="auth-error">{error}</div>}

          <form className="auth-form" onSubmit={handleSubmit}>
            <Input
              label="Email"
              type="email"
              name="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              icon={
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
              }
            />
            <Input
              label="Пароль"
              type="password"
              name="password"
              placeholder="Введите пароль"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              icon={
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0110 0v4" />
                </svg>
              }
            />
            <Button type="submit" variant="primary" size="lg" fullWidth loading={loading}>
              Войти
            </Button>
          </form>

          <div className="auth-divider">или</div>

          <TelegramLoginButton />

          <div className="auth-link">
            Нет аккаунта?{' '}
            <Link href="/auth/register">Зарегистрироваться</Link>
          </div>
        </div>
      </div>
    </ThemeProvider>
  )
}

function TelegramLoginButton() {
  const { loginWithTelegram } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleTelegram = async () => {
    setLoading(true)
    // Telegram Login Widget will call this via callback
    // For now, show a placeholder button
    // Real integration requires the Telegram Login Widget script
    setLoading(false)
    alert('Для входа через Telegram используйте виджет Telegram Login. Настройте бота в админке.')
  }

  return (
    <button className="auth-telegram-btn" onClick={handleTelegram} disabled={loading}>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
        <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
      </svg>
      Войти через Telegram
    </button>
  )
}
