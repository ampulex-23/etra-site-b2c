'use client'

import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Badge } from './Badge'
import { useCart } from '@/app/(frontend)/cart/CartProvider'

export interface ProductCardData {
  id: string
  title: string
  slug: string
  shortDescription?: string
  price: number
  oldPrice?: number
  imageUrl?: string | null
  featured?: boolean
  inStock?: boolean
  category?: string
}

interface ProductCardProps {
  product: ProductCardData
  className?: string
}

export function ProductCard({ product, className = '' }: ProductCardProps) {
  const { addItem } = useCart()
  const discount = product.oldPrice
    ? Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100)
    : 0

  return (
    <div className={`ui-product-card ${className}`}>
      <Link href={`/products/${product.slug}`} className="ui-product-card__image-link">
        <div className="ui-product-card__image">
          {product.imageUrl ? (
            <Image
              src={product.imageUrl}
              alt={product.title}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
              style={{ objectFit: 'cover' }}
            />
          ) : (
            <div className="ui-product-card__placeholder">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.3">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <path d="m21 15-5-5L5 21" />
              </svg>
            </div>
          )}
          <div className="ui-product-card__badges">
            {discount > 0 && <Badge variant="danger">-{discount}%</Badge>}
            {product.featured && <Badge variant="accent">Хит</Badge>}
            {product.inStock === false && <Badge variant="warning">Нет в наличии</Badge>}
          </div>
        </div>
      </Link>

      <div className="ui-product-card__body">
        {product.category && (
          <span className="ui-product-card__category">{product.category}</span>
        )}
        <Link href={`/products/${product.slug}`} className="ui-product-card__title-link">
          <h3 className="ui-product-card__title">{product.title}</h3>
        </Link>
        {product.shortDescription && (
          <p className="ui-product-card__desc">{product.shortDescription}</p>
        )}
        <div className="ui-product-card__footer">
          <div className="ui-product-card__prices">
            <span className="ui-product-card__price">{product.price.toLocaleString('ru-RU')} ₽</span>
            {product.oldPrice && (
              <span className="ui-product-card__old-price">{product.oldPrice.toLocaleString('ru-RU')} ₽</span>
            )}
          </div>
          <button
            className="ui-product-card__cart-btn"
            aria-label="Добавить в корзину"
            disabled={product.inStock === false}
            onClick={() =>
              addItem({
                productId: product.id,
                title: product.title,
                slug: product.slug,
                price: product.price,
                imageUrl: product.imageUrl || null,
                quantity: 1,
              })
            }
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 5v14M5 12h14" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}
