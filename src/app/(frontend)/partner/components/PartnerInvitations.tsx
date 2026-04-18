'use client'

import { useState, useEffect, useCallback } from 'react'
import { Copy, Check, X } from 'lucide-react'

export function PartnerInvitations({ token }: { token: string }) {
  const [invitations, setInvitations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [note, setNote] = useState('')
  const [copiedId, setCopiedId] = useState<string | number | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/referral/me/invitations', {
        headers: { Authorization: `JWT ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setInvitations(data.invitations || [])
      }
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => { fetchData() }, [fetchData])

  const handleCreate = async () => {
    setCreating(true)
    try {
      const res = await fetch('/api/referral/me/invitations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `JWT ${token}` },
        body: JSON.stringify({ note }),
      })
      if (res.ok) {
        setNote('')
        await fetchData()
      } else {
        const err = await res.json()
        alert(err.error || 'Ошибка создания инвайта')
      }
    } finally {
      setCreating(false)
    }
  }

  const handleRevoke = async (id: string | number) => {
    if (!confirm('Отозвать этот инвайт?')) return
    try {
      const res = await fetch(`/api/referral/me/invitations?id=${id}`, {
        method: 'DELETE',
        headers: { Authorization: `JWT ${token}` },
      })
      if (res.ok) {
        await fetchData()
      }
    } catch (e) {
      console.error(e)
    }
  }

  const handleCopy = async (code: string, id: string | number) => {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
    const link = `${baseUrl}/partner/join?code=${code}`
    await navigator.clipboard.writeText(link)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  return (
    <div>
      <h3 style={{ fontSize: 15, marginBottom: 12 }}>Создать новый инвайт</h3>
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        <input
          type="text"
          className="input"
          placeholder="Заметка (для кого, опционально)"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          style={{ flex: 1 }}
        />
        <button className="btn btn--primary" onClick={handleCreate} disabled={creating}>
          {creating ? 'Создаётся...' : 'Выпустить инвайт'}
        </button>
      </div>

      <h3 style={{ fontSize: 15, marginBottom: 12 }}>Мои инвайты</h3>
      {loading ? (
        <div>Загрузка...</div>
      ) : invitations.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 40, color: '#9ca3af' }}>Инвайтов пока нет</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {invitations.map((inv) => {
            const statusColor = inv.status === 'active' ? '#10b981'
              : inv.status === 'used' ? '#6b7280'
              : inv.status === 'expired' ? '#f59e0b'
              : '#ef4444'
            const statusLabel = inv.status === 'active' ? 'Активен'
              : inv.status === 'used' ? `Использован: ${inv.usedBy || '—'}`
              : inv.status === 'expired' ? 'Просрочен'
              : 'Отозван'

            return (
              <div key={inv.id} style={{ padding: 12, background: '#f9fafb', borderRadius: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                <div>
                  <div style={{ fontFamily: 'monospace', fontSize: 16, fontWeight: 700, letterSpacing: 1 }}>
                    {inv.code}
                  </div>
                  <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>
                    <span style={{ padding: '2px 6px', borderRadius: 4, background: statusColor, color: 'white' }}>
                      {statusLabel}
                    </span>
                    {inv.note && <span style={{ marginLeft: 8 }}>• {inv.note}</span>}
                    {inv.expiresAt && inv.status === 'active' && (
                      <span style={{ marginLeft: 8 }}>
                        до {new Date(inv.expiresAt).toLocaleDateString('ru-RU')}
                      </span>
                    )}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  {inv.status === 'active' && (
                    <>
                      <button className="btn btn--sm btn--secondary" onClick={() => handleCopy(inv.code, inv.id)}>
                        {copiedId === inv.id ? <Check size={14} /> : <Copy size={14} />}
                        {copiedId === inv.id ? 'Скопировано' : 'Ссылка'}
                      </button>
                      <button className="btn btn--sm btn--danger-outline" onClick={() => handleRevoke(inv.id)}>
                        <X size={14} /> Отозвать
                      </button>
                    </>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
