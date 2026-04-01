'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCart } from '../../cart/CartProvider'
import { useAuth } from '../../auth/AuthProvider'

type DeliveryMethod = 'cdek' | 'pickup'
type CdekCity = { code: number; city: string; region: string }
type CdekPvz = {
  code: string; name: string;
  location: { address: string; address_full: string; latitude: number; longitude: number }
  work_time: string; type: string
}
type CdekTariff = { tariff_code: number; tariff_name: string; delivery_sum: number; period_min: number; period_max: number }
type CdekCalcResult = { delivery_sum: number; period_min: number; period_max: number; tariff_code: number; tariff_name: string; available_tariffs?: CdekTariff[]; error?: string }

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => { const t = setTimeout(() => setDebounced(value), delay); return () => clearTimeout(t) }, [value, delay])
  return debounced
}

export function CheckoutScreen() {
  const router = useRouter()
  const { customer, token } = useAuth()
  const { items, totalPrice, clearCart } = useCart()

  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>('cdek')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [comment, setComment] = useState('')
  const [profileLoaded, setProfileLoaded] = useState(false)

  // Sync form fields with customer data when it loads (fixes refresh bug)
  useEffect(() => {
    if (customer && !profileLoaded) {
      setName(customer.name || '')
      setEmail(customer.email || '')
      setPhone(customer.phone || '')
      setProfileLoaded(true)
    }
  }, [customer, profileLoaded])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [cityQuery, setCityQuery] = useState('')
  const [citySuggestions, setCitySuggestions] = useState<CdekCity[]>([])
  const [selectedCity, setSelectedCity] = useState<CdekCity | null>(null)
  const [showCitySuggestions, setShowCitySuggestions] = useState(false)
  const [address, setAddress] = useState('')
  const [pvzList, setPvzList] = useState<CdekPvz[]>([])
  const [selectedPvz, setSelectedPvz] = useState<CdekPvz | null>(null)
  const [deliveryType, setDeliveryType] = useState<'pvz' | 'door'>('pvz')
  const [cdekCalc, setCdekCalc] = useState<CdekCalcResult | null>(null)
  const [calcLoading, setCalcLoading] = useState(false)
  const [calcError, setCalcError] = useState('')
  const [selectedTariff, setSelectedTariff] = useState<CdekTariff | null>(null)
  const cityRef = useRef<HTMLDivElement>(null)
  const debouncedCityQuery = useDebounce(cityQuery, 400)

  useEffect(() => {
    if (!debouncedCityQuery || debouncedCityQuery.length < 2 || selectedCity) return
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch(`/api/cdek/cities?city=${encodeURIComponent(debouncedCityQuery)}&size=10`)
        if (!res.ok) return
        const data = await res.json()
        if (!cancelled) { setCitySuggestions(Array.isArray(data) ? data : []); setShowCitySuggestions(true) }
      } catch { /* ignore */ }
    })()
    return () => { cancelled = true }
  }, [debouncedCityQuery, selectedCity])

  useEffect(() => {
    if (!selectedCity || deliveryType !== 'pvz') { setPvzList([]); return }
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch(`/api/cdek/pvz?city_code=${selectedCity.code}&type=ALL`)
        if (!res.ok) return
        const data = await res.json()
        if (!cancelled) setPvzList(Array.isArray(data) ? data : [])
      } catch { /* ignore */ }
    })()
    return () => { cancelled = true }
  }, [selectedCity, deliveryType])

  const calculateDelivery = useCallback(async () => {
    if (!selectedCity || deliveryMethod !== 'cdek') { 
      setCdekCalc(null)
      setCalcError('')
      setSelectedTariff(null)
      return 
    }
    setCalcLoading(true)
    setCalcError('')
    try {
      const totalWeight = items.reduce((sum, i) => sum + 500 * i.quantity, 0)
      const res = await fetch('/api/cdek/calculate', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cityCode: String(selectedCity.code), weight: totalWeight || 500 }),
      })
      const data = await res.json()
      if (!res.ok || data.error) { 
        setCdekCalc(null)
        setSelectedTariff(null)
        setCalcError(data.error || 'Не удалось рассчитать доставку')
        return 
      }
      setCdekCalc(data)
      // Auto-select the cheapest tariff (already selected by API)
      if (data.tariff_code) {
        setSelectedTariff({
          tariff_code: data.tariff_code,
          tariff_name: data.tariff_name,
          delivery_sum: data.delivery_sum,
          period_min: data.period_min,
          period_max: data.period_max,
        })
      }
    } catch { 
      setCdekCalc(null)
      setSelectedTariff(null)
      setCalcError('Ошибка расчёта доставки') 
    } finally { setCalcLoading(false) }
  }, [selectedCity, deliveryMethod, items])

  useEffect(() => { calculateDelivery() }, [calculateDelivery])

  useEffect(() => {
    const handle = (e: MouseEvent) => {
      if (cityRef.current && !cityRef.current.contains(e.target as Node)) setShowCitySuggestions(false)
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [])

  const deliveryCost = deliveryMethod === 'pickup' ? 0 : (selectedTariff?.delivery_sum || 0)
  const orderTotal = totalPrice + deliveryCost

  if (items.length === 0) {
    return (
      <div className="pwa-screen animate-in">
        <div className="empty">
          <div className="empty__icon">
            <svg viewBox="0 0 24 24"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" /><line x1="3" y1="6" x2="21" y2="6" /><path d="M16 10a4 4 0 01-8 0" /></svg>
          </div>
          <h3 className="t-h3">Корзина пуста</h3>
          <p className="t-caption t-sec">Добавьте товары для оформления</p>
          <Link href="/catalog" className="btn btn--primary mt-16">В каталог</Link>
        </div>
      </div>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!customer || !token) { router.push('/auth?redirect=/checkout'); return }
    if (deliveryMethod === 'cdek' && !selectedCity) { setError('Выберите город доставки'); return }
    if (deliveryMethod === 'cdek' && deliveryType === 'pvz' && !selectedPvz) { setError('Выберите пункт выдачи'); return }
    if (deliveryMethod === 'cdek' && deliveryType === 'door' && !address) { setError('Укажите адрес доставки'); return }

    setLoading(true)
    try {
      const orderItems = items.map((i) => ({ product: i.productId, variantName: i.variantName || undefined, quantity: i.quantity, price: i.price }))
      const orderNumber = `ETR-${Date.now().toString(36).toUpperCase()}`
      let deliveryAddress = 'Самовывоз'
      if (deliveryMethod === 'cdek') {
        deliveryAddress = deliveryType === 'pvz' && selectedPvz
          ? `${selectedCity?.city}, ПВЗ: ${selectedPvz.name} — ${selectedPvz.location.address}`
          : `${selectedCity?.city}, ${address}`
      }
      const res = await fetch('/api/shop-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `JWT ${token}` },
        body: JSON.stringify({
          orderNumber, customer: customer.id, items: orderItems, subtotal: totalPrice, deliveryCost,
          total: orderTotal, status: 'new',
          delivery: { method: deliveryMethod, address: deliveryAddress },
          notes: comment || undefined, payment: { status: 'pending' },
        }),
      })
      if (!res.ok) { const data = await res.json(); throw new Error(data.errors?.[0]?.message || 'Ошибка') }
      clearCart()
      router.push('/account')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Не удалось оформить заказ')
    } finally { setLoading(false) }
  }

  return (
    <div className="pwa-screen animate-in">
      <h1 className="t-h2 mb-16">Оформление заказа</h1>

      {!customer && (
        <div className="glass" style={{ padding: 16, textAlign: 'center', marginBottom: 16 }}>
          <p className="t-caption t-sec mb-12">Войдите, чтобы оформить заказ</p>
          <Link href="/auth?redirect=/checkout" className="btn btn--primary btn--sm">Войти</Link>
        </div>
      )}

      {error && <div className="auth-card__error mb-16">{error}</div>}

      <form onSubmit={handleSubmit}>
        {/* 1. Contact */}
        <div className="checkout-sec">
          <div className="checkout-sec__head">
            <span className="checkout-sec__num">1</span>
            <span className="checkout-sec__title">Контактные данные</span>
          </div>
          <div className="stack">
            <div className="inp-wrap">
              <label className="inp-label">Имя</label>
              <input className="inp" value={name} onChange={(e) => setName(e.target.value)} required placeholder="Ваше имя" />
            </div>
            <div className="inp-wrap">
              <label className="inp-label">Телефон</label>
              <input className="inp" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} required placeholder="+7 (999) 999-99-99" />
            </div>
            <div className="inp-wrap">
              <label className="inp-label">Email</label>
              <input className="inp" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="your@email.com" />
            </div>
          </div>
        </div>

        {/* 2. Delivery */}
        <div className="checkout-sec">
          <div className="checkout-sec__head">
            <span className="checkout-sec__num">2</span>
            <span className="checkout-sec__title">Доставка</span>
          </div>

          <button type="button" className={`del-option ${deliveryMethod === 'cdek' ? 'del-option--active' : ''}`} onClick={() => setDeliveryMethod('cdek')}>
            <div className="del-option__radio" />
            <div className="del-option__info">
              <div className="del-option__name">СДЭК</div>
              <div className="del-option__desc">{cdekCalc ? `${cdekCalc.period_min}–${cdekCalc.period_max} дн.` : 'Курьером или в ПВЗ'}</div>
            </div>
            <div className="del-option__price">
              {calcLoading ? '...' : selectedTariff ? `${Math.round(selectedTariff.delivery_sum).toLocaleString('ru-RU')} ₽` : calcError ? '—' : 'Рассчитать'}
            </div>
          </button>

          <button type="button" className={`del-option ${deliveryMethod === 'pickup' ? 'del-option--active' : ''}`} onClick={() => setDeliveryMethod('pickup')}>
            <div className="del-option__radio" />
            <div className="del-option__info">
              <div className="del-option__name">Самовывоз</div>
              <div className="del-option__desc">Москва</div>
            </div>
            <div className="del-option__price" style={{ color: 'var(--c-success)' }}>Бесплатно</div>
          </button>

          {deliveryMethod === 'cdek' && (
            <div className="mt-16 stack">
              {calcError && (
                <div className="auth-card__error" style={{ marginBottom: 12 }}>
                  {calcError}
                  <div className="t-small" style={{ marginTop: 4, opacity: 0.8 }}>Попробуйте выбрать другой город</div>
                </div>
              )}

              {/* Tariff selection - show available tariffs if any */}
              {cdekCalc?.available_tariffs && cdekCalc.available_tariffs.length > 1 && (
                <div>
                  <label className="inp-label mb-8">Тариф доставки</label>
                  <div className="tariff-list">
                    {cdekCalc.available_tariffs.map((tariff) => (
                      <button
                        key={tariff.tariff_code}
                        type="button"
                        className={`tariff-item ${selectedTariff?.tariff_code === tariff.tariff_code ? 'tariff-item--active' : ''}`}
                        onClick={() => setSelectedTariff(tariff)}
                      >
                        <div className="tariff-item__name">{tariff.tariff_name}</div>
                        <div className="tariff-item__info">
                          <span>{tariff.period_min}–{tariff.period_max} дн.</span>
                          <span className="tariff-item__price">{Math.round(tariff.delivery_sum).toLocaleString('ru-RU')} ₽</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div ref={cityRef} style={{ position: 'relative' }}>
                <div className="inp-wrap">
                  <label className="inp-label">Город</label>
                  <input className="inp" value={selectedCity ? selectedCity.city : cityQuery}
                    onChange={(e) => { setCityQuery(e.target.value); setSelectedCity(null); setCdekCalc(null); setSelectedPvz(null) }}
                    required placeholder="Начните вводить город" autoComplete="off" />
                </div>
                {showCitySuggestions && citySuggestions.length > 0 && !selectedCity && (
                  <div className="city-dropdown">
                    {citySuggestions.map((c) => (
                      <button key={c.code} type="button" className="city-dropdown__item"
                        onClick={() => { setSelectedCity(c); setCityQuery(c.city); setShowCitySuggestions(false); setSelectedPvz(null) }}>
                        <strong>{c.city}</strong> <span className="t-muted" style={{ marginLeft: 6 }}>{c.region}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {deliveryType === 'pvz' && selectedCity && pvzList.length > 0 && (
                <div>
                  <label className="inp-label mb-12">Пункт выдачи ({pvzList.length})</label>
                  <div className="pvz-list">
                    {pvzList.map((pvz) => (
                      <button key={pvz.code} type="button" className={`pvz-item ${selectedPvz?.code === pvz.code ? 'pvz-item--active' : ''}`}
                        onClick={() => setSelectedPvz(pvz)}>
                        <div className="pvz-item__name">{pvz.name} <span className="t-small t-muted">{pvz.type}</span></div>
                        <div className="pvz-item__addr">{pvz.location.address}</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {deliveryType === 'pvz' && selectedCity && pvzList.length === 0 && (
                <p className="t-caption t-muted">Загрузка пунктов выдачи...</p>
              )}

              {deliveryType === 'door' && selectedCity && (
                <div className="inp-wrap">
                  <label className="inp-label">Адрес доставки</label>
                  <input className="inp" value={address} onChange={(e) => setAddress(e.target.value)} required placeholder="ул. Примерная, д. 1, кв. 10" />
                </div>
              )}
            </div>
          )}
        </div>

        {/* 3. Comment */}
        <div className="checkout-sec">
          <div className="checkout-sec__head">
            <span className="checkout-sec__num">3</span>
            <span className="checkout-sec__title">Комментарий</span>
          </div>
          <textarea className="inp" value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Пожелания к заказу (необязательно)" rows={3} />
        </div>

        {/* Order summary */}
        <div className="summary mb-16">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 14 }}>
            {items.map((item) => (
              <div key={`${item.productId}-${item.variantName || ''}`} style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <div style={{ width: 40, height: 40, borderRadius: 'var(--r-xs)', overflow: 'hidden', flexShrink: 0, position: 'relative', background: 'rgba(0,0,0,0.2)' }}>
                  {item.imageUrl && <Image src={item.imageUrl} alt="" fill sizes="40px" style={{ objectFit: 'cover' }} />}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="t-caption" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.title}</div>
                  <div className="t-small t-muted">{item.quantity} × {item.price.toLocaleString('ru-RU')} ₽</div>
                </div>
                <div className="t-caption" style={{ fontWeight: 600, whiteSpace: 'nowrap' }}>{(item.price * item.quantity).toLocaleString('ru-RU')} ₽</div>
              </div>
            ))}
          </div>
          <hr className="divider" />
          <div className="summary__row">
            <span className="summary__label">Товары</span>
            <span>{totalPrice.toLocaleString('ru-RU')} ₽</span>
          </div>
          <div className="summary__row">
            <span className="summary__label">Доставка</span>
            <span>{deliveryMethod === 'pickup' ? 'Бесплатно' : calcLoading ? '...' : selectedTariff ? `${Math.round(selectedTariff.delivery_sum).toLocaleString('ru-RU')} ₽` : '—'}</span>
          </div>
          <div className="summary__row summary__row--total">
            <span>Итого</span>
            <span>{orderTotal.toLocaleString('ru-RU')} ₽</span>
          </div>
        </div>

        <button type="submit" className={`btn btn--primary btn--lg btn--full ${loading ? 'btn--loading' : ''}`} disabled={!customer || loading}>
          {loading && <span className="btn__spinner" />}
          Оформить заказ
        </button>
      </form>
    </div>
  )
}
