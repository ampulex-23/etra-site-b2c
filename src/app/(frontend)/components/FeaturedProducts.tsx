'use client'

import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Plus } from 'lucide-react'
import { useCart } from '../cart/CartProvider'

export interface HomeFeaturedProduct {
  id: string
  title: string
  slug: string
  shortDescription?: string
  price: number
  oldPrice?: number
  imageUrl?: string | null
  featured?: boolean
  isBundle?: boolean
}

const placeholderAccents = [
  'linear-gradient(135deg,#a3e635,#22c55e)',
  'linear-gradient(135deg,#84cc16,#14b8a6)',
  'linear-gradient(135deg,#22c55e,#0ea5e9)',
  'linear-gradient(135deg,#65a30d,#a3e635)',
  'linear-gradient(135deg,#14b8a6,#84cc16)',
  'linear-gradient(135deg,#22c55e,#a3e635)',
]

// Used only if no real products returned from Payload
const placeholderProducts: HomeFeaturedProduct[] = [
  { id: 'morning', title: 'ЭТРА Утро', slug: 'morning', shortDescription: 'Имбирь · куркума · прополис', price: 480, featured: true },
  { id: 'balance', title: 'ЭТРА Баланс', slug: 'balance', shortDescription: 'Свёкла · чеснок · лимон', price: 520 },
  { id: 'detox', title: 'ЭТРА Детокс', slug: 'detox', shortDescription: 'Хлорелла · мята · имбирь', price: 540 },
  { id: 'immunity', title: 'ЭТРА Иммунитет', slug: 'immunity', shortDescription: 'Эхинацея · шиповник · мёд', price: 560 },
  { id: 'focus', title: 'ЭТРА Фокус', slug: 'focus', shortDescription: 'Гинкго · женьшень · мята', price: 580 },
  { id: 'calm', title: 'ЭТРА Покой', slug: 'calm', shortDescription: 'Мелисса · лаванда · ромашка', price: 500 },
]

interface Props {
  products?: HomeFeaturedProduct[]
}

export function FeaturedProducts({ products = [] }: Props) {
  const list = products.length > 0 ? products : placeholderProducts
  const isPlaceholder = products.length === 0

  const { addItem } = useCart()

  const handleAdd = (p: HomeFeaturedProduct) => {
    if (isPlaceholder) return
    addItem({
      productId: p.id,
      title: p.title,
      slug: p.slug,
      price: p.price,
      imageUrl: p.imageUrl ?? null,
      quantity: 1,
    })
  }

  return (
    <section id="products" className="landing-section featured-products reveal">
      <div className="featured-products__head">
        <div>
          <div className="landing-section__label">Каталог</div>
          <h2 className="landing-section__title">Наши напитки</h2>
        </div>
        <Link href="/catalog" className="btn btn--outline btn--sm featured-products__all">
          Весь каталог →
        </Link>
      </div>

      <div className="featured-products__scroller" role="list">
        {list.map((p, i) => {
          const href = `/products/${p.slug}`
          const accent = placeholderAccents[i % placeholderAccents.length]
          return (
            <article key={p.id} className="feat-card" role="listitem">
              <Link href={href} className="feat-card__media" aria-label={p.title}>
                {p.imageUrl ? (
                  <Image
                    src={p.imageUrl}
                    alt={p.title}
                    fill
                    sizes="(max-width: 768px) 260px, 280px"
                    className="feat-card__img"
                  />
                ) : (
                  <div className="feat-card__bg" style={{ background: accent }} />
                )}
                {p.featured && <span className="feat-card__badge">Хит</span>}
              </Link>
              <div className="feat-card__body">
                <Link href={href} className="feat-card__title">
                  {p.title}
                </Link>
                {p.shortDescription && (
                  <div className="feat-card__desc">{p.shortDescription}</div>
                )}
                <div className="feat-card__footer">
                  <span className="feat-card__price">{p.price.toLocaleString('ru-RU')} ₽</span>
                  <button
                    type="button"
                    className="feat-card__add"
                    aria-label={`Добавить ${p.title} в корзину`}
                    onClick={() => handleAdd(p)}
                    disabled={isPlaceholder}
                  >
                    <Plus size={18} strokeWidth={2.5} />
                  </button>
                </div>
              </div>
            </article>
          )
        })}
      </div>
    </section>
  )
}
