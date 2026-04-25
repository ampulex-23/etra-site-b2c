'use client'

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'

type ViewMode = 'table' | 'cards'
const STORAGE_KEY = 'products-view-mode'

type ProductDoc = {
  id: string | number
  title?: string | null
  slug?: string | null
  price?: number | null
  oldPrice?: number | null
  sku?: string | null
  status?: string | null
  inStock?: boolean | null
  featured?: boolean | null
  isBundle?: boolean | null
  shortDescription?: string | null
  category?: { id?: string | number; title?: string | null } | string | number | null
  images?: Array<{
    image?:
      | string
      | number
      | {
          id?: string | number
          url?: string | null
          alt?: string | null
          sizes?: { thumbnail?: { url?: string | null }; card?: { url?: string | null } }
        }
      | null
  }> | null
}

const STATUS_LABEL: Record<string, string> = {
  active: 'Активен',
  hidden: 'Скрыт',
  archived: 'В архиве',
}

const STATUS_COLOR: Record<string, string> = {
  active: '#22c55e',
  hidden: '#6b7280',
  archived: '#a16207',
}

const ProductsViewToggle: React.FC = () => {
  const [mode, setMode] = useState<ViewMode>('table')
  const [docs, setDocs] = useState<ProductDoc[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const searchParams = useSearchParams()

  // Load saved mode on mount.
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY) as ViewMode | null
      if (saved === 'cards' || saved === 'table') setMode(saved)
    } catch {
      /* ignore */
    }
  }, [])

  // Persist mode + toggle a body class so we can hide the default table.
  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, mode)
    } catch {
      /* ignore */
    }
    if (mode === 'cards') {
      document.body.classList.add('products-cards-mode')
    } else {
      document.body.classList.remove('products-cards-mode')
    }
    return () => {
      document.body.classList.remove('products-cards-mode')
    }
  }, [mode])

  const fetchProducts = useCallback(async () => {
    setLoading(true)
    try {
      const qs = new URLSearchParams()
      // Pass-through all `where[...]` filters from the URL so the cards
      // view honours the same filter the user picked in the toolbar.
      for (const [k, v] of searchParams.entries()) {
        if (k.startsWith('where[') || k === 'sort' || k === 'limit') qs.set(k, v)
      }
      if (!qs.has('limit')) qs.set('limit', '100')
      if (!qs.has('sort')) qs.set('sort', '-createdAt')
      qs.set('depth', '1')

      const res = await fetch(`/api/products?${qs.toString()}`, { cache: 'no-store' })
      const data = await res.json()
      setDocs(Array.isArray(data?.docs) ? data.docs : [])
    } catch (err) {
      console.error('[ProductsViewToggle] fetch failed', err)
      setDocs([])
    } finally {
      setLoading(false)
    }
  }, [searchParams])

  useEffect(() => {
    if (mode === 'cards') void fetchProducts()
  }, [mode, fetchProducts])

  const filteredDocs = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return docs
    return docs.filter((d) =>
      [d.title, d.slug, d.sku, d.shortDescription]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q)),
    )
  }, [docs, search])

  return (
    <div className="products-view-toggle">
      <div className="products-view-toggle__bar">
        <strong style={{ fontSize: 12, color: '#6b7280', textTransform: 'uppercase' }}>
          Режим:
        </strong>
        <div className="products-view-toggle__group" role="tablist" aria-label="Режим отображения">
          <button
            type="button"
            className={`products-view-toggle__btn${mode === 'table' ? ' is-active' : ''}`}
            onClick={() => setMode('table')}
            aria-pressed={mode === 'table'}
          >
            ☰ Таблица
          </button>
          <button
            type="button"
            className={`products-view-toggle__btn${mode === 'cards' ? ' is-active' : ''}`}
            onClick={() => setMode('cards')}
            aria-pressed={mode === 'cards'}
          >
            ▦ Карточки
          </button>
        </div>
      </div>

      {mode === 'cards' ? (
        <div className="products-view-cards">
          <div className="products-view-cards__toolbar">
            <input
              type="search"
              placeholder="Поиск по названию / slug / SKU…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="products-view-cards__search"
            />
            <span style={{ fontSize: 12, color: '#6b7280' }}>
              Найдено: {filteredDocs.length}
              {docs.length >= 100 ? ' (показаны первые 100)' : ''}
            </span>
            <button
              type="button"
              onClick={() => fetchProducts()}
              className="products-view-toggle__btn"
              title="Обновить"
            >
              ⟳
            </button>
          </div>

          {loading ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>
              Загрузка…
            </div>
          ) : filteredDocs.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>
              Ничего не найдено
            </div>
          ) : (
            <div className="products-view-cards__grid">
              {filteredDocs.map((p) => (
                <ProductCard key={p.id} doc={p} />
              ))}
            </div>
          )}
        </div>
      ) : null}

      <Styles />
    </div>
  )
}

