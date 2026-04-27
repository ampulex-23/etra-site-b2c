'use client'

import React, { useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useCart } from '@/app/(frontend)/cart/CartProvider'
import { RichText } from '@/app/(frontend)/components/RichText'
import { ShareButton } from '@/app/(frontend)/pwa/components/ShareButton'

interface ProductImage { url: string }
interface ProductVariant { name: string; price: number; sku?: string }
interface BundleItem {
  product: { id: string; title: string; slug: string; price: number; images?: ProductImage[] } | null
  quantity: number
}

interface Product {
  id: string
  title: string
  slug: string
  shortDescription: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  description: any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  composition: any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  usage: any
  price: number
  oldPrice?: number
  images: ProductImage[]
  variants: ProductVariant[]
  inStock: boolean
  featured: boolean
  weight?: number
  sku?: string
  category: { title: string; slug: string } | null
  isBundle?: boolean
  bundleItems?: BundleItem[]
}

interface Props { product: Product }

export function ProductDetailClient({ product }: Props) {
  const { addItem } = useCart()
  const [mainImage, setMainImage] = useState(0)
  const [selectedVariant, setSelectedVariant] = useState<number | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [activeTab, setActiveTab] = useState('description')
  const [added, setAdded] = useState(false)

  const currentPrice = selectedVariant !== null ? product.variants[selectedVariant].price : product.price
  const discount = product.oldPrice ? Math.round(((product.oldPrice - currentPrice) / product.oldPrice) * 100) : 0

  const handleAddToCart = () => {
    addItem({
      productId: product.id, title: product.title, slug: product.slug, price: currentPrice,
      imageUrl: product.images[0]?.url || null, quantity,
      variantName: selectedVariant !== null ? product.variants[selectedVariant].name : undefined,
    })
    setAdded(true)
    setTimeout(() => setAdded(false), 1500)
  }

  // Touch swipe support for gallery
  const touchStartX = useRef<number | null>(null)
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
  }
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || product.images.length < 2) return
    const dx = e.changedTouches[0].clientX - touchStartX.current
    if (Math.abs(dx) > 50) {
      if (dx < 0) setMainImage((mainImage + 1) % product.images.length)
      else setMainImage((mainImage - 1 + product.images.length) % product.images.length)
    }
    touchStartX.current = null
  }

  return (
    <div className="pwa-screen animate-in product-detail">
      {/* Gallery */}
      <div
        className="product-gallery"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div
          className="product-gallery__track"
          style={{ transform: `translateX(-${mainImage * 100}%)` }}
        >
          {product.images.length > 0 ? product.images.map((img, i) => (
            <div key={i} className="product-gallery__slide">
              <Image
                src={img.url}
                alt={product.title}
                fill
                sizes="(min-width: 768px) 50vw, 100vw"
                style={{ objectFit: 'contain' }}
                priority={i === 0}
              />
            </div>
          )) : (
            <div className="product-gallery__slide product-gallery__slide--empty">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.5" opacity="0.2">
                <rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="m21 15-5-5L5 21" />
              </svg>
            </div>
          )}
        </div>

        {product.images.length > 1 && (
          <>
            <button
              type="button"
              className="product-gallery__nav product-gallery__nav--prev"
              onClick={() => setMainImage((mainImage - 1 + product.images.length) % product.images.length)}
              aria-label="Предыдущее фото"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6" /></svg>
            </button>
            <button
              type="button"
              className="product-gallery__nav product-gallery__nav--next"
              onClick={() => setMainImage((mainImage + 1) % product.images.length)}
              aria-label="Следующее фото"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6" /></svg>
            </button>
            <div className="product-gallery__dots">
              {product.images.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setMainImage(i)}
                  className={'product-gallery__dot' + (mainImage === i ? ' product-gallery__dot--active' : '')}
                  aria-label={`Фото ${i + 1}`}
                />
              ))}
            </div>
          </>
        )}
      </div>

      <div className="product-detail__main">
        <section className="glass product-info">
          {product.category && (
            <Link href="/catalog" className="t-small" style={{ color: 'var(--c-primary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              {product.category.title}
            </Link>
          )}
          <h1 className="t-h2" style={{ margin: '6px 0 8px' }}>{product.title}</h1>
          {product.sku && <span className="t-small t-muted">{'Артикул: ' + product.sku}</span>}

          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, margin: '14px 0' }}>
            <span style={{ fontSize: 26, fontWeight: 800 }}>{currentPrice.toLocaleString('ru-RU') + ' \u20BD'}</span>
            {product.oldPrice && <span className="t-caption t-muted" style={{ textDecoration: 'line-through' }}>{product.oldPrice.toLocaleString('ru-RU') + ' \u20BD'}</span>}
            {discount > 0 && <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--c-danger)', background: 'rgba(255,107,107,0.15)', padding: '2px 8px', borderRadius: 'var(--r-full)' }}>{'-' + discount + '%'}</span>}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: product.inStock ? 'var(--c-success)' : 'var(--c-danger)' }} />
            <span className="t-caption" style={{ color: product.inStock ? 'var(--c-success)' : 'var(--c-danger)', fontWeight: 600 }}>
              {product.inStock ? 'В наличии' : 'Нет в наличии'}
            </span>
            {product.weight && <span className="t-caption t-muted" style={{ marginLeft: 8 }}>{product.weight + ' г'}</span>}
          </div>
        </section>

        {product.variants.length > 0 && (
          <div className="mb-12">
            <span className="t-caption t-sec" style={{ display: 'block', marginBottom: 8 }}>{'Вариант:'}</span>
            <div className="pill-toggle">
              {product.variants.map((v, i) => (
                <button key={i} className={'pill-toggle__item' + (selectedVariant === i ? ' pill-toggle__item--active' : '')}
                  onClick={() => setSelectedVariant(selectedVariant === i ? null : i)}>
                  {v.name + ' \u2014 ' + v.price.toLocaleString('ru-RU') + ' \u20BD'}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="product-actions">
          <div className="qty">
            <button className="qty__btn" onClick={() => setQuantity(Math.max(1, quantity - 1))}>
              <svg viewBox="0 0 24 24"><path d="M5 12h14" /></svg>
            </button>
            <span className="qty__val">{quantity}</span>
            <button className="qty__btn" onClick={() => setQuantity(Math.min(99, quantity + 1))}>
              <svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" /></svg>
            </button>
          </div>
          <button className={'btn btn--primary product-actions__cart' + (!product.inStock ? ' btn--loading' : '')}
            onClick={handleAddToCart} disabled={!product.inStock}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" /><line x1="3" y1="6" x2="21" y2="6" /><path d="M16 10a4 4 0 01-8 0" />
            </svg>
            {added ? 'Добавлено!' : 'В корзину'}
          </button>
          <ShareButton
            productSlug={product.slug}
            productName={product.title}
            productImage={product.images[0]?.url}
            className="product-actions__share"
          />
        </div>

      <div className="pill-toggle mb-12">
        <button className={'pill-toggle__item' + (activeTab === 'description' ? ' pill-toggle__item--active' : '')} onClick={() => setActiveTab('description')}>{'Описание'}</button>
        {product.composition && <button className={'pill-toggle__item' + (activeTab === 'composition' ? ' pill-toggle__item--active' : '')} onClick={() => setActiveTab('composition')}>{'Состав'}</button>}
        {product.usage && <button className={'pill-toggle__item' + (activeTab === 'usage' ? ' pill-toggle__item--active' : '')} onClick={() => setActiveTab('usage')}>{'Применение'}</button>}
        {product.isBundle && product.bundleItems && product.bundleItems.length > 0 && (
          <button className={'pill-toggle__item' + (activeTab === 'bundle' ? ' pill-toggle__item--active' : '')} onClick={() => setActiveTab('bundle')}>{'Набор'}</button>
        )}
      </div>

      <div className="glass" style={{ padding: 16 }}>
        {activeTab === 'description' && (
          <div className="t-body t-sec">
            {product.description ? (
              <RichText content={product.description} />
            ) : product.shortDescription ? (
              <p>{product.shortDescription}</p>
            ) : (
              <span className="t-muted">{'Описание скоро появится'}</span>
            )}
          </div>
        )}
        {activeTab === 'composition' && (
          <div className="t-body t-sec">
            {product.composition ? (
              <RichText content={product.composition} />
            ) : (
              <span className="t-muted">{'Информация о составе скоро появится'}</span>
            )}
          </div>
        )}
        {activeTab === 'usage' && (
          <div className="t-body t-sec">
            {product.usage ? (
              <RichText content={product.usage} />
            ) : (
              <span className="t-muted">{'Способ применения скоро появится'}</span>
            )}
          </div>
        )}
        {activeTab === 'bundle' && product.bundleItems && (
          <div className="stack">
            <p className="t-caption t-sec mb-12">{'В этот набор входят:'}</p>
            {product.bundleItems.map((item, i) => item.product && (
              <Link key={i} href={'/products/' + item.product.slug} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 10, background: 'var(--c-glass)', borderRadius: 'var(--r-sm)' }}>
                <div style={{ width: 44, height: 44, borderRadius: 'var(--r-xs)', overflow: 'hidden', position: 'relative', flexShrink: 0, background: 'rgba(0,0,0,0.2)' }}>
                  {item.product.images?.[0]?.url && <Image src={item.product.images[0].url} alt="" fill sizes="44px" style={{ objectFit: 'cover' }} />}
                </div>
                <div style={{ flex: 1 }}>
                  <div className="t-caption" style={{ fontWeight: 600 }}>{item.product.title}</div>
                  <div className="t-small t-muted">{item.product.price?.toLocaleString('ru-RU') + ' \u20BD'}</div>
                </div>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--c-primary)', background: 'var(--c-primary-glow)', padding: '2px 8px', borderRadius: 'var(--r-full)' }}>{'x' + item.quantity}</span>
              </Link>
            ))}
          </div>
        )}
      </div>
      </div>
    </div>
  )
}