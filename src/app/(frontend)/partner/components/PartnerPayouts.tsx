'use client'

import { useState, useEffect, useCallback } from 'react'

const METHOD_LABELS: Record<string, string> = {
  bank_card: 'Банковская карта',
  sbp: 'СБП',
  self_employed_service: 'Самозанятый',
  cooperative_payout: 'Кооператив (ЦК)',
  balance_credit: 'На баланс',
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  requested: { label: 'Запрошена', color: '#f59e0b' },
  approved: { label: 'Одобрена', color: '#3b82f6' },
  processing: { label: 'В обработке', color: '#8b5cf6' },
  paid: { label: 'Выплачено', color: '#10b981' },
  rejected: { label: 'Отклонено', color: '#ef4444' },
}

export function PartnerPayouts({
  token,
  partner,
  settings,
  onUpdate,
}: {
  token: string
  partner: any
  settings: any
  onUpdate: () => void
}) {
  const [payouts, setPayouts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [amount, setAmount] = useState('')
  const [method, setMethod] = useState('bank_card')
  const [recipientFullName, setRecipientFullName] = useState('')
  const [cardNumber, setCardNumber] = useState('')
  const [phone, setPhone] = useState('')
  const [bankName, setBankName] = useState('')
  const [inn, setInn] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const allowedMethods: string[] = settings?.payoutMethods || ['bank_card', 'sbp']
  const minAmount = Number(settings?.minPayoutAmount || 500)

  const fetchPayouts = useCallback(async () => {
    try {
      const res = await fetch('/api/referral/me/payout-request', {
        headers: { Authorization: `JWT ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setPayouts(data.payouts || [])
      }
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => { fetchPayouts() }, [fetchPayouts])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      const paymentDetails: any = { recipientFullName }
      if (method === 'bank_card') { paymentDetails.cardNumber = cardNumber; paymentDetails.bankName = bankName }
      if (method === 'sbp') { paymentDetails.phone = phone; paymentDetails.bankName = bankName }
      if (method === 'self_employed_service') { paymentDetails.inn = inn; paymentDetails.phone = phone }

      const res = await fetch('/api/referral/me/payout-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `JWT ${token}` },
        body: JSON.stringify({ amount: Number(amount), method, paymentDetails }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Ошибка создания заявки')
        return
      }
      setShowForm(false)
      setAmount('')
      setRecipientFullName('')
      setCardNumber('')
      setPhone('')
      setBankName('')
      setInn('')
      await Promise.all([fetchPayouts(), onUpdate()])
    } catch (e: any) {
      setError(e.message || 'Ошибка')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div>
      {/* Сводка */}
      <div style={{ padding: 16, background: '#f0fdf4', borderRadius: 12, marginBottom: 20 }}>
        <div style={{ fontSize: 13, color: '#065f46' }}>Доступно к выплате</div>
        <div style={{ fontSize: 32, fontWeight: 700, color: '#10b981' }}>
          {Number(partner.balance || 0).toLocaleString('ru-RU')} ₽
        </div>
        {Number(partner.balance || 0) >= minAmount ? (
          <button className="btn btn--primary" onClick={() => setShowForm(!showForm)} style={{ marginTop: 12 }}>
            {showForm ? 'Закрыть форму' : 'Запросить выплату'}
          </button>
        ) : (
          <div style={{ fontSize: 12, color: '#6b7280', marginTop: 8 }}>
            Минимальная сумма выплаты: {minAmount.toLocaleString('ru-RU')} ₽
          </div>
        )}
      </div>

      {/* Форма */}
      {showForm && (
        <form onSubmit={handleSubmit} style={{ padding: 20, background: '#f9fafb', borderRadius: 12, marginBottom: 20 }}>
          <h3 style={{ fontSize: 15, marginTop: 0, marginBottom: 16 }}>Заявка на выплату</h3>
          {error && <div style={{ padding: 8, background: '#fee2e2', color: '#991b1b', borderRadius: 6, marginBottom: 12, fontSize: 13 }}>{error}</div>}

          <div style={{ marginBottom: 12 }}>
            <label style={labelStyle}>Сумма (₽)</label>
            <input
              type="number"
              className="input"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min={minAmount}
              max={partner.balance}
              required
            />
          </div>

          <div style={{ marginBottom: 12 }}>
            <label style={labelStyle}>Метод выплаты</label>
            <select className="input" value={method} onChange={(e) => setMethod(e.target.value)}>
              {allowedMethods.map((m) => (
                <option key={m} value={m}>{METHOD_LABELS[m] || m}</option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: 12 }}>
            <label style={labelStyle}>ФИО получателя</label>
            <input type="text" className="input" value={recipientFullName} onChange={(e) => setRecipientFullName(e.target.value)} required />
          </div>

          {method === 'bank_card' && (
            <>
              <div style={{ marginBottom: 12 }}>
                <label style={labelStyle}>Номер карты</label>
                <input type="text" className="input" value={cardNumber} onChange={(e) => setCardNumber(e.target.value)} placeholder="1234 5678 1234 5678" required />
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={labelStyle}>Банк</label>
                <input type="text" className="input" value={bankName} onChange={(e) => setBankName(e.target.value)} />
              </div>
            </>
          )}

          {method === 'sbp' && (
            <>
              <div style={{ marginBottom: 12 }}>
                <label style={labelStyle}>Телефон</label>
                <input type="tel" className="input" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+7..." required />
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={labelStyle}>Банк</label>
                <input type="text" className="input" value={bankName} onChange={(e) => setBankName(e.target.value)} />
              </div>
            </>
          )}

          {method === 'self_employed_service' && (
            <>
              <div style={{ marginBottom: 12 }}>
                <label style={labelStyle}>ИНН</label>
                <input type="text" className="input" value={inn} onChange={(e) => setInn(e.target.value)} required />
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={labelStyle}>Телефон</label>
                <input type="tel" className="input" value={phone} onChange={(e) => setPhone(e.target.value)} required />
              </div>
            </>
          )}

          <button type="submit" className="btn btn--primary" disabled={submitting}>
            {submitting ? 'Отправка...' : 'Отправить заявку'}
          </button>
        </form>
      )}

      {/* История */}
      <h3 style={{ fontSize: 15, marginBottom: 12 }}>История выплат</h3>
      {loading ? (
        <div>Загрузка...</div>
      ) : payouts.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 40, color: '#9ca3af' }}>Выплат пока не было</div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f9fafb', textAlign: 'left' }}>
                <th style={th}>Дата</th>
                <th style={th}>Сумма</th>
                <th style={th}>Метод</th>
                <th style={th}>Статус</th>
                <th style={th}>Комментарий</th>
              </tr>
            </thead>
            <tbody>
              {payouts.map((p) => {
                const status = STATUS_LABELS[p.status] || { label: p.status, color: '#6b7280' }
                return (
                  <tr key={p.id} style={{ borderTop: '1px solid #e5e7eb' }}>
                    <td style={td}>{new Date(p.requestedAt).toLocaleDateString('ru-RU')}</td>
                    <td style={{ ...td, fontWeight: 600 }}>{Number(p.amount).toLocaleString('ru-RU')} ₽</td>
                    <td style={td}>{METHOD_LABELS[p.method] || p.method}</td>
                    <td style={td}>
                      <span style={{ padding: '2px 8px', borderRadius: 4, background: status.color, color: 'white', fontSize: 11 }}>
                        {status.label}
                      </span>
                    </td>
                    <td style={td}>{p.rejectReason || '—'}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

const labelStyle: React.CSSProperties = { display: 'block', fontSize: 13, marginBottom: 4, fontWeight: 500 }
const th: React.CSSProperties = { padding: 10, fontSize: 12, fontWeight: 600 }
const td: React.CSSProperties = { padding: 10, fontSize: 13 }
