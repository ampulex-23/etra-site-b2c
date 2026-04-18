'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '../../auth/AuthProvider'

function JoinContent() {
  const params = useSearchParams()
  const router = useRouter()
  const { customer, token, loading: authLoading } = useAuth()
  const initialCode = (params.get('code') || '').toUpperCase()
  const [code, setCode] = useState(initialCode)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (initialCode) setCode(initialCode)
  }, [initialCode])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      const res = await fetch('/api/referral/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `JWT ${token}` },
        body: JSON.stringify({ invitationCode: code }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Ошибка')
        return
      }
      setSuccess(true)
      setTimeout(() => router.push('/partner'), 2000)
    } catch (e: any) {
      setError(e.message || 'Ошибка')
    } finally {
      setSubmitting(false)
    }
  }

  if (authLoading) return <div style={pageStyle}>Загрузка...</div>

  if (!customer) {
    return (
      <div style={pageStyle}>
        <div style={cardStyle}>
          <h1>Присоединиться к МЛМ ЭТРА</h1>
          <p>Чтобы присоединиться — войдите в аккаунт</p>
          <Link href={`/auth?redirect=/partner/join?code=${code}`} className="btn btn--primary">Войти</Link>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div style={pageStyle}>
        <div style={cardStyle}>
          <div style={{ fontSize: 48 }}>✅</div>
          <h1>Добро пожаловать в команду!</h1>
          <p>Переходим в ваш кабинет партнёра...</p>
        </div>
      </div>
    )
  }

  return (
    <div style={pageStyle}>
      <div style={cardStyle}>
        <h1 style={{ margin: '0 0 8px' }}>Присоединиться к МЛМ ЭТРА</h1>
        <p style={{ color: '#6b7280', marginBottom: 24 }}>
          Введите инвайт-код, полученный от вашего будущего спонсора. После первой покупки
          от 7000₽ или стартового набора ваш статус будет активирован.
        </p>
        {error && <div style={errorStyle}>{error}</div>}
        <form onSubmit={handleSubmit}>
          <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>Инвайт-код</label>
          <input
            type="text"
            className="input"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="ABC12345"
            required
            style={{ fontSize: 18, letterSpacing: 2, fontFamily: 'monospace', marginBottom: 16 }}
          />
          <button type="submit" className="btn btn--primary btn--full" disabled={submitting || !code}>
            {submitting ? 'Присоединяемся...' : 'Присоединиться'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default function JoinPage() {
  return (
    <Suspense fallback={<div style={pageStyle}>Загрузка...</div>}>
      <JoinContent />
    </Suspense>
  )
}

const pageStyle: React.CSSProperties = {
  maxWidth: 500,
  margin: '0 auto',
  padding: '60px 16px',
}

const cardStyle: React.CSSProperties = {
  background: 'white',
  padding: 32,
  borderRadius: 12,
  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  textAlign: 'center' as const,
}

const errorStyle: React.CSSProperties = {
  padding: 12,
  background: '#fee2e2',
  color: '#991b1b',
  borderRadius: 6,
  marginBottom: 16,
}
