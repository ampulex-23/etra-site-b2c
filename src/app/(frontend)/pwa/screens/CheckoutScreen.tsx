'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCart } from '../../cart/CartProvider'
import { useAuth } from '../../auth/AuthProvider'
import { CreditCard, Banknote, Loader2, Tag, MapPin, X } from 'lucide-react'

type DeliveryMethod = 'cdek' | 'pickup'
type DeliveryType = 'pvz' | 'door'
type PaymentMethod = 'online' | 'cash'
type CdekCity = { code: number; city: string; region: string }
type CdekPvz = {
  code: string; name: string;
  location: { address: string; address_full: string; latitude: number; longitude: number }
  work_time: string; type: string
}
type CdekCalcResult = {
  delivery_sum: number
  total_sum?: number
  period_min: number
  period_max: number
  tariff_code?: number
  fell_back?: boolean
  box?: {
    label: string
    weightKg: number
    lengthCm: number
    widthCm: number
    heightCm: number
    cdekCartonCode: string | null
  }
  services?: Array<{ code: string; sum?: number; total_sum?: number }>
  error?: string
}

interface PromoCode {
  code: string
  discountType: 'percent' | 'fixed'
  discountValue: number
  minOrderAmount?: number
}

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => { const t = setTimeout(() => setDebounced(value), delay); return () => clearTimeout(t) }, [value, delay])
  return debounced
}

declare global {
  interface Window {
    ymaps?: any
  }
}

