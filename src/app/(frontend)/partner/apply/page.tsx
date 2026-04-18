'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function ApplyPage() {
  const [applicationType, setApplicationType] = useState('blogger_barter')
  const [contactName, setContactName] = useState('')
  const [contactEmail, setContactEmail] = useState('')
  const [contactPhone, setContactPhone] = useState('')
  const [contactTelegram, setContactTelegram] = useState('')
  const [socialLink, setSocialLink] = useState('')
  const [avgViews, setAvgViews] = useState('')
  const [audienceTopic, setAudienceTopic] = useState('')
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      const res = await fetch('/api/referral/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          applicationType,
          contactName,
          contactEmail,
          contactPhone,
          contactTelegram,
          socialLinks: socialLink ? [{ url: socialLink }] : [],
          avgViews: avgViews ? Number(avgViews) : undefined,
          audienceTopic,
          message,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Ошибка отправки')
        return
      }
      setSuccess(true)
    } catch (e: any) {
      setError(e.message || 'Ошибка')
    } finally {
      setSubmitting(false)
    }
  }

  if (success) {
    return (
      <div style={pageStyle}>
        <div style={cardStyle}>
          <div style={{ fontSize: 48 }}>✅</div>
          <h1>Заявка принята!</h1>
          <p>Мы свяжемся с вами в ближайшее время.</p>
          <Link href="/" className="btn btn--primary">На главную</Link>
        </div>
      </div>
    )
  }

  return (
    <div style={pageStyle}>
      <div style={cardStyle}>
        <h1 style={{ margin: '0 0 8px' }}>Стать партнёром ЭТРА</h1>
        <p style={{ color: '#6b7280', marginBottom: 24 }}>
          Заполните заявку — мы рассмотрим и свяжемся с вами
        </p>
        {error && <div style={errorStyle}>{error}</div>}
        <form onSubmit={handleSubmit}>
          <Field label="Тип сотрудничества">
            <select className="input" value={applicationType} onChange={(e) => setApplicationType(e.target.value)}>
              <option value="client">Клиент-реферал (без роликов)</option>
              <option value="blogger_barter">Блогер — бартерное сотрудничество</option>
              <option value="blogger_paid">Блогер — с оплатой за ролик</option>
              <option value="mlm_partner">МЛМ-партнёр</option>
            </select>
          </Field>

          <Field label="Имя *">
            <input type="text" className="input" value={contactName} onChange={(e) => setContactName(e.target.value)} required />
          </Field>

          <Field label="Email">
            <input type="email" className="input" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} />
          </Field>

          <Field label="Телефон">
            <input type="tel" className="input" value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} />
          </Field>

          <Field label="Telegram">
            <input type="text" className="input" value={contactTelegram} onChange={(e) => setContactTelegram(e.target.value)} placeholder="@username" />
          </Field>

          {(applicationType === 'blogger_paid' || applicationType === 'blogger_barter') && (
            <>
              <Field label="Ссылка на основную соцсеть *">
                <input type="url" className="input" value={socialLink} onChange={(e) => setSocialLink(e.target.value)} placeholder="https://..." required />
              </Field>
              <Field label="Средние просмотры последних роликов">
                <input type="number" className="input" value={avgViews} onChange={(e) => setAvgViews(e.target.value)} min={0} />
              </Field>
              <Field label="Тематика аудитории">
                <input type="text" className="input" value={audienceTopic} onChange={(e) => setAudienceTopic(e.target.value)} placeholder="ЗОЖ, питание, микробиом..." />
              </Field>
            </>
          )}

          <Field label="Сообщение">
            <textarea className="input" value={message} onChange={(e) => setMessage(e.target.value)} rows={4} placeholder="Расскажите о себе..." />
          </Field>

          <button type="submit" className="btn btn--primary btn--full" disabled={submitting}>
            {submitting ? 'Отправка...' : 'Отправить заявку'}
          </button>
        </form>
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: 'block', marginBottom: 6, fontWeight: 500, fontSize: 14 }}>{label}</label>
      {children}
    </div>
  )
}

const pageStyle: React.CSSProperties = {
  maxWidth: 600,
  margin: '0 auto',
  padding: '40px 16px',
}

const cardStyle: React.CSSProperties = {
  background: 'white',
  padding: 32,
  borderRadius: 12,
  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
}

const errorStyle: React.CSSProperties = {
  padding: 12,
  background: '#fee2e2',
  color: '#991b1b',
  borderRadius: 6,
  marginBottom: 16,
}
