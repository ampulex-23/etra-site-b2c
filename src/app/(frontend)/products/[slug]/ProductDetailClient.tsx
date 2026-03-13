'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ThemeProvider } from '../../themes/ThemeProvider'
import { PageWrapper } from '../../components/PageWrapper'
import { Header } from '../../components/Header'
import { Footer } from '../../components/Footer'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { QuantityStepper } from '../../components/ui/QuantityStepper'
import { useCart } from '@/app/(frontend)/cart/CartProvider'

interface ProductImage {
  url: string
}

interface ProductVariant {
  name: string
  price: number
  sku?: string
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
}

interface Props {
  product: Product
}

export function ProductDetailClient({ product }: Props) {
  const { addItem } = useCart()
  const [mainImage, setMainImage] = useState(0)
  const [selectedVariant, setSelectedVariant] = useState<number | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [activeTab, setActiveTab] = useState('description')

  const currentPrice = selectedVariant !== null
    ? product.variants[selectedVariant].price
    : product.price

  const discount = product.oldPrice
    ? Math.round(((product.oldPrice - currentPrice) / product.oldPrice) * 100)
    : 0

  const handleAddToCart = () => {
    addItem({
      productId: product.id,
      title: product.title,
      slug: product.slug,
      price: currentPrice,
      imageUrl: product.images[0]?.url || null,
      quantity,
      variantName: selectedVariant !== null ? product.variants[selectedVariant].name : undefined,
    })
  }

  return (
    <ThemeProvider>
      <PageWrapper>
        <Header />
        <div className="product-page">
          <div className="container">
            <div className="ui-breadcrumbs" style={{ paddingTop: '24px' }}>
              <Link href="/">Главная</Link>
              <span className="ui-breadcrumbs__sep">/</span>
              <Link href="/catalog">Каталог</Link>
              {product.category && (
                <>
                  <span className="ui-breadcrumbs__sep">/</span>
                  <Link href={`/catalog?cat=${product.category.slug}`}>{product.category.title}</Link>
                </>
              )}
              <span className="ui-breadcrumbs__sep">/</span>
              <span>{product.title}</span>
            </div>

            <div className="product-detail">
              {/* Gallery */}
              <div className="product-gallery">
                <div className="product-gallery__main">
                  {product.images.length > 0 ? (
                    <Image
                      src={product.images[mainImage].url}
                      alt={product.title}
                      fill
                      sizes="(max-width: 768px) 100vw, 50vw"
                      style={{ objectFit: 'cover' }}
                      priority
                    />
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.5" opacity="0.2">
                        <rect x="3" y="3" width="18" height="18" rx="2" />
                        <circle cx="8.5" cy="8.5" r="1.5" />
                        <path d="m21 15-5-5L5 21" />
                      </svg>
                    </div>
                  )}
                </div>
                {product.images.length > 1 && (
                  <div className="product-gallery__thumbs">
                    {product.images.map((img, i) => (
                      <button
                        key={i}
                        className={`product-gallery__thumb ${mainImage === i ? 'product-gallery__thumb--active' : ''}`}
                        onClick={() => setMainImage(i)}
                      >
                        <Image src={img.url} alt="" fill sizes="72px" style={{ objectFit: 'cover' }} />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="product-info">
                <div>
                  {product.category && (
                    <Link
                      href={`/catalog?cat=${product.category.slug}`}
                      style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-accent)', textDecoration: 'none', fontWeight: 600 }}
                    >
                      {product.category.title}
                    </Link>
                  )}
                  <h1 className="product-info__title">{product.title}</h1>
                  {product.sku && (
                    <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                      Артикул: {product.sku}
                    </span>
                  )}
                </div>

                {product.shortDescription && (
                  <p className="product-info__short-desc">{product.shortDescription}</p>
                )}

                <div className="product-info__price-row">
                  <span className="product-info__price">
                    {currentPrice.toLocaleString('ru-RU')} ₽
                  </span>
                  {product.oldPrice && (
                    <span className="product-info__old-price">
                      {product.oldPrice.toLocaleString('ru-RU')} ₽
                    </span>
                  )}
                  {discount > 0 && (
                    <span className="product-info__discount-badge">
                      <Badge variant="danger">-{discount}%</Badge>
                    </span>
                  )}
                </div>

                {product.variants.length > 0 && (
                  <div>
                    <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginBottom: '8px', display: 'block' }}>
                      Вариант:
                    </span>
                    <div className="product-info__variants">
                      {product.variants.map((v, i) => (
                        <button
                          key={i}
                          className={`product-variant-btn ${selectedVariant === i ? 'product-variant-btn--active' : ''}`}
                          onClick={() => setSelectedVariant(selectedVariant === i ? null : i)}
                        >
                          {v.name} — {v.price.toLocaleString('ru-RU')} ₽
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="product-info__stock">
                  <span className={`product-info__stock-dot ${product.inStock ? 'product-info__stock-dot--in' : 'product-info__stock-dot--out'}`} />
                  <span style={{ color: product.inStock ? '#4ade80' : '#f87171' }}>
                    {product.inStock ? 'В наличии' : 'Нет в наличии'}
                  </span>
                  {product.weight && (
                    <span style={{ marginLeft: '16px', color: 'var(--color-text-muted)' }}>
                      {product.weight} г
                    </span>
                  )}
                </div>

                <div className="product-info__actions">
                  <QuantityStepper value={quantity} onChange={setQuantity} />
                  <Button
                    variant="primary"
                    size="lg"
                    onClick={handleAddToCart}
                    disabled={!product.inStock}
                    style={{ flex: 1 }}
                    icon={
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
                        <line x1="3" y1="6" x2="21" y2="6" />
                        <path d="M16 10a4 4 0 01-8 0" />
                      </svg>
                    }
                  >
                    В корзину
                  </Button>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="product-tabs">
              <div className="ui-tabs">
                <button
                  className={`ui-tab ${activeTab === 'description' ? 'ui-tab--active' : ''}`}
                  onClick={() => setActiveTab('description')}
                >
                  Описание
                </button>
                {product.composition && (
                  <button
                    className={`ui-tab ${activeTab === 'composition' ? 'ui-tab--active' : ''}`}
                    onClick={() => setActiveTab('composition')}
                  >
                    Состав
                  </button>
                )}
                {product.usage && (
                  <button
                    className={`ui-tab ${activeTab === 'usage' ? 'ui-tab--active' : ''}`}
                    onClick={() => setActiveTab('usage')}
                  >
                    Применение
                  </button>
                )}
              </div>
              <div className="product-tab-content">
                {activeTab === 'description' && (
                  <div>
                    {product.shortDescription && <p>{product.shortDescription}</p>}
                    {!product.description && !product.shortDescription && (
                      <p style={{ color: 'var(--color-text-muted)' }}>Описание скоро появится</p>
                    )}
                  </div>
                )}
                {activeTab === 'composition' && (
                  <div>
                    <p style={{ color: 'var(--color-text-muted)' }}>Информация о составе</p>
                  </div>
                )}
                {activeTab === 'usage' && (
                  <div>
                    <p style={{ color: 'var(--color-text-muted)' }}>Способ применения</p>
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