export function CheckoutScreen() {
  const router = useRouter()
  const { customer, token } = useAuth()
  const { items, totalPrice, clearCart } = useCart()

  // Settings from admin
  const [settings, setSettings] = useState({ delivery: { pickupEnabled: true, cdekEnabled: true }, payment: { onlineEnabled: true, cashEnabled: false } })
  
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>('cdek')
  const [deliveryType, setDeliveryType] = useState<DeliveryType>('pvz')
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('online')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [comment, setComment] = useState('')
  const [profileLoaded, setProfileLoaded] = useState(false)
  const [paymentLoading, setPaymentLoading] = useState(false)
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
  const [cdekCalc, setCdekCalc] = useState<CdekCalcResult | null>(null)
  const [calcLoading, setCalcLoading] = useState(false)
  const [calcError, setCalcError] = useState('')
  const cityRef = useRef<HTMLDivElement>(null)
  const debouncedCityQuery = useDebounce(cityQuery, 400)

  // Map state
  const [showMap, setShowMap] = useState(false)
  const [mapLoaded, setMapLoaded] = useState(false)
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)

  // Promo code state
  const [promoCode, setPromoCode] = useState('')
  const [appliedPromo, setAppliedPromo] = useState<PromoCode | null>(null)
  const [promoLoading, setPromoLoading] = useState(false)
  const [promoError, setPromoError] = useState('')
  const [showPromoInput, setShowPromoInput] = useState(false)

  // Top-up state (add items to an existing unshipped order)
  interface TopUpTarget {
    id: string | number
    orderNumber: string
    total: number
    createdAt: string
    itemsCount: number
    delivery: { method: string; address: string }
  }
  const [topupTarget, setTopupTarget] = useState<TopUpTarget | null>(null)
  const [useTopup, setUseTopup] = useState(false)

  // Реферальная скидка теперь применяется через промокод партнёра на сервере в хуке
  // при создании заказа (customerAfterOrderCreate), не на этапе чекаута.

  // Load settings from admin
  useEffect(() => {
    fetch('/api/settings')
      .then(res => res.json())
      .then(data => {
        setSettings(data)
        // Auto-select first available delivery method
        if (!data.delivery.cdekEnabled && data.delivery.pickupEnabled) {
          setDeliveryMethod('pickup')
        }
        // Auto-select first available payment method
        if (!data.payment.onlineEnabled && data.payment.cashEnabled) {
          setPaymentMethod('cash')
        }
      })
      .catch(err => console.error('Failed to load settings:', err))
  }, [])

  // Sync form fields with customer data when it loads
  useEffect(() => {
    if (customer && !profileLoaded) {
      setName(customer.name || '')
      setEmail(customer.email || '')
      setPhone(customer.phone || '')
      setProfileLoaded(true)
    }
  }, [customer, profileLoaded])

  // Load eligible top-up target (an existing unshipped order to append to)
  useEffect(() => {
    if (!customer || !token) return
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch('/api/shop-orders/eligible-top-up-target', {
          headers: { Authorization: `JWT ${token}` },
        })
        if (!res.ok) return
        const data = await res.json()
        if (cancelled) return
        if (data?.target) {
          setTopupTarget(data.target)
          // Auto-enable if the user arrived via ?topup=<id> OR via sessionStorage
          if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search)
            const queryTopup = params.get('topup')
            const storedTopup = sessionStorage.getItem('checkout_topup_order_id')
            const intendedTopup = queryTopup || storedTopup
            if (intendedTopup && String(intendedTopup) === String(data.target.id)) {
              setUseTopup(true)
            }
          }
        }
      } catch {
        /* ignore — optional feature */
      }
    })()
    return () => {
      cancelled = true
    }
  }, [customer, token])

  // City search
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

  // Load PVZ list
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

  // Calculate delivery (informational only - not included in payment)
  const calculateDelivery = useCallback(async () => {
    if (!selectedCity || deliveryMethod !== 'cdek') { 
      setCdekCalc(null)
      setCalcError('')
      return 
    }
    setCalcLoading(true)
    setCalcError('')
    try {
      // Each cart item line = one bottle SKU. Bottle count drives the box
      // selection in /api/cdek/calculate per src/lib/cdek-packaging.ts.
      const bottleCount = items.reduce((sum, i) => sum + i.quantity, 0)
      // Declared value for insurance = subtotal minus current discount.
      // (Computed inline to avoid depending on `promoDiscount` which is
      // derived further down in the component.)
      const promoAmount = appliedPromo
        ? appliedPromo.discountType === 'percent'
          ? Math.round(totalPrice * appliedPromo.discountValue / 100)
          : appliedPromo.discountValue
        : 0
      const declaredValue = Math.max(0, totalPrice - promoAmount)
      const res = await fetch('/api/cdek/calculate', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          cityCode: String(selectedCity.code), 
          bottleCount,
          declaredValue,
          destination: deliveryType === 'door' ? 'courier' : 'pickup',
        }),
      })
      const data = await res.json()
      if (!res.ok || data.error) { 
        setCdekCalc(null)
        setCalcError(data.error || 'Не удалось рассчитать доставку')
        return 
      }
      setCdekCalc(data)
    } catch { 
      setCdekCalc(null)
      setCalcError('Ошибка расчёта доставки') 
    } finally { setCalcLoading(false) }
  }, [selectedCity, deliveryMethod, deliveryType, items, totalPrice, appliedPromo])

  useEffect(() => { calculateDelivery() }, [calculateDelivery])

  // Close city dropdown on outside click
  useEffect(() => {
    const handle = (e: MouseEvent) => {
      if (cityRef.current && !cityRef.current.contains(e.target as Node)) setShowCitySuggestions(false)
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [])

  // Apply promo code
  const applyPromoCode = async () => {
    if (!promoCode.trim()) return
    setPromoLoading(true)
    setPromoError('')
    try {
      const res = await fetch(`/api/promo/validate?code=${encodeURIComponent(promoCode.trim())}&amount=${totalPrice}`)
      const data = await res.json()
      if (!res.ok || data.error) {
        setPromoError(data.error || 'Промокод недействителен')
        setAppliedPromo(null)
        return
      }
      setAppliedPromo(data)
      setShowPromoInput(false)
    } catch {
      setPromoError('Ошибка проверки промокода')
    } finally {
      setPromoLoading(false)
    }
  }

  const removePromoCode = () => {
    setAppliedPromo(null)
    setPromoCode('')
    setPromoError('')
  }

  // Load Yandex Maps
  useEffect(() => {
    if (!showMap || mapLoaded) return
    
    const existingScript = document.querySelector('script[src*="api-maps.yandex.ru"]')
    if (existingScript) {
      if (window.ymaps) {
        window.ymaps.ready(() => setMapLoaded(true))
      }
      return
    }
    
    const script = document.createElement('script')
    const apiKey = process.env.NEXT_PUBLIC_YANDEX_MAPS_API_KEY || ''
    script.src = `https://api-maps.yandex.ru/2.1/?apikey=${apiKey}&lang=ru_RU`
    script.async = true
    script.onload = () => {
      window.ymaps?.ready(() => setMapLoaded(true))
    }
    document.head.appendChild(script)
  }, [showMap, mapLoaded])

  // Initialize map when loaded
  useEffect(() => {
    if (!mapLoaded || !showMap || !mapRef.current || mapInstanceRef.current) return
    
    const ymaps = window.ymaps
    if (!ymaps) return

    const centerLat = pvzList.length > 0 ? pvzList[0].location.latitude : 55.76
    const centerLng = pvzList.length > 0 ? pvzList[0].location.longitude : 37.64

    const map = new ymaps.Map(mapRef.current, {
      center: [centerLat, centerLng],
      zoom: 12,
      controls: ['zoomControl', 'searchControl']
    })
    
    mapInstanceRef.current = map

    // Add PVZ markers if in PVZ mode
    if (deliveryType === 'pvz' && pvzList.length > 0) {
      const clusterer = new ymaps.Clusterer({
        preset: 'islands#greenClusterIcons',
        groupByCoordinates: false
      })

      const placemarks = pvzList.map(pvz => {
        const placemark = new ymaps.Placemark(
          [pvz.location.latitude, pvz.location.longitude],
          {
            balloonContentHeader: pvz.name,
            balloonContentBody: `<p>${pvz.location.address}</p><p>${pvz.work_time}</p>`,
            hintContent: pvz.name
          },
          { preset: 'islands#greenDotIcon' }
        )
        
        placemark.events.add('click', () => {
          setSelectedPvz(pvz)
          setShowMap(false)
        })
        
        return placemark
      })

      clusterer.add(placemarks)
      map.geoObjects.add(clusterer)
      
      if (placemarks.length > 0) {
        map.setBounds(clusterer.getBounds(), { checkZoomRange: true, zoomMargin: 40 })
      }
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.destroy()
        mapInstanceRef.current = null
      }
    }
  }, [mapLoaded, showMap, deliveryType, pvzList])

  // Calculate discounts
  const promoDiscount = appliedPromo 
    ? appliedPromo.discountType === 'percent' 
      ? Math.round(totalPrice * appliedPromo.discountValue / 100)
      : appliedPromo.discountValue
    : 0
  
  const totalDiscount = promoDiscount
  
  // Delivery is NOT included in payment - customer pays on receipt
  const orderTotal = totalPrice - totalDiscount

  // Estimated delivery cost (informational only)
  const estimatedDeliveryCost = deliveryMethod === 'pickup' ? 0 : (cdekCalc?.delivery_sum || 0)

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

    // --- Top-up branch: add items to the existing open order ---
    if (useTopup && topupTarget) {
      setLoading(true)
      try {
        const orderItems = items.map((i) => ({
          product: i.productId,
          variantName: i.variantName || undefined,
          quantity: i.quantity,
          price: i.price,
        }))
        const res = await fetch('/api/shop-orders/topup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `JWT ${token}` },
          body: JSON.stringify({
            targetOrderId: topupTarget.id,
            items: orderItems,
            deltaDiscount: totalDiscount,
            promoCodeApplied: appliedPromo?.code || undefined,
            paymentMethod: paymentMethod === 'online' ? 'tinkoff' : 'cash',
          }),
        })
        const data = await res.json()
        if (!res.ok) {
          throw new Error(data?.errors?.[0]?.message || 'Не удалось докомплектовать заказ')
        }
        const deltaAmount = Number(data?.delta?.total || orderTotal)

        // Clear the persisted top-up intent once it has been consumed
        if (typeof window !== 'undefined') {
          sessionStorage.removeItem('checkout_topup_order_id')
        }

        if (paymentMethod === 'online') {
          setPaymentLoading(true)
          try {
            const paymentRes = await fetch('/api/payments/init', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                amount: deltaAmount,
                orderId: `TOPUP-${topupTarget.orderNumber}-${Date.now()}`,
                paymentId: data.paymentId,
                description: `Докомплектация заказа ${topupTarget.orderNumber}`,
                customerEmail: email,
                customerPhone: phone,
                items: items.map((i) => ({
                  name: i.title,
                  price: Math.round(i.price * (1 - (totalDiscount / Math.max(1, totalPrice)))),
                  quantity: i.quantity,
                  tax: 'none',
                })),
              }),
            })
            const paymentData = await paymentRes.json()
            if (paymentData.error) throw new Error(paymentData.message || 'Ошибка инициализации платежа')
            clearCart()
            window.location.href = paymentData.paymentUrl
            return
          } catch (payErr) {
            setPaymentLoading(false)
            setError(payErr instanceof Error ? payErr.message : 'Ошибка оплаты')
            return
          }
        }

        clearCart()
        router.push(`/account?order=${topupTarget.orderNumber}&topup=1`)
        return
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Не удалось докомплектовать заказ')
        return
      } finally {
        setLoading(false)
      }
    }

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
      
      // Create order - delivery cost is NOT included in total (paid on receipt)
      const res = await fetch('/api/shop-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `JWT ${token}` },
        body: JSON.stringify({
          orderNumber, 
          customer: customer.id, 
          items: orderItems, 
          subtotal: totalPrice, 
          deliveryCost: 0, // Delivery paid on receipt
          estimatedDeliveryCost: estimatedDeliveryCost, // For reference
          discount: totalDiscount,
          promoCode: appliedPromo?.code || undefined,
          promoCodeApplied: appliedPromo?.code || undefined,
          total: orderTotal, 
          status: 'new',
          delivery: { 
            method: deliveryMethod, 
            type: deliveryType,
            address: deliveryAddress,
            cityCode: selectedCity?.code,
            pvzCode: selectedPvz?.code,
          },
          notes: comment || undefined, 
          payment: { 
            method: paymentMethod === 'online' ? 'tinkoff' : 'cash',
            status: 'pending' 
          },
        }),
      })
      if (!res.ok) { const data = await res.json(); throw new Error(data.errors?.[0]?.message || 'Ошибка') }
      
      await res.json()
      
      // If online payment selected, redirect to T-Bank
      if (paymentMethod === 'online') {
        setPaymentLoading(true)
        try {
          const paymentRes = await fetch('/api/payments/init', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              amount: orderTotal,
              orderId: orderNumber,
              description: `Заказ ${orderNumber}`,
              customerEmail: email,
              customerPhone: phone,
              items: items.map(i => ({
                name: i.title,
                price: Math.round(i.price * (1 - totalDiscount / totalPrice)),
                quantity: i.quantity,
                tax: 'none'
              }))
            })
          })
          
          const paymentData = await paymentRes.json()
          
          if (paymentData.error) {
            throw new Error(paymentData.message || 'Ошибка инициализации платежа')
          }
          
          clearCart()
          window.location.href = paymentData.paymentUrl
          return
        } catch (payErr) {
          setPaymentLoading(false)
          setError(payErr instanceof Error ? payErr.message : 'Ошибка оплаты')
          return
        }
      }
      
      // Cash payment - just redirect to account
      clearCart()
      router.push('/account?order=' + orderNumber)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Не удалось оформить заказ')
    } finally { setLoading(false) }
  }

  return (
    <div className="pwa-screen animate-in">
      <h1 className="t-h2 mb-16">{useTopup ? 'Докомплектация заказа' : 'Оформление заказа'}</h1>

      {!customer && (
        <div className="glass" style={{ padding: 16, textAlign: 'center', marginBottom: 16 }}>
          <p className="t-caption t-sec mb-12">Войдите, чтобы оформить заказ</p>
          <Link href="/auth?redirect=/checkout" className="btn btn--primary btn--sm">Войти</Link>
        </div>
      )}

      {/* Top-up banner: offer to append items to an existing unshipped order */}
      {customer && topupTarget && (
        <div
          className="glass"
          style={{
            padding: 14,
            marginBottom: 16,
            borderRadius: 'var(--r-md)',
            border: useTopup ? '2px solid var(--c-primary)' : '1px solid var(--c-border)',
            background: useTopup ? 'rgba(139, 92, 246, 0.08)' : undefined,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
            <div style={{ fontSize: 24, lineHeight: 1 }} aria-hidden>📦</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="t-caption" style={{ fontWeight: 600, marginBottom: 4 }}>
                У вас есть заказ {topupTarget.orderNumber} на сборке
              </div>
              <div className="t-small t-muted" style={{ marginBottom: 8 }}>
                Можно добавить товары к нему — доставка будет общая, оплатите только добавленное.
              </div>
              <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={useTopup}
                  onChange={(e) => setUseTopup(e.target.checked)}
                  style={{ width: 16, height: 16 }}
                />
                <span className="t-caption" style={{ fontWeight: useTopup ? 600 : 400 }}>
                  {useTopup
                    ? `Добавить к заказу ${topupTarget.orderNumber}`
                    : `Добавить к заказу ${topupTarget.orderNumber}?`}
                </span>
              </label>
              {useTopup && (
                <div
                  className="t-small"
                  style={{
                    marginTop: 8,
                    padding: '6px 10px',
                    background: 'rgba(0,0,0,0.15)',
                    borderRadius: 'var(--r-xs)',
                    opacity: 0.85,
                  }}
                >
                  Адрес и способ доставки наследуются:{' '}
                  <strong>{topupTarget.delivery.method === 'pickup' ? 'Самовывоз' : 'СДЭК'}</strong>
                  {topupTarget.delivery.address ? ` · ${topupTarget.delivery.address}` : ''}
                </div>
              )}
            </div>
          </div>
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

        {/* 2. Delivery (hidden when topping up — delivery inherits from target order) */}
        {!useTopup && (
        <div className="checkout-sec">
          <div className="checkout-sec__head">
            <span className="checkout-sec__num">2</span>
            <span className="checkout-sec__title">Доставка</span>
          </div>

          {settings.delivery.cdekEnabled && (
            <button type="button" className={`del-option ${deliveryMethod === 'cdek' ? 'del-option--active' : ''}`} onClick={() => setDeliveryMethod('cdek')}>
              <div className="del-option__radio" />
              <div className="del-option__info">
                <div className="del-option__name">СДЭК</div>
                <div className="del-option__desc">{cdekCalc ? `${cdekCalc.period_min}–${cdekCalc.period_max} дн.` : 'Курьером или в ПВЗ'}</div>
              </div>
              <div className="del-option__price">
                {calcLoading
                  ? '...'
                  : cdekCalc
                    ? `≈ ${Math.round(cdekCalc.total_sum ?? cdekCalc.delivery_sum).toLocaleString('ru-RU')} ₽`
                    : calcError
                      ? '—'
                      : 'Рассчитать'}
              </div>
            </button>
          )}

          {settings.delivery.pickupEnabled && (
            <button type="button" className={`del-option ${deliveryMethod === 'pickup' ? 'del-option--active' : ''}`} onClick={() => setDeliveryMethod('pickup')}>
              <div className="del-option__radio" />
              <div className="del-option__info">
                <div className="del-option__name">Самовывоз</div>
                <div className="del-option__desc">Москва</div>
              </div>
              <div className="del-option__price" style={{ color: 'var(--c-success)' }}>Бесплатно</div>
            </button>
          )}

          {deliveryMethod === 'cdek' && (
            <div className="mt-16 stack">
              {/* Delivery type: PVZ or Door */}
              <div>
                <label className="inp-label mb-8">Способ получения</label>
                <div className="pill-toggle">
                  <button type="button" className={`pill-toggle__item ${deliveryType === 'pvz' ? 'pill-toggle__item--active' : ''}`}
                    onClick={() => { setDeliveryType('pvz'); setSelectedPvz(null) }}>
                    В пункт выдачи
                  </button>
                  <button type="button" className={`pill-toggle__item ${deliveryType === 'door' ? 'pill-toggle__item--active' : ''}`}
                    onClick={() => { setDeliveryType('door'); setSelectedPvz(null) }}>
                    До двери
                  </button>
                </div>
              </div>

              {calcError && (
                <div className="auth-card__error" style={{ marginBottom: 12 }}>
                  {calcError}
                  <div className="t-small" style={{ marginTop: 4, opacity: 0.8 }}>Попробуйте выбрать другой город</div>
                </div>
              )}

              {/* City search */}
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

              {/* PVZ selection */}
              {deliveryType === 'pvz' && selectedCity && pvzList.length > 0 && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <label className="inp-label">Пункт выдачи ({pvzList.length})</label>
                    <button type="button" className="btn btn--sm btn--outline" onClick={() => setShowMap(true)}
                      style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <MapPin size={14} /> На карте
                    </button>
                  </div>
                  
                  {selectedPvz && (
                    <div className="pvz-selected glass" style={{ padding: 12, marginBottom: 12 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <div className="t-caption" style={{ fontWeight: 600 }}>{selectedPvz.name}</div>
                          <div className="t-small t-muted">{selectedPvz.location.address}</div>
                          <div className="t-small t-muted">{selectedPvz.work_time}</div>
                        </div>
                        <button type="button" onClick={() => setSelectedPvz(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
                          <X size={16} />
                        </button>
                      </div>
                    </div>
                  )}
                  
                  {!selectedPvz && (
                    <div className="pvz-list glass">
                      {pvzList.slice(0, 5).map((pvz) => (
                        <button key={pvz.code} type="button" className="pvz-item"
                          onClick={() => setSelectedPvz(pvz)}>
                          <div className="pvz-item__name">{pvz.name} <span className="t-small t-muted">{pvz.type}</span></div>
                          <div className="pvz-item__addr">{pvz.location.address}</div>
                        </button>
                      ))}
                      {pvzList.length > 5 && (
                        <button type="button" className="btn btn--sm btn--outline btn--full" onClick={() => setShowMap(true)}>
                          Показать все {pvzList.length} пунктов на карте
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}

              {deliveryType === 'pvz' && selectedCity && pvzList.length === 0 && (
                <p className="t-caption t-muted">Загрузка пунктов выдачи...</p>
              )}

              {/* Door delivery address */}
              {deliveryType === 'door' && selectedCity && (
                <div className="inp-wrap">
                  <label className="inp-label">Адрес доставки</label>
                  <input className="inp" value={address} onChange={(e) => setAddress(e.target.value)} required placeholder="ул. Примерная, д. 1, кв. 10" />
                </div>
              )}

              {/* Delivery info notice */}
              {selectedCity && cdekCalc && (
                <div className="glass" style={{ padding: 12, background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
                  <p className="t-small" style={{ color: 'var(--c-primary)', margin: 0, marginBottom: 4 }}>
                    ℹ️ Стоимость доставки ≈{' '}
                    <strong>
                      {Math.round(cdekCalc.total_sum ?? cdekCalc.delivery_sum).toLocaleString('ru-RU')} ₽
                    </strong>{' '}
                    (включая страхование) — оплачивается <strong>при получении</strong>.
                  </p>
                  {cdekCalc.box && (
                    <p className="t-small t-muted" style={{ margin: 0, opacity: 0.8 }}>
                      Упаковка: коробка {cdekCalc.box.label}, {cdekCalc.box.weightKg} кг,{' '}
                      {cdekCalc.box.lengthCm}×{cdekCalc.box.widthCm}×{cdekCalc.box.heightCm} см.
                      Срок доставки: {cdekCalc.period_min}–{cdekCalc.period_max} дн.
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
        )}

        {/* 3. Discounts */}
        <div className="checkout-sec">
          <div className="checkout-sec__head">
            <span className="checkout-sec__num">3</span>
            <span className="checkout-sec__title">Скидки</span>
          </div>

          {/* Applied promo code */}
          {appliedPromo && (
            <div className="discount-badge" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 12, background: 'rgba(139, 92, 246, 0.1)', borderRadius: 'var(--r-sm)', marginBottom: 12 }}>
              <Tag size={20} style={{ color: 'var(--c-primary)' }} />
              <div style={{ flex: 1 }}>
                <div className="t-caption" style={{ fontWeight: 600 }}>Промокод {appliedPromo.code}</div>
                <div className="t-small t-muted">
                  {appliedPromo.discountType === 'percent' ? `${appliedPromo.discountValue}% скидка` : `${appliedPromo.discountValue} ₽ скидка`}
                </div>
              </div>
              <button type="button" onClick={removePromoCode} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
                <X size={16} />
              </button>
            </div>
          )}

          {/* Promo code input */}
          {!appliedPromo && (
            <>
              {showPromoInput ? (
                <div style={{ display: 'flex', gap: 8 }}>
                  <input 
                    className="inp" 
                    value={promoCode} 
                    onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                    placeholder="Введите промокод"
                    style={{ flex: 1 }}
                  />
                  <button 
                    type="button" 
                    className={`btn btn--primary btn--sm ${promoLoading ? 'btn--loading' : ''}`}
                    onClick={applyPromoCode}
                    disabled={promoLoading || !promoCode.trim()}
                  >
                    {promoLoading ? <Loader2 size={16} className="btn__spinner" /> : 'Применить'}
                  </button>
                </div>
              ) : (
                <button type="button" className="btn btn--outline btn--sm" onClick={() => setShowPromoInput(true)}
                  style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Tag size={14} /> У меня есть промокод
                </button>
              )}
              {promoError && <p className="t-small" style={{ color: 'var(--c-danger)', marginTop: 8 }}>{promoError}</p>}
            </>
          )}
        </div>

        {/* 4. Payment */}
        <div className="checkout-sec">
          <div className="checkout-sec__head">
            <span className="checkout-sec__num">4</span>
            <span className="checkout-sec__title">Способ оплаты</span>
          </div>

          {settings.payment.onlineEnabled && (
            <button type="button" className={`del-option ${paymentMethod === 'online' ? 'del-option--active' : ''}`} onClick={() => setPaymentMethod('online')}>
              <div className="del-option__radio" />
              <div className="del-option__info">
                <div className="del-option__name" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <CreditCard size={18} />
                  Онлайн оплата
                </div>
                <div className="del-option__desc">Банковская карта, T-Pay, СБП</div>
              </div>
              <div className="del-option__price" style={{ color: 'var(--c-primary)' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                </svg>
              </div>
            </button>
          )}

          {settings.payment.cashEnabled && (
            <button type="button" className={`del-option ${paymentMethod === 'cash' ? 'del-option--active' : ''}`} onClick={() => setPaymentMethod('cash')}>
              <div className="del-option__radio" />
              <div className="del-option__info">
                <div className="del-option__name" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Banknote size={18} />
                  При получении
                </div>
                <div className="del-option__desc">Наличными или картой курьеру</div>
              </div>
            </button>
          )}
        </div>

        {/* 5. Comment */}
        <div className="checkout-sec">
          <div className="checkout-sec__head">
            <span className="checkout-sec__num">5</span>
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
          
          {promoDiscount > 0 && (
            <div className="summary__row" style={{ color: 'var(--c-success)' }}>
              <span className="summary__label">Промокод {appliedPromo?.code}</span>
              <span>−{promoDiscount.toLocaleString('ru-RU')} ₽</span>
            </div>
          )}
          
          
          <div className="summary__row">
            <span className="summary__label">Доставка</span>
            <span className="t-muted">
              {useTopup
                ? `Включена в заказ ${topupTarget?.orderNumber}`
                : deliveryMethod === 'pickup'
                  ? 'Бесплатно'
                  : calcLoading
                    ? '...'
                    : cdekCalc
                      ? `≈ ${Math.round(cdekCalc.total_sum ?? cdekCalc.delivery_sum).toLocaleString('ru-RU')} ₽ (при получении)`
                      : '—'}
            </span>
          </div>
          
          <div className="summary__row summary__row--total">
            <span>{useTopup ? 'К доплате' : 'К оплате'}</span>
            <span>{orderTotal.toLocaleString('ru-RU')} ₽</span>
          </div>
        </div>

        <button 
          type="submit" 
          className={`btn btn--primary btn--lg btn--full ${loading || paymentLoading ? 'btn--loading' : ''}`} 
          disabled={!customer || loading || paymentLoading}
        >
          {(loading || paymentLoading) && <Loader2 size={20} className="btn__spinner" style={{ animation: 'spin 1s linear infinite' }} />}
          {paymentLoading 
            ? 'Переход к оплате...' 
            : useTopup
              ? paymentMethod === 'online'
                ? `Доплатить ${orderTotal.toLocaleString('ru-RU')} ₽`
                : `Добавить к заказу ${topupTarget?.orderNumber ?? ''}`
              : paymentMethod === 'online' 
                ? `Оплатить ${orderTotal.toLocaleString('ru-RU')} ₽` 
                : 'Оформить заказ'
          }
        </button>
      </form>

      {/* Map Modal */}
      {showMap && (
        <div className="modal-overlay" onClick={() => setShowMap(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: 600, height: '80vh', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottom: '1px solid var(--c-border)' }}>
              <h3 className="t-h3" style={{ margin: 0 }}>Выберите пункт выдачи</h3>
              <button type="button" onClick={() => setShowMap(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
                <X size={24} />
              </button>
            </div>
            <div ref={mapRef} style={{ flex: 1, minHeight: 300 }}>
              {!mapLoaded && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                  <Loader2 size={32} className="btn__spinner" style={{ animation: 'spin 1s linear infinite' }} />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