export default ProductsViewToggle

const ProductCard: React.FC<{ doc: ProductDoc }> = ({ doc }) => {
  const editHref = `/admin/collections/products/${doc.id}`
  const firstImage = doc.images?.[0]?.image
  const thumb =
    firstImage && typeof firstImage === 'object'
      ? firstImage.sizes?.card?.url ||
        firstImage.sizes?.thumbnail?.url ||
        firstImage.url
      : null

  const status = doc.status || 'active'
  const statusLabel = STATUS_LABEL[status] || status
  const statusColor = STATUS_COLOR[status] || '#6b7280'

  const categoryTitle =
    doc.category && typeof doc.category === 'object'
      ? doc.category.title || ''
      : ''

  return (
    <a href={editHref} className="products-view-card">
      <div className="products-view-card__thumb">
        {thumb ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={thumb} alt={doc.title || ''} loading="lazy" />
        ) : (
          <div className="products-view-card__thumb-fallback">📦</div>
        )}
        <span
          className="products-view-card__status"
          style={{ background: statusColor }}
          title={statusLabel}
        >
          {statusLabel}
        </span>
        {doc.featured ? (
          <span className="products-view-card__featured" title="На главной">
            ★
          </span>
        ) : null}
      </div>
      <div className="products-view-card__body">
        <div className="products-view-card__title" title={doc.title || ''}>
          {doc.title || `#${doc.id}`}
        </div>
        {categoryTitle ? (
          <div className="products-view-card__category">{categoryTitle}</div>
        ) : null}
        <div className="products-view-card__price-row">
          <span className="products-view-card__price">
            {typeof doc.price === 'number' ? `${doc.price.toLocaleString('ru-RU')} ₽` : '—'}
          </span>
          {typeof doc.oldPrice === 'number' && doc.oldPrice > (doc.price || 0) ? (
            <span className="products-view-card__old-price">
              {doc.oldPrice.toLocaleString('ru-RU')} ₽
            </span>
          ) : null}
        </div>
        <div className="products-view-card__meta">
          {doc.sku ? <span>SKU: {doc.sku}</span> : null}
          <span
            className={`products-view-card__stock products-view-card__stock--${doc.inStock ? 'in' : 'out'}`}
          >
            {doc.inStock ? '✓ В наличии' : '○ Нет'}
          </span>
          {doc.isBundle ? <span title="Набор">🎁</span> : null}
        </div>
      </div>
    </a>
  )
}

