'use client'

import React, { useCallback, useEffect, useState } from 'react'
import { useDocumentInfo } from '@payloadcms/ui'

type OrderRow = {
  id: string | number
  orderNumber: string
  total: number
  status: string
  createdAt: string
}

const STATUS_LABELS: Record<string, string> = {
  new: 'Новый',
  processing: 'В обработке',
  shipped: 'Отправлен',
  delivered: 'Доставлен',
  completed: 'Завершён',
  cancelled: 'Отменён',
  merged: 'Слит',
}

const STATUS_COLORS: Record<string, string> = {
  new: '#3b82f6',
  processing: '#f59e0b',
  shipped: '#8b5cf6',
  delivered: '#06b6d4',
  completed: '#22c55e',
  cancelled: '#94a3b8',
  merged: '#64748b',
}

const formatDate = (iso: string) => {
  try {
    return new Date(iso).toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
    })
  } catch {
    return iso
  }
}

const formatSum = (n: number) => `${Math.round(n).toLocaleString('ru-RU')} ₽`

/**
 * Right-sidebar panel on the Customer edit page: shows the running total
 * of this customer's orders and a scrollable, clickable list of each
 * individual order. Fetches data on mount via the REST API — we scope
 * by `where[customer][equals]=<id>` and pull up to 200 most recent.
 */
const CustomerOrdersPanel: React.FC = () => {
  const { id } = useDocumentInfo()
  const [orders, setOrders] = useState<OrderRow[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchOrders = useCallback(async () => {
    if (!id) return
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({
        'where[customer][equals]': String(id),
        limit: '200',
        sort: '-createdAt',
        depth: '0',
      })
      const res = await fetch(`/api/orders?${params.toString()}`, {
        credentials: 'include',
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.errors?.[0]?.message || 'Failed to load orders')
      const rows: OrderRow[] = Array.isArray(data?.docs)
        ? data.docs.map((d: any) => ({
            id: d.id,
            orderNumber: d.orderNumber,
            total: Number(d.total || 0),
            status: d.status || 'new',
            createdAt: d.createdAt || d.updatedAt || '',
          }))
        : []
      setOrders(rows)
    } catch (e: any) {
      setError(e?.message || 'Ошибка загрузки')
      setOrders([])
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    fetchOrders()
  }, [fetchOrders])

  if (!id) {
    return (
      <div style={{ padding: '12px 0' }}>
        <p style={{ fontSize: '0.8em', opacity: 0.6, margin: 0 }}>
          Сохраните клиента, чтобы увидеть его заказы.
        </p>
      </div>
    )
  }

  const listHref = `/admin/collections/orders?where[customer][equals]=${encodeURIComponent(
    String(id),
  )}`

  const totalSum = (orders ?? []).reduce((acc, o) => acc + o.total, 0)
  const count = orders?.length ?? 0

  return (
    <div style={{ padding: '12px 0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
        <label style={{ fontWeight: 600, fontSize: '0.9em' }}>Заказы клиента</label>
        <a
          href={listHref}
          style={{ fontSize: '0.75em', opacity: 0.7, textDecoration: 'underline' }}
          title="Открыть список всех заказов клиента"
        >
          Все →
        </a>
      </div>

      {/* Summary block */}
      <div
        style={{
          padding: '10px 12px',
          background: 'var(--theme-elevation-50, #f8f8f8)',
          border: '1px solid var(--theme-elevation-100, #eee)',
          borderRadius: 6,
          marginBottom: 10,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <div>
          <div style={{ fontSize: '0.7em', opacity: 0.6, textTransform: 'uppercase' }}>Заказов</div>
          <div style={{ fontSize: '1.1em', fontWeight: 600 }}>
            {loading ? '…' : count.toLocaleString('ru-RU')}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '0.7em', opacity: 0.6, textTransform: 'uppercase' }}>На сумму</div>
          <div style={{ fontSize: '1.1em', fontWeight: 600 }}>
            {loading ? '…' : formatSum(totalSum)}
          </div>
        </div>
      </div>

      {/* Orders list */}
      {loading && <p style={{ fontSize: '0.8em', opacity: 0.6 }}>Загружаю…</p>}
      {error && (
        <p style={{ fontSize: '0.8em', color: '#e53e3e' }}>
          {error}
        </p>
      )}
      {!loading && !error && orders && orders.length === 0 && (
        <p style={{ fontSize: '0.8em', opacity: 0.6 }}>У клиента ещё нет заказов.</p>
      )}

      {!loading && orders && orders.length > 0 && (
        <div
          style={{
            maxHeight: 360,
            overflowY: 'auto',
            border: '1px solid var(--theme-elevation-100, #eee)',
            borderRadius: 6,
          }}
        >
          {orders.map((o) => (
            <a
              key={o.id}
              href={`/admin/collections/orders/${o.id}`}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '8px 10px',
                borderBottom: '1px solid var(--theme-elevation-50, #f2f2f2)',
                textDecoration: 'none',
                color: 'inherit',
                gap: 8,
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.background = 'var(--theme-elevation-50, #f8f8f8)'
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = 'transparent'
              }}
            >
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: '0.85em', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {o.orderNumber}
                </div>
                <div style={{ fontSize: '0.72em', opacity: 0.65, display: 'flex', gap: 6, alignItems: 'center' }}>
                  <span
                    style={{
                      display: 'inline-block',
                      width: 6,
                      height: 6,
                      borderRadius: '50%',
                      background: STATUS_COLORS[o.status] || '#94a3b8',
                    }}
                  />
                  <span>{STATUS_LABELS[o.status] || o.status}</span>
                  <span>·</span>
                  <span>{formatDate(o.createdAt)}</span>
                </div>
              </div>
              <div style={{ fontSize: '0.85em', fontWeight: 500, whiteSpace: 'nowrap' }}>
                {formatSum(o.total)}
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  )
}

export default CustomerOrdersPanel
