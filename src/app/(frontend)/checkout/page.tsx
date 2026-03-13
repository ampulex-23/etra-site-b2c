'use client'

import React, { useState } from 'react'
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

type DeliveryMethod = 'cdek' | 'russian_post' | 'pickup'

const deliveryOptions: { value: DeliveryMethod; label: string; desc: string; price: string }[] = [
  { value: 'cdek', label: 'СДЭК', desc: 'Доставка 2–5 дней', price: 'от 350 ₽' },
  { value: 'russian_post', label: 'Почта России', desc: 'Доставка 5–14 дней', price: 'от 250 ₽' },
  { value: 'pickup', label: 'Самовывоз', desc: 'Москва, ул. Примерная, 1', price: 'Бесплатно' },
]

export default function CheckoutPage() {
  const router = useRouter()
  const { customer, token } = useAuth()
  const { items, totalPrice, clearCart } = useCart()

  const [delivery, setDelivery] = useState<DeliveryMethod>('cdek')
  const [name, setName] = useState(customer?.name || '')
  const [email, setEmail] = useState(customer?.email || '')
  const [phone, setPhone] = useState(customer?.phone || '')
  const [city, setCity] = useState('')
  const [address, setAddress] = useState('')
  const [comment, setComment] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

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

    setLoading(true)
    try {
      const orderItems = items.map((i) => ({
        product: i.productId,
        variantName: i.variantName || undefined,
        quantity: i.quantity,
        price: i.price,
      }))

      const orderNumber = `ETR-${Date.now().toString(36).toUpperCase()}`

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
          total: totalPrice,
          status: 'new',
          delivery: {
            method: delivery,
            address: delivery !== 'pickup' ? `${city}, ${address}` : 'Самовывоз',
          },
          notes: comment || undefined,
          payment: {
            status: 'pending',
          },
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
                      {deliveryOptions.map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          className={`checkout-delivery-option ${delivery === opt.value ? 'checkout-delivery-option--active' : ''}`}
                          onClick={() => setDelivery(opt.value)}
                        >
                          <div className="checkout-delivery-option__radio" />
                          <div className="checkout-delivery-option__info">
                            <div className="checkout-delivery-option__name">{opt.label}</div>
                            <div className="checkout-delivery-option__desc">{opt.desc}</div>
                          </div>
                          <div className="checkout-delivery-option__price">{opt.price}</div>
                        </button>
                      ))}
                    </div>
                    {delivery !== 'pickup' && (
                      <div className="checkout-form-grid" style={{ marginTop: '16px' }}>
                        <Input
                          label="Город"
                          name="city"
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          required
                          placeholder="Москва"
                        />
                        <div className="checkout-form-grid--full">
                          <Input
                            label="Адрес"
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
                    <div className="cart-summary__total">
                      <span>Итого</span>
                      <span>{totalPrice.toLocaleString('ru-RU')} ₽</span>
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
