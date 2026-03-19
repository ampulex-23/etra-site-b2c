'use client'

import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useCart } from '../../cart/CartProvider'

export function CartScreen() {
  const { items, removeItem, updateQuantity, totalItems, totalPrice } = useCart()

  if (items.length === 0) {
    return (
      <div className="pwa-screen animate-in">
        <div className="empty">
          <div className="empty__icon">
            <svg viewBox="0 0 24 24">
              <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <path d="M16 10a4 4 0 01-8 0" />
            </svg>
          </div>
          <h3 className="t-h3">Корзина пуста</h3>
          <p className="t-caption t-sec">Добавьте товары из каталога</p>
          <Link href="/catalog" className="btn btn--primary mt-16">Перейти в каталог</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="pwa-screen animate-in">
      <h1 className="t-h2 mb-12">
        Корзина
        <span className="t-caption t-sec" style={{ marginLeft: 8, fontWeight: 400 }}>
          {totalItems} {totalItems === 1 ? 'товар' : totalItems < 5 ? 'товара' : 'товаров'}
        </span>
      </h1>

      <div className="stack mb-16">
        {items.map((item) => (
          <div key={`${item.productId}-${item.variantName || ''}`} className="cart-item">
            <div className="glass-backdrop-card" />
            <div style={{ position: 'relative', width: 72, height: 72, borderRadius: 'var(--r-sm)', overflow: 'hidden', flexShrink: 0 }}>
              {item.imageUrl ? (
                <Image src={item.imageUrl} alt={item.title} fill sizes="72px" style={{ objectFit: 'cover' }} />
              ) : (
                <div style={{ width: '100%', height: '100%', background: 'rgba(0,0,0,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.3">
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                  </svg>
                </div>
              )}
            </div>
            <div className="cart-item__body">
              <div>
                <div className="cart-item__title">{item.title}</div>
                {item.variantName && <div className="cart-item__variant">{item.variantName}</div>}
              </div>
              <div className="cart-item__row">
                <div className="qty">
                  <button
                    className="qty__btn"
                    onClick={() => updateQuantity(item.productId, item.quantity - 1, item.variantName)}
                  >
                    <svg viewBox="0 0 24 24"><path d="M5 12h14" /></svg>
                  </button>
                  <span className="qty__val">{item.quantity}</span>
                  <button
                    className="qty__btn"
                    onClick={() => updateQuantity(item.productId, item.quantity + 1, item.variantName)}
                  >
                    <svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" /></svg>
                  </button>
                </div>
                <span className="cart-item__price">{(item.price * item.quantity).toLocaleString('ru-RU')} ₽</span>
                <button className="cart-item__remove" onClick={() => removeItem(item.productId, item.variantName)} aria-label="Удалить">
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="summary mb-16">
        <div className="glass-backdrop-card" />
        <div className="summary__row">
          <span className="summary__label">Товары ({totalItems})</span>
          <span>{totalPrice.toLocaleString('ru-RU')} ₽</span>
        </div>
        <div className="summary__row">
          <span className="summary__label">Доставка</span>
          <span className="t-muted">При оформлении</span>
        </div>
        <div className="summary__row summary__row--total">
          <span>Итого</span>
          <span>{totalPrice.toLocaleString('ru-RU')} ₽</span>
        </div>
      </div>

      <Link href="/checkout" className="btn btn--primary btn--lg btn--full mb-12">
        Оформить заказ
      </Link>
      <Link href="/catalog" className="btn btn--glass btn--full">
        Продолжить покупки
      </Link>
    </div>
  )
}
