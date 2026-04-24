'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useSearchParams } from 'next/navigation'
import { useCart } from '../../cart/CartProvider'

const TOPUP_STORAGE_KEY = 'checkout_topup_order_id'

export interface CatalogProduct {
  id: string
  title: string
  slug: string
  shortDescription: string
  price: number
  oldPrice?: number
  featured: boolean
  inStock: boolean
  isBundle: boolean
  category: string
  categorySlug: string
  imageUrl: string | null
}

interface Props {
  products: CatalogProduct[]
  categories: { id: string; title: string; slug: string }[]
}

export function CatalogScreen({ products, categories }: Props) {
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const { addItem } = useCart()
  const searchParams = useSearchParams()
  const topupOrderId = searchParams?.get('topup') || null

  // Persist the top-up intent so it survives navigation catalog → cart → checkout
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (topupOrderId) {
      sessionStorage.setItem(TOPUP_STORAGE_KEY, topupOrderId)
    }
  }, [topupOrderId])

  const filtered = activeCategory
    ? products.filter((p) => p.categorySlug === activeCategory)
    : products

  const handleAdd = (p: CatalogProduct) => {
    addItem({
      productId: p.id,
      title: p.title,
      slug: p.slug,
      price: p.price,
      imageUrl: p.imageUrl,
      quantity: 1,
    })
  }

  return (
    <div className="pwa-screen animate-in">
      <h1 className="t-h2 mb-16">Каталог</h1>

      {/* Top-up banner: customer is adding items to an existing unshipped order */}
      {topupOrderId && (
        <div
          className="glass"
          style={{
            padding: 12,
            marginBottom: 16,
            borderRadius: 'var(--r-md)',
            border: '2px solid var(--c-primary)',
            background: 'rgba(139, 92, 246, 0.08)',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <span aria-hidden style={{ fontSize: 20 }}>➕</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="t-caption" style={{ fontWeight: 600 }}>
              Режим докомплектации
            </div>
            <div className="t-small t-muted">
              Выбранные товары будут добавлены к существующему неотправленному заказу.
            </div>
          </div>
          <button
            type="button"
            className="btn btn--sm btn--glass"
            style={{ flexShrink: 0 }}
            onClick={() => {
              if (typeof window !== 'undefined') sessionStorage.removeItem(TOPUP_STORAGE_KEY)
              window.location.href = '/catalog'
            }}
          >
            Отмена
          </button>
        </div>
      )}

      {/* Category filter pills */}
      {categories.length > 0 && (
        <div className="pill-toggle" style={{ overflowX: 'auto', flexWrap: 'nowrap', paddingBottom: 4 }}>
          <button
            className={`pill-toggle__item ${!activeCategory ? 'pill-toggle__item--active' : ''}`}
            onClick={() => setActiveCategory(null)}
          >
            Все
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              className={`pill-toggle__item ${activeCategory === c.slug ? 'pill-toggle__item--active' : ''}`}
              onClick={() => setActiveCategory(c.slug)}
            >
              {c.title}
            </button>
          ))}
        </div>
      )}

      {/* Product grid */}
      <div className="grid-2">
        {filtered.map((p) => (
          <div key={p.id} className="product-card">
            <Link href={`/products/${p.slug}`}>
              <div style={{ position: 'relative', width: '100%', aspectRatio: '1' }}>
                {p.imageUrl ? (
                  <Image
                    src={p.imageUrl}
                    alt={p.title}
                    fill
                    sizes="(max-width: 768px) 50vw, 200px"
                    style={{ objectFit: 'cover' }}
                    className="product-card__img"
                  />
                ) : (
                  <div className="product-card__img" style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.2">
                      <rect x="3" y="3" width="18" height="18" rx="2" />
                    </svg>
                  </div>
                )}
              </div>
            </Link>
            <div className="product-card__body">
              <div className="product-card__title">{p.title}</div>
              {p.shortDescription && (
                <div className="product-card__desc">{p.shortDescription}</div>
              )}
              <div className="product-card__footer">
                <div>
                  <span className="product-card__price">{p.price.toLocaleString('ru-RU')} ₽</span>
                  {p.oldPrice && <span className="product-card__old">{p.oldPrice.toLocaleString('ru-RU')} ₽</span>}
                </div>
                {p.inStock ? (
                  <button className="product-card__add" onClick={() => handleAdd(p)} aria-label="В корзину">
                    <svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" /></svg>
                  </button>
                ) : (
                  <span className="product-card__out">Нет в наличии</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="empty">
          <div className="empty__icon">
            <svg viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></svg>
          </div>
          <h3 className="t-h3">Товары не найдены</h3>
          <p className="t-caption t-sec">Попробуйте выбрать другую категорию</p>
        </div>
      )}
    </div>
  )
}
