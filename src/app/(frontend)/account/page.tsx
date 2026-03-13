'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ThemeProvider } from '../themes/ThemeProvider'
import { PageWrapper } from '../components/PageWrapper'
import { Header } from '../components/Header'
import { Footer } from '../components/Footer'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Badge } from '../components/ui/Badge'
import { useAuth } from '../auth/AuthProvider'

type Tab = 'orders' | 'profile' | 'addresses'

interface Order {
  id: string
  orderNumber: string
  total: number
  status: string
  createdAt: string
}

const statusLabels: Record<string, { label: string; variant: 'default' | 'success' | 'warning' | 'danger' | 'accent' }> = {
  new: { label: 'Новый', variant: 'accent' },
  processing: { label: 'В обработке', variant: 'warning' },
  shipped: { label: 'Отправлен', variant: 'accent' },
  delivered: { label: 'Доставлен', variant: 'success' },
  completed: { label: 'Завершён', variant: 'success' },
  cancelled: { label: 'Отменён', variant: 'danger' },
}

export default function AccountPage() {
  const router = useRouter()
  const { customer, token, loading: authLoading, logout, refreshUser } = useAuth()
  const [tab, setTab] = useState<Tab>('orders')
  const [orders, setOrders] = useState<Order[]>([])
  const [ordersLoading, setOrdersLoading] = useState(false)

  // Profile form
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState('')

  useEffect(() => {
    if (!authLoading && !customer) {
      router.push('/auth/login?redirect=/account')
    }
  }, [authLoading, customer, router])

  useEffect(() => {
    if (customer) {
      setName(customer.name || '')
      setPhone(customer.phone || '')
    }
  }, [customer])

  useEffect(() => {
    if (tab === 'orders' && token) {
      setOrdersLoading(true)
      fetch('/api/orders?sort=-createdAt&limit=20', {
        headers: { Authorization: `JWT ${token}` },
      })
        .then((r) => r.json())
        .then((data) => {
          setOrders(
            (data.docs || []).map((o: Record<string, unknown>) => ({
              id: o.id,
              orderNumber: o.orderNumber,
              total: o.total,
              status: o.status,
              createdAt: o.createdAt,
            })),
          )
        })
        .catch(() => {})
        .finally(() => setOrdersLoading(false))
    }
  }, [tab, token])

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!customer || !token) return
    setSaving(true)
    setSaveMsg('')
    try {
      const res = await fetch(`/api/customers/${customer.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `JWT ${token}`,
        },
        body: JSON.stringify({ name, phone }),
      })
      if (res.ok) {
        setSaveMsg('Сохранено')
        await refreshUser()
      } else {
        setSaveMsg('Ошибка сохранения')
      }
    } catch {
      setSaveMsg('Ошибка сети')
    } finally {
      setSaving(false)
      setTimeout(() => setSaveMsg(''), 3000)
    }
  }

  if (authLoading || !customer) {
    return (
      <ThemeProvider>
        <PageWrapper>
          <Header />
          <div className="account-page">
            <div className="container" style={{ paddingTop: '80px', textAlign: 'center' }}>
              <div className="ui-btn__spinner" style={{ width: '32px', height: '32px', margin: '0 auto', borderTopColor: 'var(--color-accent)' }} />
            </div>
          </div>
          <Footer />
        </PageWrapper>
      </ThemeProvider>
    )
  }

  return (
    <ThemeProvider>
      <PageWrapper>
        <Header />
        <div className="account-page">
          <div className="container">
            <div className="page-header">
              <h1 className="page-header__title">Личный кабинет</h1>
              <p className="page-header__desc">Привет, {customer.name || customer.email}</p>
            </div>

            <div className="account-layout">
              <nav className="account-nav">
                <button
                  className={`account-nav__link ${tab === 'orders' ? 'account-nav__link--active' : ''}`}
                  onClick={() => setTab('orders')}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
                    <line x1="3" y1="6" x2="21" y2="6" />
                    <path d="M16 10a4 4 0 01-8 0" />
                  </svg>
                  Заказы
                </button>
                <button
                  className={`account-nav__link ${tab === 'profile' ? 'account-nav__link--active' : ''}`}
                  onClick={() => setTab('profile')}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                  Профиль
                </button>
                <button
                  className={`account-nav__link ${tab === 'addresses' ? 'account-nav__link--active' : ''}`}
                  onClick={() => setTab('addresses')}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                  Адреса
                </button>
                <button className="account-nav__link account-nav__link--danger" onClick={logout}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
                    <polyline points="16 17 21 12 16 7" />
                    <line x1="21" y1="12" x2="9" y2="12" />
                  </svg>
                  Выйти
                </button>
              </nav>

              <div className="account-content">
                {tab === 'orders' && (
                  <div>
                    <div className="account-card">
                      <h2 className="account-card__title">Мои заказы</h2>
                      {ordersLoading ? (
                        <p style={{ color: 'var(--color-text-muted)' }}>Загрузка...</p>
                      ) : orders.length === 0 ? (
                        <div className="ui-empty" style={{ padding: '40px 0' }}>
                          <h3 className="ui-empty__title">Заказов пока нет</h3>
                          <p className="ui-empty__desc">Оформите первый заказ в нашем каталоге</p>
                          <Button href="/catalog" variant="primary">
                            В каталог
                          </Button>
                        </div>
                      ) : (
                        <div className="account-orders-list">
                          {orders.map((o) => {
                            const st = statusLabels[o.status] || { label: o.status, variant: 'default' as const }
                            return (
                              <div key={o.id} className="account-order">
                                <div>
                                  <div className="account-order__num">{o.orderNumber}</div>
                                  <div className="account-order__date">
                                    {new Date(o.createdAt).toLocaleDateString('ru-RU', {
                                      day: 'numeric',
                                      month: 'long',
                                      year: 'numeric',
                                    })}
                                  </div>
                                </div>
                                <Badge variant={st.variant}>{st.label}</Badge>
                                <div className="account-order__total">
                                  {o.total.toLocaleString('ru-RU')} ₽
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {tab === 'profile' && (
                  <div className="account-card">
                    <h2 className="account-card__title">Личные данные</h2>
                    <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '400px' }}>
                      <Input
                        label="Имя"
                        name="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Ваше имя"
                      />
                      <Input
                        label="Email"
                        name="email"
                        type="email"
                        value={customer.email}
                        disabled
                        hint="Email нельзя изменить"
                      />
                      <Input
                        label="Телефон"
                        name="phone"
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+7 (999) 999-99-99"
                      />
                      <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                        <Button type="submit" variant="primary" loading={saving}>
                          Сохранить
                        </Button>
                        {saveMsg && (
                          <span style={{ fontSize: '13px', color: saveMsg === 'Сохранено' ? '#4ade80' : '#f87171' }}>
                            {saveMsg}
                          </span>
                        )}
                      </div>
                    </form>
                  </div>
                )}

                {tab === 'addresses' && (
                  <div className="account-card">
                    <h2 className="account-card__title">Адреса доставки</h2>
                    <div className="ui-empty" style={{ padding: '40px 0' }}>
                      <h3 className="ui-empty__title">Адресов пока нет</h3>
                      <p className="ui-empty__desc">Адреса можно добавить при оформлении заказа</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </PageWrapper>
    </ThemeProvider>
  )
}
