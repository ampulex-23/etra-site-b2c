'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ThemeProvider } from '../themes/ThemeProvider'
import { PageWrapper } from '../components/PageWrapper'
import { Header } from '../components/Header'
import { Footer } from '../components/Footer'
import { Button } from '../components/ui/Button'
import { Input, Textarea } from '../components/ui/Input'
import { useCart } from '../cart/CartProvider'
import { useAuth } from '../auth/AuthProvider'

type DeliveryMethod = 'cdek' | 'pickup'

type CdekCity = { code: number; city: string; region: string }
type CdekPvz = {
  code: string
  name: string
  location: { address: string; address_full: string; latitude: number; longitude: number }
  work_time: string
  type: string
}
type CdekCalcResult = {
  delivery_sum: number
  period_min: number
  period_max: number
  total_sum: number
}

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])
  return debounced
}

export default function CheckoutPage() {
  const router = useRouter()
  const { customer, token } = useAuth()
  const { items, totalPrice, clearCart } = useCart()

  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>('cdek')
  const [name, setName] = useState(customer?.name || '')
  const [email, setEmail] = useState(customer?.email || '')
  const [phone, setPhone] = useState(customer?.phone || '')
  const [comment, setComment] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // CDEK state
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
  const cityRef = useRef<HTMLDivElement>(null)

  const debouncedCityQuery = useDebounce(cityQuery, 400)

  // Search cities
  useEffect(() => {
    if (!debouncedCityQuery || debouncedCityQuery.length < 2 || selectedCity) return
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch(`/api/cdek/cities?city=${encodeURIComponent(debouncedCityQuery)}&size=10`)
        if (!res.ok) return
        const data = await res.json()
        if (!cancelled) {
          setCitySuggestions(Array.isArray(data) ? data : [])
          setShowCitySuggestions(true)
        }
      } catch { /* ignore */ }
    })()
    return () => { cancelled = true }
  }, [debouncedCityQuery, selectedCity])

  // Load PVZ when city selected
  useEffect(() => {
    if (!selectedCity || deliveryType !== 'pvz') {
      setPvzList([])
      return
    }
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

  // Calculate tariff when city selected
  const calculateDelivery = useCallback(async () => {
    if (!selectedCity || deliveryMethod !== 'cdek') {
      setCdekCalc(null)
      return
    }
    setCalcLoading(true)
    try {
      const totalWeight = items.reduce((sum, i) => sum + 500 * i.quantity, 0)
      const tariffCode = deliveryType === 'pvz' ? 139 : 138
      const res = await fetch('/api/cdek/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cityCode: String(selectedCity.code),
          weight: totalWeight || 500,
          tariffCode,
        }),
      })
      if (!res.ok) {
        setCdekCalc(null)
        return
      }
      const data = await res.json()
      if (data.errors) {
        setCdekCalc(null)
      } else {
        setCdekCalc(data)
      }
    } catch {
      setCdekCalc(null)
    } finally {
      setCalcLoading(false)
    }
  }, [selectedCity, deliveryMethod, deliveryType, items])

  useEffect(() => { calculateDelivery() }, [calculateDelivery])

  // Close city suggestions on outside click
  useEffect(() => {
    const handle = (e: MouseEvent) => {
      if (cityRef.current && !cityRef.current.contains(e.target as Node)) {
        setShowCitySuggestions(false)
      }
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [])

  const deliveryCost = deliveryMethod === 'pickup' ? 0 : (cdekCalc?.total_sum || 0)
  const orderTotal = totalPrice + deliveryCost

  if (items.length === 0) {
    return (
      <ThemeProvider>
        <PageWrapper>
          <Header />
          <div className="checkout-page">
            <div className="container">
              <div className="ui-empty" style={{ marginTop: '80px' }}>
                <h3 className="ui-empty__title">Корзина пуста</h3>
                <p className="ui-empty__desc">Добавьте товары для оформления заказа</p>
                <Button href="/catalog" variant="primary" size="lg">
                  В каталог
                </Button>
              </div>
            </div>
          </div>
          <Footer />
        </PageWrapper>
      </ThemeProvider>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!customer || !token) {
      router.push('/auth/login?redirect=/checkout')
      return
    }

    if (deliveryMethod === 'cdek' && !selectedCity) {
      setError('Выберите город доставки')
      return
    }

    if (deliveryMethod === 'cdek' && deliveryType === 'pvz' && !selectedPvz) {
      setError('Выберите пункт выдачи')
      return
    }

    if (deliveryMethod === 'cdek' && deliveryType === 'door' && !address) {
      setError('Укажите адрес доставки')
      return
    }

    setLoading(true)
    try {
      const orderItems = items.map((i) => ({
        product: i.productId,
        variantName: i.variantName || undefined,
        quantity: i.quantity,
        price: i.price,
      }))

      const orderNumber = `ETR-${Date.now().toString(36).toUpperCase()}`

      let deliveryAddress = 'Самовывоз'
      if (deliveryMethod === 'cdek') {
        if (deliveryType === 'pvz' && selectedPvz) {
          deliveryAddress = `${selectedCity?.city}, ПВЗ: ${selectedPvz.name} — ${selectedPvz.location.address}`
        } else {
          deliveryAddress = `${selectedCity?.city}, ${address}`
        }
      }

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `JWT ${token}`,
        },
        body: JSON.stringify({
          orderNumber,
          customer: customer.id,
          items: orderItems,
          subtotal: totalPrice,
          deliveryCost,
          total: orderTotal,
          status: 'new',
          delivery: {
            method: deliveryMethod,
            address: deliveryAddress,
          },
          notes: comment || undefined,
          payment: { status: 'pending' },
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.errors?.[0]?.message || 'Ошибка при создании заказа')
      }

      clearCart()
      router.push('/account?tab=orders')
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Не удалось оформить заказ'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <ThemeProvider>
      <PageWrapper>
        <Header />
        <div className="checkout-page">
          <div className="container">
            <div className="page-header">
              <div className="ui-breadcrumbs">
                <Link href="/">Главная</Link>
                <span className="ui-breadcrumbs__sep">/</span>
                <Link href="/cart">Корзина</Link>
                <span className="ui-breadcrumbs__sep">/</span>
                <span>Оформление заказа</span>
              </div>
              <h1 className="page-header__title" style={{ marginTop: '16px' }}>Оформление заказа</h1>
            </div>

            {!customer && (
              <div className="checkout-section" style={{ marginBottom: '24px', textAlign: 'center' }}>
                <p style={{ color: 'var(--color-text-secondary)', margin: '0 0 16px' }}>
                  Войдите в аккаунт, чтобы оформить заказ
                </p>
                <Button href="/auth/login?redirect=/checkout" variant="primary">
                  Войти
                </Button>
                <span style={{ margin: '0 12px', color: 'var(--color-text-muted)' }}>или</span>
                <Button href="/auth/register?redirect=/checkout" variant="outline">
                  Зарегистрироваться
                </Button>
              </div>
            )}

            {error && (
              <div className="auth-error" style={{ marginBottom: '24px' }}>{error}</div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="checkout-layout">
                <div>
                  {/* Contact info */}
                  <div className="checkout-section">
                    <h2 className="checkout-section__title">
                      <span className="checkout-section__title-num">1</span>
                      Контактные данные
                    </h2>
                    <div className="checkout-form-grid">
                      <Input
                        label="Имя"
                        name="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        placeholder="Ваше имя"
                      />
                      <Input
                        label="Телефон"
                        name="phone"
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        required
                        placeholder="+7 (999) 999-99-99"
                      />
                      <div className="checkout-form-grid--full">
                        <Input
                          label="Email"
                          name="email"
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                          placeholder="your@email.com"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Delivery */}
                  <div className="checkout-section">
                    <h2 className="checkout-section__title">
                      <span className="checkout-section__title-num">2</span>
                      Способ доставки
                    </h2>
                    <div className="checkout-delivery-options">
                      <button
                        type="button"
                        className={`checkout-delivery-option ${deliveryMethod === 'cdek' ? 'checkout-delivery-option--active' : ''}`}
                        onClick={() => setDeliveryMethod('cdek')}
                      >
                        <div className="checkout-delivery-option__radio" />
                        <div className="checkout-delivery-option__info">
                          <div className="checkout-delivery-option__name">СДЭК</div>
                          <div className="checkout-delivery-option__desc">
                            {cdekCalc
                              ? `${cdekCalc.period_min}–${cdekCalc.period_max} дн.`
                              : 'Курьером или в пункт выдачи'}
                          </div>
                        </div>
                        <div className="checkout-delivery-option__price">
                          {calcLoading
                            ? '...'
                            : cdekCalc
                              ? `${Math.round(cdekCalc.total_sum).toLocaleString('ru-RU')} ₽`
                              : 'Рассчитать'}
                        </div>
                      </button>
                      <button
                        type="button"
                        className={`checkout-delivery-option ${deliveryMethod === 'pickup' ? 'checkout-delivery-option--active' : ''}`}
                        onClick={() => setDeliveryMethod('pickup')}
                      >
                        <div className="checkout-delivery-option__radio" />
                        <div className="checkout-delivery-option__info">
                          <div className="checkout-delivery-option__name">Самовывоз</div>
                          <div className="checkout-delivery-option__desc">Москва</div>
                        </div>
                        <div className="checkout-delivery-option__price">Бесплатно</div>
                      </button>
                    </div>

                    {deliveryMethod === 'cdek' && (
                      <div style={{ marginTop: '16px' }}>
                        {/* Delivery type toggle */}
                        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                          <button
                            type="button"
                            onClick={() => { setDeliveryType('pvz'); setSelectedPvz(null) }}
                            style={{
                              padding: '8px 16px',
                              borderRadius: 'var(--radius-sm)',
                              border: '1px solid var(--color-border)',
                              background: deliveryType === 'pvz' ? 'var(--color-primary)' : 'transparent',
                              color: deliveryType === 'pvz' ? '#fff' : 'var(--color-text-primary)',
                              fontSize: '13px',
                              fontWeight: 500,
                              cursor: 'pointer',
                            }}
                          >
                            В пункт выдачи
                          </button>
                          <button
                            type="button"
                            onClick={() => { setDeliveryType('door'); setSelectedPvz(null) }}
                            style={{
                              padding: '8px 16px',
                              borderRadius: 'var(--radius-sm)',
                              border: '1px solid var(--color-border)',
                              background: deliveryType === 'door' ? 'var(--color-primary)' : 'transparent',
                              color: deliveryType === 'door' ? '#fff' : 'var(--color-text-primary)',
                              fontSize: '13px',
                              fontWeight: 500,
                              cursor: 'pointer',
                            }}
                          >
                            Курьером до двери
                          </button>
                        </div>

                        {/* City search */}
                        <div ref={cityRef} style={{ position: 'relative', marginBottom: '16px' }}>
                          <Input
                            label="Город"
                            name="city"
                            value={selectedCity ? selectedCity.city : cityQuery}
                            onChange={(e) => {
                              setCityQuery(e.target.value)
                              setSelectedCity(null)
                              setCdekCalc(null)
                              setSelectedPvz(null)
                            }}
                            required
                            placeholder="Начните вводить название города"
                            autoComplete="off"
                          />
                          {showCitySuggestions && citySuggestions.length > 0 && !selectedCity && (
                            <div style={{
                              position: 'absolute',
                              top: '100%',
                              left: 0,
                              right: 0,
                              background: 'var(--color-bg-primary)',
                              border: '1px solid var(--color-border)',
                              borderRadius: 'var(--radius-sm)',
                              maxHeight: '200px',
                              overflowY: 'auto',
                              zIndex: 50,
                              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                            }}>
                              {citySuggestions.map((c) => (
                                <button
                                  key={c.code}
                                  type="button"
                                  onClick={() => {
                                    setSelectedCity(c)
                                    setCityQuery(c.city)
                                    setShowCitySuggestions(false)
                                    setSelectedPvz(null)
                                  }}
                                  style={{
                                    display: 'block',
                                    width: '100%',
                                    padding: '10px 12px',
                                    textAlign: 'left',
                                    border: 'none',
                                    background: 'none',
                                    cursor: 'pointer',
                                    fontSize: '13px',
                                    color: 'var(--color-text-primary)',
                                    borderBottom: '1px solid var(--color-border-light)',
                                  }}
                                >
                                  <strong>{c.city}</strong>
                                  <span style={{ color: 'var(--color-text-muted)', marginLeft: '8px' }}>{c.region}</span>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* PVZ list */}
                        {deliveryType === 'pvz' && selectedCity && pvzList.length > 0 && (
                          <div style={{ marginBottom: '16px' }}>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '8px', color: 'var(--color-text-secondary)' }}>
                              Пункт выдачи ({pvzList.length})
                            </label>
                            <div style={{
                              maxHeight: '240px',
                              overflowY: 'auto',
                              border: '1px solid var(--color-border)',
                              borderRadius: 'var(--radius-sm)',
                            }}>
                              {pvzList.map((pvz) => (
                                <button
                                  key={pvz.code}
                                  type="button"
                                  onClick={() => setSelectedPvz(pvz)}
                                  style={{
                                    display: 'block',
                                    width: '100%',
                                    padding: '10px 12px',
                                    textAlign: 'left',
                                    border: 'none',
                                    borderBottom: '1px solid var(--color-border-light)',
                                    background: selectedPvz?.code === pvz.code ? 'var(--color-bg-accent)' : 'none',
                                    cursor: 'pointer',
                                    fontSize: '13px',
                                  }}
                                >
                                  <div style={{ fontWeight: 500, color: 'var(--color-text-primary)' }}>
                                    {pvz.name}
                                    <span style={{ fontWeight: 400, color: 'var(--color-text-muted)', marginLeft: '6px', fontSize: '11px' }}>
                                      {pvz.type}
                                    </span>
                                  </div>
                                  <div style={{ color: 'var(--color-text-secondary)', fontSize: '12px', marginTop: '2px' }}>
                                    {pvz.location.address}
                                  </div>
                                  <div style={{ color: 'var(--color-text-muted)', fontSize: '11px', marginTop: '2px' }}>
                                    {pvz.work_time}
                                  </div>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        {deliveryType === 'pvz' && selectedCity && pvzList.length === 0 && (
                          <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginBottom: '16px' }}>
                            Загрузка пунктов выдачи...
                          </p>
                        )}

                        {/* Door-to-door address */}
                        {deliveryType === 'door' && selectedCity && (
                          <div className="checkout-form-grid">
                            <div className="checkout-form-grid--full">
                              <Input
                                label="Адрес доставки"
                                name="address"
                                value={address}
                                onChange={(e) => setAddress(e.target.value)}
                                required
                                placeholder="ул. Примерная, д. 1, кв. 10"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Comment */}
                  <div className="checkout-section">
                    <h2 className="checkout-section__title">
                      <span className="checkout-section__title-num">3</span>
                      Комментарий
                    </h2>
                    <Textarea
                      name="comment"
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder="Пожелания к заказу (необязательно)"
                    />
                  </div>
                </div>

                {/* Summary sidebar */}
                <div>
                  <div className="cart-summary">
                    <h2 className="cart-summary__title">Ваш заказ</h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px' }}>
                      {items.map((item) => (
                        <div
                          key={`${item.productId}-${item.variantName || ''}`}
                          style={{ display: 'flex', gap: '12px', alignItems: 'center' }}
                        >
                          <div style={{ width: '48px', height: '48px', borderRadius: 'var(--radius-sm)', overflow: 'hidden', flexShrink: 0, position: 'relative', background: 'var(--color-bg-secondary)' }}>
                            {item.imageUrl && (
                              <Image src={item.imageUrl} alt="" fill sizes="48px" style={{ objectFit: 'cover' }} />
                            )}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: '13px', color: 'var(--color-text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {item.title}
                            </div>
                            <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                              {item.quantity} × {item.price.toLocaleString('ru-RU')} ₽
                            </div>
                          </div>
                          <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text-primary)', whiteSpace: 'nowrap' }}>
                            {(item.price * item.quantity).toLocaleString('ru-RU')} ₽
                          </div>
                        </div>
                      ))}
                    </div>

                    <hr className="ui-divider" />

                    <div className="cart-summary__row">
                      <span className="cart-summary__row-label">Товары</span>
                      <span className="cart-summary__row-value">{totalPrice.toLocaleString('ru-RU')} ₽</span>
                    </div>
                    <div className="cart-summary__row">
                      <span className="cart-summary__row-label">Доставка</span>
                      <span className="cart-summary__row-value">
                        {deliveryMethod === 'pickup'
                          ? 'Бесплатно'
                          : calcLoading
                            ? '...'
                            : cdekCalc
                              ? `${Math.round(cdekCalc.total_sum).toLocaleString('ru-RU')} ₽`
                              : '—'}
                      </span>
                    </div>
                    {cdekCalc && deliveryMethod === 'cdek' && (
                      <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginBottom: '8px' }}>
                        Срок: {cdekCalc.period_min}–{cdekCalc.period_max} рабочих дней
                      </div>
                    )}
                    <div className="cart-summary__total">
                      <span>Итого</span>
                      <span>{orderTotal.toLocaleString('ru-RU')} ₽</span>
                    </div>
                    <div className="cart-summary__actions">
                      <Button
                        type="submit"
                        variant="primary"
                        size="lg"
                        fullWidth
                        loading={loading}
                        disabled={!customer}
                      >
                        Оформить заказ
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>
        <Footer />
      </PageWrapper>
    </ThemeProvider>
  )
}
