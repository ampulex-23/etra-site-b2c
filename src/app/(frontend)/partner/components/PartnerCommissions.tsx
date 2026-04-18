'use client'

import { useState, useEffect, useCallback } from 'react'

const TYPE_LABELS: Record<string, { label: string; color: string }> = {
  referral_first: { label: 'Рефералка (первая)', color: '#10b981' },
  referral_repeat: { label: 'Рефералка', color: '#0369a1' },
  mlm_level_1: { label: 'МЛМ ур.1', color: '#7c3aed' },
  mlm_level_2: { label: 'МЛМ ур.2', color: '#a855f7' },
  mlm_level_3: { label: 'МЛМ ур.3', color: '#c084fc' },
  team_bonus: { label: 'Командный бонус', color: '#f59e0b' },
  marketing_fund: { label: 'Фонд маркетинга', color: '#ef4444' },
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending: { label: 'Ожидает', color: '#f59e0b' },
  approved: { label: 'Подтверждено', color: '#3b82f6' },
  paid: { label: 'Выплачено', color: '#10b981' },
  cancelled: { label: 'Отменено', color: '#ef4444' },
}

export function PartnerCommissions({ token }: { token: string }) {
  const [commissions, setCommissions] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [statusFilter, setStatusFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20' })
      if (statusFilter) params.set('status', statusFilter)
      if (typeFilter) params.set('type', typeFilter)

      const res = await fetch(`/api/referral/me/commissions?${params}`, {
        headers: { Authorization: `JWT ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setCommissions(data.commissions || [])
        setTotal(data.total || 0)
        setTotalPages(data.totalPages || 1)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [token, page, statusFilter, typeFilter])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return (
    <div>
      {/* Фильтры */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
          className="input"
          style={{ maxWidth: 180 }}
        >
          <option value="">Все статусы</option>
          <option value="pending">Ожидает</option>
          <option value="approved">Подтверждено</option>
          <option value="paid">Выплачено</option>
          <option value="cancelled">Отменено</option>
        </select>
        <select
          value={typeFilter}
          onChange={(e) => { setTypeFilter(e.target.value); setPage(1) }}
          className="input"
          style={{ maxWidth: 200 }}
        >
          <option value="">Все типы</option>
          {Object.entries(TYPE_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v.label}</option>
          ))}
        </select>
      </div>

      {/* Сводка */}
      <div style={{ marginBottom: 12, fontSize: 13, color: '#6b7280' }}>
        Всего записей: <strong>{total}</strong>
      </div>

      {loading ? (
        <div>Загрузка...</div>
      ) : commissions.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 40, color: '#9ca3af' }}>Начислений пока нет</div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f9fafb', textAlign: 'left' }}>
                <th style={th}>Дата</th>
                <th style={th}>Заказ</th>
                <th style={th}>Покупатель</th>
                <th style={th}>Тип</th>
                <th style={th}>%</th>
                <th style={th}>База</th>
                <th style={th}>Сумма</th>
                <th style={th}>Статус</th>
              </tr>
            </thead>
            <tbody>
              {commissions.map((c) => {
                const type = TYPE_LABELS[c.type] || { label: c.type, color: '#6b7280' }
                const status = STATUS_LABELS[c.status] || { label: c.status, color: '#6b7280' }
                return (
                  <tr key={c.id} style={{ borderTop: '1px solid #e5e7eb' }}>
                    <td style={td}>{new Date(c.createdAt).toLocaleDateString('ru-RU')}</td>
                    <td style={td}>{c.orderNumber || '—'}</td>
                    <td style={td}>{c.buyerName || '—'}</td>
                    <td style={td}>
                      <span style={{ padding: '2px 8px', borderRadius: 4, background: type.color, color: 'white', fontSize: 11 }}>
                        {type.label}
                      </span>
                    </td>
                    <td style={td}>{c.percent}%</td>
                    <td style={td}>{Number(c.baseAmount).toLocaleString('ru-RU')} ₽</td>
                    <td style={{ ...td, fontWeight: 600, color: '#059669' }}>
                      +{Number(c.amount).toLocaleString('ru-RU')} ₽
                    </td>
                    <td style={td}>
                      <span style={{ padding: '2px 8px', borderRadius: 4, background: status.color, color: 'white', fontSize: 11 }}>
                        {status.label}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Пагинация */}
      {totalPages > 1 && (
        <div style={{ marginTop: 16, display: 'flex', justifyContent: 'center', gap: 8 }}>
          <button className="btn btn--secondary btn--sm" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
            ← Назад
          </button>
          <span style={{ alignSelf: 'center', fontSize: 13 }}>
            Стр. {page} из {totalPages}
          </span>
          <button className="btn btn--secondary btn--sm" disabled={page === totalPages} onClick={() => setPage((p) => p + 1)}>
            Вперёд →
          </button>
        </div>
      )}
    </div>
  )
}

const th: React.CSSProperties = { padding: 10, fontSize: 12, fontWeight: 600, color: '#374151' }
const td: React.CSSProperties = { padding: 10, fontSize: 13 }
