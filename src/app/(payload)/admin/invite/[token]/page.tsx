'use client'

import React, { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'

export default function AcceptInvitePage() {
  const params = useParams()
  const router = useRouter()
  const token = params.token as string

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [email, setEmail] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password.length < 6) {
      setError('Пароль должен быть не менее 6 символов')
      return
    }

    if (password !== confirmPassword) {
      setError('Пароли не совпадают')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/invite/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      })

      const data = await res.json()

      if (!res.ok || data.error) {
        setError(data.error || 'Ошибка при установке пароля')
        return
      }

      setEmail(data.email || '')
      setSuccess(true)
    } catch {
      setError('Ошибка сети. Попробуйте ещё раз.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div style={containerStyle}>
        <div style={cardStyle}>
          <h1 style={{ margin: '0 0 16px', fontSize: '1.5rem' }}>Пароль установлен</h1>
          <p style={{ margin: '0 0 24px', opacity: 0.8 }}>
            Теперь вы можете войти в админку с email <strong>{email}</strong>
          </p>
          <button
            onClick={() => router.push('/admin')}
            style={buttonStyle}
          >
            Войти в админку
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={containerStyle}>
      <div style={cardStyle}>
        <h1 style={{ margin: '0 0 8px', fontSize: '1.5rem' }}>Добро пожаловать!</h1>
        <p style={{ margin: '0 0 24px', opacity: 0.8 }}>
          Вас пригласили в команду. Придумайте пароль для входа в админку.
        </p>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>Пароль</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Минимум 6 символов"
              style={inputStyle}
              autoFocus
            />
          </div>

          <div style={{ marginBottom: 24 }}>
            <label style={labelStyle}>Подтвердите пароль</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Повторите пароль"
              style={inputStyle}
            />
          </div>

          {error && (
            <div style={{ color: '#e53e3e', marginBottom: 16, fontSize: '0.9em' }}>
              {error}
            </div>
          )}

          <button type="submit" disabled={loading} style={buttonStyle}>
            {loading ? 'Сохраняю...' : 'Установить пароль'}
          </button>
        </form>
      </div>
    </div>
  )
}

const containerStyle: React.CSSProperties = {
  minHeight: '100vh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: '#f5f5f5',
  fontFamily: 'system-ui, -apple-system, sans-serif',
}

const cardStyle: React.CSSProperties = {
  background: '#fff',
  borderRadius: 12,
  padding: '40px 32px',
  maxWidth: 420,
  width: '100%',
  boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  marginBottom: 6,
  fontSize: '0.9em',
  fontWeight: 500,
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  border: '1px solid #ddd',
  borderRadius: 6,
  fontSize: '1em',
  boxSizing: 'border-box',
}

const buttonStyle: React.CSSProperties = {
  width: '100%',
  padding: '12px 16px',
  background: '#1a1a1a',
  color: '#fff',
  border: 'none',
  borderRadius: 6,
  fontSize: '1em',
  fontWeight: 500,
  cursor: 'pointer',
}
