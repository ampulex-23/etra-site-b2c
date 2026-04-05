'use client'

import React, { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../auth/AuthProvider'
import { ReferralSection } from '../components/ReferralSection'

type Tab = 'profile' | 'orders' | 'addresses' | 'favorites' | 'courses' | 'referrals'

interface MyEnrollment {
  id: string
  status: string
  currentDay: number
  reportStreak: number
  missedReports: number
  enrolledAt: string
  infoproduct: {
    id: string
    title: string
    slug: string
    type: string
    coverImage: string | null
    durationDays: number
  } | null
  cohort: {
    id: string
    title: string
    status: string
    startDate: string
  } | null
}

interface Order {
  id: string
  orderNumber: string
  status: string
  total: number
  createdAt: string
  deliveryCost?: number
  delivery?: { method?: string; address?: string }
  linkedDelivery?: { status?: string; trackingNumber?: string } | string
  items: { product: { id?: string; title?: string; slug?: string } | string; quantity: number; price: number }[]
}

interface Address {
  id?: string
  title?: string
  city?: string
  street?: string
  apartment?: string
  zip?: string
}

interface Product {
  id: string
  title: string
  slug: string
  price: number
  images?: { url?: string }[]
}

const ORDER_STATUS: Record<string, { label: string; color: string }> = {
  new: { label: 'Новый', color: '#3b82f6' },
  processing: { label: 'В обработке', color: '#f59e0b' },
  shipped: { label: 'Отправлен', color: '#8b5cf6' },
  delivered: { label: 'Доставлен', color: '#10b981' },
  completed: { label: 'Завершён', color: '#10b981' },
  cancelled: { label: 'Отменён', color: '#ef4444' },
}

const DELIVERY_STATUS: Record<string, string> = {
  pending: 'Ожидает отправки',
  handed_over: 'Передан в доставку',
  in_transit: 'В пути',
  arrived: 'Прибыл в ПВЗ',
  delivered: 'Доставлен',
  returned: 'Возврат',
}

export function AccountScreen() {
  const router = useRouter()
  const { customer, token, loading: authLoading, logout, refreshUser } = useAuth()
  const [activeTab, setActiveTab] = useState<Tab>('profile')
  const [orders, setOrders] = useState<Order[]>([])
  const [favorites, setFavorites] = useState<Product[]>([])
  const [loadingOrders, setLoadingOrders] = useState(false)
  const [loadingFavorites, setLoadingFavorites] = useState(false)
  const [enrollments, setEnrollments] = useState<MyEnrollment[]>([])
  const [loadingEnrollments, setLoadingEnrollments] = useState(false)
  
  // Profile editing
  const [editMode, setEditMode] = useState(false)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [saveSuccess, setSaveSuccess] = useState(false)
  
  // Addresses
  const [addresses, setAddresses] = useState<Address[]>([])
  const [editingAddress, setEditingAddress] = useState<Address | null>(null)
  const [showAddressForm, setShowAddressForm] = useState(false)

  // Expanded order
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null)

  // Initialize form values when customer loads
  useEffect(() => {
    if (customer) {
      setName(customer.name || '')
      setPhone(customer.phone || '')
      setAddresses(customer.addresses || [])
    }
  }, [customer])

  const fetchOrders = useCallback(async () => {
    if (!token || !customer?.id) return
    setLoadingOrders(true)
    try {
      const res = await fetch(`/api/shop-orders?where[customer][equals]=${customer.id}&sort=-createdAt&limit=50&depth=2`, {
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

  const fetchFavorites = useCallback(async () => {
    if (!token || !customer?.favorites?.length) {
      setFavorites([])
      return
    }
    setLoadingFavorites(true)
    try {
      // Favorites are already populated if depth > 0
      const favs = customer.favorites
        .map((f: any) => typeof f === 'object' ? f : null)
        .filter(Boolean) as Product[]
      setFavorites(favs)
    } catch { /* ignore */ } finally {
      setLoadingFavorites(false)
    }
  }, [token, customer?.favorites])

  const fetchEnrollments = useCallback(async () => {
    if (!token) return
    setLoadingEnrollments(true)
    try {
      const res = await fetch('/api/enrollments/my', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setEnrollments(data.enrollments || [])
      }
    } catch { /* ignore */ } finally {
      setLoadingEnrollments(false)
    }
  }, [token])

  useEffect(() => {
    if (customer && token) {
      if (activeTab === 'orders') fetchOrders()
      if (activeTab === 'favorites') fetchFavorites()
      if (activeTab === 'courses') fetchEnrollments()
    }
  }, [customer, token, activeTab, fetchOrders, fetchFavorites, fetchEnrollments])

  const handleSaveProfile = async () => {
    if (!token) return
    setSaving(true)
    setSaveError('')
    setSaveSuccess(false)
    
    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `JWT ${token}`,
        },
        body: JSON.stringify({ name, phone }),
      })
      
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Ошибка сохранения')
      }
      
      setSaveSuccess(true)
      setEditMode(false)
      refreshUser()
      setTimeout(() => setSaveSuccess(false), 3000)
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Ошибка сохранения')
    } finally {
      setSaving(false)
    }
  }

  const handleSaveAddresses = async (newAddresses: Address[]) => {
    if (!token) return
    setSaving(true)
    setSaveError('')
    
    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `JWT ${token}`,
        },
        body: JSON.stringify({ addresses: newAddresses }),
      })
      
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Ошибка сохранения')
      }
      
      setAddresses(newAddresses)
      setShowAddressForm(false)
      setEditingAddress(null)
      refreshUser()
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Ошибка сохранения')
    } finally {
      setSaving(false)
    }
  }

  const handleLogout = () => {
    logout()
    router.replace('/')
  }

  // Get avatar URL - prefer uploaded, fallback to Telegram
  const getAvatarUrl = () => {
    if (customer?.avatar && typeof customer.avatar === 'object' && customer.avatar.url) {
      return customer.avatar.url
    }
    if (customer?.telegram?.photoUrl) {
      return customer.telegram.photoUrl
    }
    return null
  }

  const avatarUrl = getAvatarUrl()
  const initials = (customer?.name || customer?.email || '?').charAt(0).toUpperCase()

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
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
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

  return (
    <div className="pwa-screen animate-in account-screen">
      {/* Profile header */}
      <div className="account-header glass">
        <div className="account-avatar">
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatarUrl} alt="" width={64} height={64} className="account-avatar__img" />
          ) : (
            <span className="account-avatar__initials">{initials}</span>
          )}
        </div>
        <div className="account-header__info">
          <div className="account-header__name">{customer.name || 'Покупатель'}</div>
          <div className="account-header__email">{customer.email}</div>
          {(customer.bonusBalance ?? 0) > 0 && (
            <div className="account-header__bonus">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
              </svg>
              {customer.bonusBalance} бонусов
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="account-tabs">
        <button 
          className={`account-tab ${activeTab === 'profile' ? 'account-tab--active' : ''}`}
          onClick={() => setActiveTab('profile')}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
            <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
          Профиль
        </button>
        <button 
          className={`account-tab ${activeTab === 'orders' ? 'account-tab--active' : ''}`}
          onClick={() => setActiveTab('orders')}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
            <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          Заказы
          {orders.length > 0 && <span className="account-tab__badge">{orders.length}</span>}
        </button>
        <button 
          className={`account-tab ${activeTab === 'addresses' ? 'account-tab--active' : ''}`}
          onClick={() => setActiveTab('addresses')}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
          Адреса
        </button>
        <button 
          className={`account-tab ${activeTab === 'favorites' ? 'account-tab--active' : ''}`}
          onClick={() => setActiveTab('favorites')}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
            <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
          </svg>
          Избранное
        </button>
        <button 
          className={`account-tab ${activeTab === 'referrals' ? 'account-tab--active' : ''}`}
          onClick={() => setActiveTab('referrals')}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
            <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
          </svg>
          Рефералы
        </button>
        <button 
          className={`account-tab ${activeTab === 'courses' ? 'account-tab--active' : ''}`}
          onClick={() => setActiveTab('courses')}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
            <path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z" />
            <path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z" />
          </svg>
          Курсы
        </button>
      </div>

      {/* Tab content */}
      <div className="account-content">
        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div className="account-profile">
            {saveSuccess && (
              <div className="alert alert--success mb-16">Профиль сохранён</div>
            )}
            {saveError && (
              <div className="alert alert--error mb-16">{saveError}</div>
            )}
            
            {editMode ? (
              <div className="stack">
                <div className="form-group">
                  <label className="form-label">Имя</label>
                  <input 
                    type="text" 
                    className="input" 
                    value={name} 
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ваше имя"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Телефон</label>
                  <input 
                    type="tel" 
                    className="input" 
                    value={phone} 
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+7 (999) 123-45-67"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input 
                    type="email" 
                    className="input" 
                    value={customer.email} 
                    disabled
                  />
                  <p className="form-hint">Email нельзя изменить</p>
                </div>
                <div className="btn-group">
                  <button 
                    className="btn btn--primary" 
                    onClick={handleSaveProfile}
                    disabled={saving}
                  >
                    {saving ? 'Сохранение...' : 'Сохранить'}
                  </button>
                  <button 
                    className="btn btn--secondary" 
                    onClick={() => {
                      setEditMode(false)
                      setName(customer.name || '')
                      setPhone(customer.phone || '')
                    }}
                  >
                    Отмена
                  </button>
                </div>
              </div>
            ) : (
              <div className="stack">
                <div className="profile-field">
                  <span className="profile-field__label">Имя</span>
                  <span className="profile-field__value">{customer.name || '—'}</span>
                </div>
                <div className="profile-field">
                  <span className="profile-field__label">Телефон</span>
                  <span className="profile-field__value">{customer.phone || '—'}</span>
                </div>
                <div className="profile-field">
                  <span className="profile-field__label">Email</span>
                  <span className="profile-field__value">{customer.email}</span>
                </div>
                {customer.telegram?.username && (
                  <div className="profile-field">
                    <span className="profile-field__label">Telegram</span>
                    <span className="profile-field__value">@{customer.telegram.username}</span>
                  </div>
                )}
                <button className="btn btn--secondary btn--full" onClick={() => setEditMode(true)}>
                  Редактировать профиль
                </button>
              </div>
            )}
            
            <div className="mt-24">
              <button className="btn btn--danger btn--full" onClick={handleLogout}>
                Выйти из аккаунта
              </button>
            </div>
          </div>
        )}

        {/* Orders Tab */}
        {activeTab === 'orders' && (
          <div className="account-orders">
            {loadingOrders && (
              <div className="loading-spinner">
                <div className="btn__spinner" />
              </div>
            )}

            {!loadingOrders && orders.length === 0 && (
              <div className="empty-state glass">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="48" height="48">
                  <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <p>У вас пока нет заказов</p>
                <Link href="/catalog" className="btn btn--primary btn--sm">Перейти в каталог</Link>
              </div>
            )}

            {!loadingOrders && orders.length > 0 && (
              <div className="orders-list">
                {orders.map((order) => {
                  const status = ORDER_STATUS[order.status] || { label: order.status, color: '#6b7280' }
                  const isExpanded = expandedOrder === order.id
                  const deliveryStatus = typeof order.linkedDelivery === 'object' 
                    ? DELIVERY_STATUS[order.linkedDelivery?.status || ''] || order.linkedDelivery?.status
                    : null
                  const trackingNumber = typeof order.linkedDelivery === 'object' 
                    ? order.linkedDelivery?.trackingNumber 
                    : null

                  return (
                    <div key={order.id} className={`order-card glass ${isExpanded ? 'order-card--expanded' : ''}`}>
                      <div 
                        className="order-card__header"
                        onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
                      >
                        <div className="order-card__main">
                          <span className="order-card__number">#{order.orderNumber}</span>
                          <span 
                            className="order-card__status"
                            style={{ backgroundColor: status.color }}
                          >
                            {status.label}
                          </span>
                        </div>
                        <div className="order-card__meta">
                          <span className="order-card__date">
                            {new Date(order.createdAt).toLocaleDateString('ru-RU', { 
                              day: 'numeric', month: 'short', year: 'numeric' 
                            })}
                          </span>
                          <span className="order-card__total">{order.total?.toLocaleString('ru-RU')} ₽</span>
                        </div>
                        <svg 
                          className={`order-card__chevron ${isExpanded ? 'order-card__chevron--up' : ''}`}
                          viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20"
                        >
                          <path d="M6 9l6 6 6-6" />
                        </svg>
                      </div>

                      {isExpanded && (
                        <div className="order-card__details">
                          {/* Delivery info */}
                          {deliveryStatus && (
                            <div className="order-detail">
                              <span className="order-detail__label">Доставка:</span>
                              <span className="order-detail__value">{deliveryStatus}</span>
                            </div>
                          )}
                          {trackingNumber && (
                            <div className="order-detail">
                              <span className="order-detail__label">Трек-номер:</span>
                              <span className="order-detail__value order-detail__value--mono">{trackingNumber}</span>
                            </div>
                          )}
                          {order.delivery?.address && (
                            <div className="order-detail">
                              <span className="order-detail__label">Адрес:</span>
                              <span className="order-detail__value">{order.delivery.address}</span>
                            </div>
                          )}

                          {/* Items */}
                          <div className="order-items">
                            <div className="order-items__title">Товары:</div>
                            {order.items?.map((item, idx) => {
                              const product = typeof item.product === 'object' ? item.product : null
                              return (
                                <div key={idx} className="order-item">
                                  <span className="order-item__name">
                                    {product?.title || 'Товар'}
                                  </span>
                                  <span className="order-item__qty">× {item.quantity}</span>
                                  <span className="order-item__price">{item.price?.toLocaleString('ru-RU')} ₽</span>
                                </div>
                              )
                            })}
                          </div>

                          {/* Summary */}
                          <div className="order-summary">
                            {(order.deliveryCost ?? 0) > 0 && (
                              <div className="order-summary__row">
                                <span>Доставка</span>
                                <span>{order.deliveryCost?.toLocaleString('ru-RU')} ₽</span>
                              </div>
                            )}
                            <div className="order-summary__row order-summary__row--total">
                              <span>Итого</span>
                              <span>{order.total?.toLocaleString('ru-RU')} ₽</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* Addresses Tab */}
        {activeTab === 'addresses' && (
          <div className="account-addresses">
            {showAddressForm ? (
              <AddressForm
                address={editingAddress}
                onSave={(addr) => {
                  const newAddresses = editingAddress
                    ? addresses.map((a, i) => i === addresses.indexOf(editingAddress) ? addr : a)
                    : [...addresses, addr]
                  handleSaveAddresses(newAddresses)
                }}
                onCancel={() => {
                  setShowAddressForm(false)
                  setEditingAddress(null)
                }}
                saving={saving}
              />
            ) : (
              <>
                {addresses.length === 0 ? (
                  <div className="empty-state glass">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="48" height="48">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                    <p>У вас нет сохранённых адресов</p>
                  </div>
                ) : (
                  <div className="addresses-list">
                    {addresses.map((addr, idx) => (
                      <div key={idx} className="address-card glass">
                        <div className="address-card__title">{addr.title || 'Адрес'}</div>
                        <div className="address-card__text">
                          {addr.city}, {addr.street}
                          {addr.apartment && `, кв. ${addr.apartment}`}
                          {addr.zip && ` (${addr.zip})`}
                        </div>
                        <div className="address-card__actions">
                          <button 
                            className="btn btn--sm btn--secondary"
                            onClick={() => {
                              setEditingAddress(addr)
                              setShowAddressForm(true)
                            }}
                          >
                            Изменить
                          </button>
                          <button 
                            className="btn btn--sm btn--danger-outline"
                            onClick={() => {
                              const newAddresses = addresses.filter((_, i) => i !== idx)
                              handleSaveAddresses(newAddresses)
                            }}
                          >
                            Удалить
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <button 
                  className="btn btn--primary btn--full mt-16"
                  onClick={() => setShowAddressForm(true)}
                >
                  Добавить адрес
                </button>
              </>
            )}
          </div>
        )}

        {/* Favorites Tab */}
        {activeTab === 'favorites' && (
          <div className="account-favorites">
            {loadingFavorites && (
              <div className="loading-spinner">
                <div className="btn__spinner" />
              </div>
            )}

            {!loadingFavorites && favorites.length === 0 && (
              <div className="empty-state glass">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="48" height="48">
                  <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
                </svg>
                <p>В избранном пока пусто</p>
                <Link href="/catalog" className="btn btn--primary btn--sm">Перейти в каталог</Link>
              </div>
            )}

            {!loadingFavorites && favorites.length > 0 && (
              <div className="favorites-grid">
                {favorites.map((product) => (
                  <Link key={product.id} href={`/products/${product.slug}`} className="favorite-card glass">
                    {product.images?.[0]?.url && (
                      <Image 
                        src={product.images[0].url} 
                        alt={product.title} 
                        width={80} 
                        height={80}
                        className="favorite-card__img"
                      />
                    )}
                    <div className="favorite-card__info">
                      <div className="favorite-card__title">{product.title}</div>
                      <div className="favorite-card__price">{product.price?.toLocaleString('ru-RU')} ₽</div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Courses Tab */}
        {activeTab === 'courses' && (
          <div className="account-courses">
            {loadingEnrollments ? (
              <div style={{ textAlign: 'center', padding: 40 }}><div className="spinner" /></div>
            ) : enrollments.length === 0 ? (
              <div className="glass" style={{ padding: 32, textAlign: 'center' }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>📚</div>
                <div className="t-h3" style={{ marginBottom: 8 }}>Нет записей на курсы</div>
                <p className="t-caption t-sec" style={{ marginBottom: 16 }}>Посмотрите наши программы и запишитесь на курс</p>
                <Link href="/courses" className="btn btn--primary">Каталог курсов</Link>
              </div>
            ) : (
              <div className="account-courses__list">
                {enrollments.map((e) => {
                  const progress = e.infoproduct?.durationDays
                    ? Math.round((e.currentDay / e.infoproduct.durationDays) * 100)
                    : 0
                  return (
                    <Link
                      key={e.id}
                      href={`/courses/my/${e.id}`}
                      className="account-course-card glass"
                    >
                      <div className="account-course-card__info">
                        <div className="account-course-card__title">
                          {e.infoproduct?.title || 'Курс'}
                        </div>
                        <div className="account-course-card__cohort">
                          {e.cohort?.title}
                        </div>
                        <div className="account-course-card__meta">
                          <span className={`account-course-card__status account-course-card__status--${e.status}`}>
                            {e.status === 'active' ? '🟢 Активен' : e.status === 'completed' ? '✅ Завершён' : e.status === 'pending' ? '⏳ Ожидание' : e.status === 'expelled' ? '❌ Исключён' : e.status}
                          </span>
                          {e.status === 'active' && (
                            <span>🔥 {e.reportStreak} дней подряд</span>
                          )}
                        </div>
                        {e.status === 'active' && (
                          <div className="account-course-card__progress">
                            <div className="cdash-progress__bar">
                              <div className="cdash-progress__fill" style={{ width: `${Math.min(progress, 100)}%` }} />
                            </div>
                            <span className="account-course-card__progress-text">
                              День {e.currentDay}/{e.infoproduct?.durationDays || '?'}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="account-course-card__arrow">→</div>
                    </Link>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* Referrals Tab */}
        {activeTab === 'referrals' && (
          <ReferralSection 
            customer={customer ? {
              referralCode: customer.referralCode || '',
              experiencePoints: customer.experiencePoints || 0,
              referralLevel: customer.referralLevel || 'Новичок',
              referralDiscount: customer.referralDiscount || 0,
              totalReferrals: customer.totalReferrals || 0,
              totalReferralOrders: customer.totalReferralOrders || 0,
              totalReferralRevenue: customer.totalReferralRevenue || 0,
            } : null}
          />
        )}
      </div>
    </div>
  )
}

// Address Form Component
function AddressForm({ 
  address, 
  onSave, 
  onCancel, 
  saving 
}: { 
  address: Address | null
  onSave: (addr: Address) => void
  onCancel: () => void
  saving: boolean
}) {
  const [title, setTitle] = useState(address?.title || '')
  const [city, setCity] = useState(address?.city || '')
  const [street, setStreet] = useState(address?.street || '')
  const [apartment, setApartment] = useState(address?.apartment || '')
  const [zip, setZip] = useState(address?.zip || '')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!city || !street) return
    onSave({ title, city, street, apartment, zip })
  }

  return (
    <form onSubmit={handleSubmit} className="address-form stack">
      <div className="form-group">
        <label className="form-label">Название (дом, работа...)</label>
        <input 
          type="text" 
          className="input" 
          value={title} 
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Например: Дом"
        />
      </div>
      <div className="form-group">
        <label className="form-label">Город *</label>
        <input 
          type="text" 
          className="input" 
          value={city} 
          onChange={(e) => setCity(e.target.value)}
          placeholder="Москва"
          required
        />
      </div>
      <div className="form-group">
        <label className="form-label">Улица, дом *</label>
        <input 
          type="text" 
          className="input" 
          value={street} 
          onChange={(e) => setStreet(e.target.value)}
          placeholder="ул. Примерная, д. 1"
          required
        />
      </div>
      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Квартира / офис</label>
          <input 
            type="text" 
            className="input" 
            value={apartment} 
            onChange={(e) => setApartment(e.target.value)}
            placeholder="12"
          />
        </div>
        <div className="form-group">
          <label className="form-label">Индекс</label>
          <input 
            type="text" 
            className="input" 
            value={zip} 
            onChange={(e) => setZip(e.target.value)}
            placeholder="123456"
          />
        </div>
      </div>
      <div className="btn-group">
        <button type="submit" className="btn btn--primary" disabled={saving}>
          {saving ? 'Сохранение...' : 'Сохранить'}
        </button>
        <button type="button" className="btn btn--secondary" onClick={onCancel}>
          Отмена
        </button>
      </div>
    </form>
  )
}
