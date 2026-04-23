'use client'

import React, { useCallback, useEffect, useState } from 'react'
import { useDocumentInfo } from '@payloadcms/ui'

interface Candidate {
  id: string | number
  orderNumber: string
  status: string
  total: number
  createdAt: string
  itemsCount: number
}

const BTN_BASE: React.CSSProperties = {
  width: '100%',
  padding: '8px 12px',
  background: 'var(--theme-elevation-150, #333)',
  color: 'var(--theme-elevation-1000, #fff)',
  border: 'none',
  borderRadius: 4,
  cursor: 'pointer',
  fontSize: '0.85em',
  fontWeight: 500,
}

const OrderMergeButton: React.FC = () => {
  const { id, initialData } = useDocumentInfo() as any
  const status = initialData?.status
  const mergedInto = initialData?.mergedInto

  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [loading, setLoading] = useState(false)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')
  const [err, setErr] = useState('')
  const [expanded, setExpanded] = useState(false)

  const fetchCandidates = useCallback(async () => {
    if (!id) return
    setLoading(true)
    setErr('')
    try {
      const res = await fetch(`/api/admin/merge-candidates?orderId=${id}`, { credentials: 'include' })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.errors?.[0]?.message || 'Failed to load candidates')
      setCandidates(Array.isArray(data.candidates) ? data.candidates : [])
    } catch (e: any) {
      setErr(e?.message || 'Ошибка загрузки')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    if (expanded) fetchCandidates()
  }, [expanded, fetchCandidates])

  const merge = useCallback(
    async (targetOrderId: string | number) => {
      if (!id) return
      if (!confirm(`Объединить текущий заказ в #${targetOrderId}? Действие необратимо.`)) return
      setBusy(true)
      setErr('')
      setMsg('')
      try {
        const res = await fetch('/api/admin/merge-orders', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sourceOrderId: id, targetOrderId }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data?.errors?.[0]?.message || 'Merge failed')
        setMsg('Заказ объединён. Обновляю страницу...')
        setTimeout(() => window.location.reload(), 800)
      } catch (e: any) {
        setErr(e?.message || 'Ошибка объединения')
      } finally {
        setBusy(false)
      }
    },
    [id],
  )

  if (!id) {
    return (
      <div style={{ padding: '12px 0' }}>
        <p style={{ fontSize: '0.8em', opacity: 0.6, margin: 0 }}>
          Сохраните заказ, чтобы увидеть опции объединения
        </p>
      </div>
    )
  }

  if (status === 'merged') {
    return (
      <div style={{ padding: '12px 0' }}>
        <p style={{ fontSize: '0.8em', opacity: 0.7, margin: 0 }}>
          ⛓️ Заказ уже слит{mergedInto ? ` в #${typeof mergedInto === 'object' ? mergedInto?.orderNumber || mergedInto?.id : mergedInto}` : ''}.
        </p>
      </div>
    )
  }

  if (['shipped', 'delivered', 'completed', 'cancelled'].includes(status)) {
    return null
  }

  return (
    <div style={{ padding: '12px 0' }}>
      <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, fontSize: '0.9em' }}>
        Объединить с другим заказом
      </label>

      {!expanded ? (
        <button type="button" style={BTN_BASE} onClick={() => setExpanded(true)}>
          🔗 Найти заказы клиента для объединения
        </button>
      ) : (
        <div>
          {loading && <p style={{ fontSize: '0.8em', opacity: 0.7 }}>Загружаю...</p>}
          {!loading && candidates.length === 0 && (
            <p style={{ fontSize: '0.8em', opacity: 0.7 }}>
              Нет других открытых заказов у этого клиента.
            </p>
          )}
          {!loading && candidates.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {candidates.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  disabled={busy}
                  onClick={() => merge(c.id)}
                  style={{
                    ...BTN_BASE,
                    textAlign: 'left',
                    background: 'var(--theme-elevation-100, #2a2a2a)',
                  }}
                >
                  <div style={{ fontWeight: 600 }}>→ {c.orderNumber}</div>
                  <div style={{ fontSize: '0.75em', opacity: 0.8, marginTop: 2 }}>
                    {c.status} · {c.itemsCount} поз. · {Math.round(c.total)} ₽ ·{' '}
                    {new Date(c.createdAt).toLocaleDateString('ru-RU')}
                  </div>
                </button>
              ))}
            </div>
          )}
          <button
            type="button"
            onClick={() => setExpanded(false)}
            style={{
              marginTop: 8,
              padding: '6px 10px',
              background: 'transparent',
              color: 'var(--theme-elevation-800, #666)',
              border: '1px solid var(--theme-elevation-150, #ddd)',
              borderRadius: 4,
              cursor: 'pointer',
              fontSize: '0.8em',
            }}
          >
            Скрыть
          </button>
        </div>
      )}

      {msg && <div style={{ color: 'var(--theme-success-500, #22c55e)', fontSize: '0.8em', marginTop: 8 }}>{msg}</div>}
      {err && <div style={{ color: '#e53e3e', fontSize: '0.8em', marginTop: 8 }}>{err}</div>}

      <p style={{ fontSize: '0.72em', opacity: 0.5, margin: '10px 0 0' }}>
        Текущий заказ будет помечен «Слит», его товары и платежи перейдут в выбранный заказ.
      </p>
    </div>
  )
}

export default OrderMergeButton
