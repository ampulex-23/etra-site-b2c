'use client'

import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ThemeProvider } from '../themes/ThemeProvider'
import { PageWrapper } from '../components/PageWrapper'
import { Header } from '../components/Header'
import { Footer } from '../components/Footer'
import { Button } from '../components/ui/Button'
import { QuantityStepper } from '../components/ui/QuantityStepper'
import { useCart } from './CartProvider'

export default function CartPage() {
  const { items, removeItem, updateQuantity, totalItems, totalPrice } = useCart()

  return (
    <ThemeProvider>
      <PageWrapper>
        <Header />
        <div className="cart-page">
          <div className="container">
            <div className="page-header">
              <h1 className="page-header__title">Корзина</h1>
              {totalItems > 0 && (
                <p className="page-header__desc">
                  {totalItems} {totalItems === 1 ? 'товар' : totalItems < 5 ? 'товара' : 'товаров'}
                </p>
              )}
            </div>

            {items.length === 0 ? (
              <div className="ui-empty">
                <div className="ui-empty__icon">
                  <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                    <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
                    <line x1="3" y1="6" x2="21" y2="6" />
                    <path d="M16 10a4 4 0 01-8 0" />
                  </svg>
                </div>
                <h3 className="ui-empty__title">Корзина пуста</h3>
                <p className="ui-empty__desc">Добавьте товары из каталога, чтобы оформить заказ</p>
                <Button href="/catalog" variant="primary" size="lg">
                  Перейти в каталог
                </Button>
              </div>
            ) : (
              <div className="cart-layout">
                <div className="cart-items">
                  {items.map((item) => (
                    <div key={`${item.productId}-${item.variantName || ''}`} className="cart-item">
                      <Link href={`/products/${item.slug}`} className="cart-item__image">
                        {item.imageUrl ? (
                          <Image src={item.imageUrl} alt={item.title} fill sizes="100px" style={{ objectFit: 'cover' }} />
                        ) : (
                          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.2">
                              <rect x="3" y="3" width="18" height="18" rx="2" />
                            </svg>
                          </div>
                        )}
                      </Link>
                      <div className="cart-item__body">
                        <div>
                          <Link href={`/products/${item.slug}`} className="cart-item__title">
                            {item.title}
                          </Link>
                          {item.variantName && (
                            <div className="cart-item__variant">{item.variantName}</div>
                          )}
                        </div>
                        <div className="cart-item__bottom">
                          <QuantityStepper
                            value={item.quantity}
                            onChange={(v) => updateQuantity(item.productId, v, item.variantName)}
                            size="sm"
                          />
                          <span className="cart-item__price">
                            {(item.price * item.quantity).toLocaleString('ru-RU')} ₽
                          </span>
                          <button
                            className="cart-item__remove"
                            onClick={() => removeItem(item.productId, item.variantName)}
                            aria-label="Удалить"
                          >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="cart-summary">
                  <h2 className="cart-summary__title">Итого</h2>
                  <div className="cart-summary__row">
                    <span className="cart-summary__row-label">Товары ({totalItems})</span>
                    <span className="cart-summary__row-value">{totalPrice.toLocaleString('ru-RU')} ₽</span>
                  </div>
                  <div className="cart-summary__row">
                    <span className="cart-summary__row-label">Доставка</span>
                    <span className="cart-summary__row-value" style={{ color: 'var(--color-text-muted)' }}>
                      Рассчитывается при оформлении
                    </span>
                  </div>
                  <div className="cart-summary__total">
                    <span>Итого</span>
                    <span>{totalPrice.toLocaleString('ru-RU')} ₽</span>
                  </div>
                  <div className="cart-summary__actions">
                    <Button href="/checkout" variant="primary" size="lg" fullWidth>
                      Оформить заказ
                    </Button>
                    <Button href="/catalog" variant="ghost" size="md" fullWidth>
                      Продолжить покупки
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        <Footer />
      </PageWrapper>
    </ThemeProvider>
  )
}