const Styles: React.FC = () => (
  <style
    // eslint-disable-next-line react/no-danger
    dangerouslySetInnerHTML={{
      __html: `
.products-view-toggle__bar {
  display: flex; align-items: center; gap: 0.75rem; margin: 0 0 1rem;
}
.products-view-toggle__group {
  display: inline-flex; border: 1px solid var(--theme-elevation-150, #e5e7eb);
  border-radius: 6px; overflow: hidden;
}
.products-view-toggle__btn {
  padding: 6px 14px; font-size: 13px; background: transparent; border: none;
  cursor: pointer; color: inherit; border-right: 1px solid var(--theme-elevation-150, #e5e7eb);
}
.products-view-toggle__group .products-view-toggle__btn:last-child { border-right: none; }
.products-view-toggle__btn:hover { background: var(--theme-elevation-50, #f3f4f6); }
.products-view-toggle__btn.is-active {
  background: var(--theme-elevation-100, #e5e7eb); font-weight: 600;
}

/* Hide the default table when cards mode is active. */
body.products-cards-mode .collection-list__wrap > .table,
body.products-cards-mode .collection-list__wrap > .relationship-table,
body.products-cards-mode .collection-list__wrap > div > .table,
body.products-cards-mode .collection-list__page-controls,
body.products-cards-mode .collection-list table { display: none !important; }

/* Cards container */
.products-view-cards {
  border: 1px solid var(--theme-elevation-100, #e5e7eb); border-radius: 8px;
  background: var(--theme-elevation-0, #fff); overflow: hidden;
}
.products-view-cards__toolbar {
  display: flex; align-items: center; gap: 0.75rem;
  padding: 0.75rem 1rem; border-bottom: 1px solid var(--theme-elevation-100, #e5e7eb);
}
.products-view-cards__search {
  flex: 1 1 auto; min-width: 200px; max-width: 360px;
  padding: 6px 10px; font-size: 13px;
  border: 1px solid var(--theme-elevation-150, #e5e7eb); border-radius: 6px;
  background: var(--theme-input-bg, #fff); color: inherit;
}
.products-view-cards__grid {
  display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 0.75rem; padding: 0.75rem;
}

/* Card */
.products-view-card {
  display: flex; flex-direction: column;
  border: 1px solid var(--theme-elevation-100, #e5e7eb); border-radius: 8px;
  overflow: hidden; background: var(--theme-elevation-0, #fff);
  text-decoration: none; color: inherit; transition: box-shadow 0.15s;
}
.products-view-card:hover {
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  border-color: var(--theme-elevation-200, #d1d5db);
}
.products-view-card__thumb {
  position: relative; aspect-ratio: 1 / 1;
  background: var(--theme-elevation-50, #f3f4f6); overflow: hidden;
}
.products-view-card__thumb img { width: 100%; height: 100%; object-fit: cover; display: block; }
.products-view-card__thumb-fallback {
  width: 100%; height: 100%; display: flex; align-items: center; justify-content: center;
  font-size: 3rem; color: #d1d5db;
}
.products-view-card__status {
  position: absolute; top: 8px; left: 8px;
  font-size: 10px; color: #fff; padding: 2px 8px; border-radius: 10px;
  text-transform: uppercase; letter-spacing: 0.03em; font-weight: 600;
}
.products-view-card__featured {
  position: absolute; top: 8px; right: 8px;
  width: 24px; height: 24px; border-radius: 50%;
  background: rgba(255,255,255,0.95); color: #f59e0b;
  display: flex; align-items: center; justify-content: center;
  font-size: 14px; box-shadow: 0 1px 3px rgba(0,0,0,0.15);
}

.products-view-card__body { padding: 0.6rem 0.75rem 0.75rem; display: flex; flex-direction: column; gap: 4px; }
.products-view-card__title {
  font-size: 13px; font-weight: 600; line-height: 1.3;
  display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;
  overflow: hidden;
}
.products-view-card__category { font-size: 11px; color: #6b7280; }
.products-view-card__price-row {
  display: flex; align-items: baseline; gap: 8px; margin-top: 4px;
}
.products-view-card__price { font-size: 15px; font-weight: 700; }
.products-view-card__old-price {
  font-size: 12px; color: #9ca3af; text-decoration: line-through;
}
.products-view-card__meta {
  display: flex; flex-wrap: wrap; gap: 8px; align-items: center;
  font-size: 11px; color: #6b7280; margin-top: 4px;
}
.products-view-card__stock--in { color: #16a34a; }
.products-view-card__stock--out { color: #dc2626; }
`,
    }}
  />
)
