'use client'

import React, { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../auth/AuthProvider'

interface Order {
  id: string
  orderNumber: string
  status: string
  total: number
  createdAt: string
  items: { product: { title?: string } | string; quantity: number }[]
}

const STATUS_MAP: Record<string, { label: string; cls: string }> = {
  new: { label: 'Новый', cls: 'order-card__status--new' },
  processing: { label: 'В обработке', cls: 'order-card__status--processing' },
  shipped: { label: 'Отправлен', cls: 'order-card__status--shipped' },
  delivered: { label: 'Доставлен', cls: 'order-card__status--delivered' },
  cancelled: { label: 'Отменён', cls: 'order-card__status--cancelled' },
}

export function AccountScreen() {
  const router = useRouter()
  const { customer, token, loading: authLoading, logout } = useAuth()
  const [orders, setOrders] = useState<Order[]>([])
  const [loadingOrders, setLoadingOrders] = useState(false)

  const fetchOrders = useCallback(async () => {
    if (!token) return
    setLoadingOrders(true)
    try {
      const res = await fetch(`/api/shop-orders?where[customer][equals]=${customer?.id}&sort=-createdAt&limit=20`, {
        headers: { Authorization: `JWT ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setOrders(data.docs || [])
      }
    } catch { /* ignore */ } finally {
      setLoadingOrders(false)
    }
  }, [token, customer?.id])

  useEffect(() => {
    if (customer && token) fetchOrders()
  }, [customer, token, fetchOrders])

  if (authLoading) {
    return (
      <div className="pwa-screen animate-in">
        <div className="empty">
          <div className="btn__spinner" style={{ width: 32, height: 32, borderColor: 'var(--c-primary)', borderTopColor: 'transparent' }} />
        </div>
      </div>
    )
  }

  if (!customer) {
    return (
      <div className="pwa-screen animate-in">
        <div className="empty">
          <div className="empty__icon">
            <svg viewBox="0 0 24 24">
              <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </div>
          <h3 className="t-h3">Войдите в аккаунт</h3>
          <p className="t-caption t-sec">Чтобы просмотреть заказы и управлять профилем</p>
          <Link href="/auth" className="btn btn--primary mt-16">Войти</Link>
        </div>
      </div>
    )
  }

  const initials = (customer.name || customer.email || '?').charAt(0).toUpperCase()

  const handleLogout = () => {
    logout()
    router.replace('/')
  }

  return (
    <div className="pwa-screen animate-in">
      {/* Profile header */}
      <div className="account-header">
        <div className="account-avatar">{initials}</div>
        <div>
          <div className="account-info__name">{customer.name || 'Покупатель'}</div>
          <div className="account-info__email">{customer.email}</div>
        </div>
      </div>

      {/* Orders */}
      <h2 className="t-h3 mb-12">Мои заказы</h2>

      {loadingOrders && (
        <div style={{ textAlign: 'center', padding: 20 }}>
          <div className="btn__spinner" style={{ width: 24, height: 24, borderColor: 'var(--c-primary)', borderTopColor: 'transparent', margin: '0 auto' }} />
        </div>
      )}

      {!loadingOrders && orders.length === 0 && (
        <div className="glass" style={{ padding: 20, textAlign: 'center' }}>
          <p className="t-caption t-sec mb-12">У вас пока нет заказов</p>
          <Link href="/catalog" className="btn btn--primary btn--sm">Перейти в каталог</Link>
        </div>
      )}

      {!loadingOrders && orders.length > 0 && (
        <div className="stack mb-24">
          {orders.map((order) => {
            const st = STATUS_MAP[order.status] || { label: order.status, cls: '' }
            const itemNames = order.items
              ?.map((i) => typeof i.product === 'object' ? i.product.title : 'Товар')
              .filter(Boolean)
              .join(', ')
            return (
              <div key={order.id} className="order-card">
                <div className="order-card__head">
                  <span className="order-card__num">#{order.orderNumber}</span>
                  <span className={`order-card__status ${st.cls}`}>{st.label}</span>
                </div>
                {itemNames && <div className="order-card__items">{itemNames}</div>}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="order-card__total">{order.total?.toLocaleString('ru-RU')} ₽</span>
                  <span className="t-small t-muted">
                    {new Date(order.createdAt).toLocaleDateString('ru-RU')}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <button className="btn btn--danger btn--full" onClick={handleLogout}>
        Выйти из аккаунта
      </button>
    </div>
  )
}
