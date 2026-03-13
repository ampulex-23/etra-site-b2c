'use client'

import React, { useState, useMemo } from 'react'
import { ThemeProvider } from '../themes/ThemeProvider'
import { PageWrapper } from '../components/PageWrapper'
import { Header } from '../components/Header'
import { Footer } from '../components/Footer'
import { ProductCard } from '../components/ui/ProductCard'
import type { ProductCardData } from '../components/ui/ProductCard'

interface CatalogProduct extends ProductCardData {
  categorySlug: string
}

interface Category {
  id: string
  title: string
  slug: string
}

type SortOption = 'newest' | 'price-asc' | 'price-desc' | 'name'

interface CatalogClientProps {
  products: CatalogProduct[]
  categories: Category[]
}

export function CatalogClient({ products, categories }: CatalogClientProps) {
  const [activeCategory, setActiveCategory] = useState<string>('all')
  const [sort, setSort] = useState<SortOption>('newest')
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    let result = products

    if (activeCategory !== 'all') {
      result = result.filter((p) => p.categorySlug === activeCategory)
    }

    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          (p.shortDescription && p.shortDescription.toLowerCase().includes(q)),
      )
    }

    switch (sort) {
      case 'price-asc':
        result = [...result].sort((a, b) => a.price - b.price)
        break
      case 'price-desc':
        result = [...result].sort((a, b) => b.price - a.price)
        break
      case 'name':
        result = [...result].sort((a, b) => a.title.localeCompare(b.title, 'ru'))
        break
      default:
        break
    }

    return result
  }, [products, activeCategory, sort, search])

  return (
    <ThemeProvider>
      <PageWrapper>
        <Header />
        <div className="catalog-page">
          <div className="container">
            <div className="page-header">
              <h1 className="page-header__title">Каталог</h1>
              <p className="page-header__desc">
                Ферментированные напитки с живыми ферментами и пробиотиками
              </p>
            </div>

            <div className="catalog-filters">
              <button
                className={`catalog-filter-btn ${activeCategory === 'all' ? 'catalog-filter-btn--active' : ''}`}
                onClick={() => setActiveCategory('all')}
              >
                Все
              </button>
              {categories.map((c) => (
                <button
                  key={c.id}
                  className={`catalog-filter-btn ${activeCategory === c.slug ? 'catalog-filter-btn--active' : ''}`}
                  onClick={() => setActiveCategory(c.slug)}
                >
                  {c.title}
                </button>
              ))}
            </div>

            <div className="catalog-toolbar">
              <div className="catalog-count">
                {filtered.length}{' '}
                {filtered.length === 1
                  ? 'товар'
                  : filtered.length < 5
                    ? 'товара'
                    : 'товаров'}
              </div>

              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    placeholder="Поиск..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="ui-input"
                    style={{ width: '200px', padding: '8px 12px', fontSize: '13px' }}
                  />
                </div>
                <div className="catalog-sort">
                  <span className="catalog-sort__label">Сортировка:</span>
                  <select
                    value={sort}
                    onChange={(e) => setSort(e.target.value as SortOption)}
                  >
                    <option value="newest">Новинки</option>
                    <option value="price-asc">Цена: по возрастанию</option>
                    <option value="price-desc">Цена: по убыванию</option>
                    <option value="name">По названию</option>
                  </select>
                </div>
              </div>
            </div>

            {filtered.length > 0 ? (
              <div className="products-grid">
                {filtered.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            ) : (
              <div className="ui-empty">
                <div className="ui-empty__icon">
                  <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                    <circle cx="11" cy="11" r="8" />
                    <path d="m21 21-4.35-4.35" />
                  </svg>
                </div>
                <h3 className="ui-empty__title">Ничего не найдено</h3>
                <p className="ui-empty__desc">Попробуйте изменить фильтры или поисковый запрос</p>
              </div>
            )}
          </div>
        </div>
        <Footer />
      </PageWrapper>
    </ThemeProvider>
  )
}
