export const dynamic = 'force-dynamic'

import React from 'react'
import { getPayload } from 'payload'
import config from '@payload-config'
import { CatalogScreen } from '../pwa/screens/CatalogScreen'

interface ProductData {
  id: string
  title: string
  slug: string
  shortDescription?: string
  price: number
  oldPrice?: number
  featured?: boolean
  inStock?: boolean
  isBundle?: boolean
  category?: { id: string; title: string; slug: string } | string
  images?: { image: { url?: string } | string }[]
}

export const metadata = {
  title: 'Каталог — ЭТРА',
  description: 'Ферментированные напитки ЭТРА. Живые ферменты и пробиотики.',
}

export default async function CatalogPage() {
  const payload = await getPayload({ config })

  const [productsRes, categoriesRes] = await Promise.all([
    payload.find({
      collection: 'products',
      where: { status: { equals: 'active' } },
      limit: 100,
      sort: '-createdAt',
    }),
    payload.find({
      collection: 'categories',
      limit: 50,
      sort: 'order',
    }),
  ])

  const products = (productsRes.docs as unknown as ProductData[]).map((p) => {
    const img = p.images?.[0]?.image
    const imageUrl = typeof img === 'object' && img?.url ? img.url : null
    const cat = typeof p.category === 'object' && p.category ? p.category : null
    return {
      id: p.id,
      title: p.title,
      slug: p.slug,
      shortDescription: p.shortDescription || '',
      price: p.price,
      oldPrice: p.oldPrice || undefined,
      featured: p.featured || false,
      inStock: p.inStock !== false,
      isBundle: p.isBundle || false,
      category: cat?.title || '',
      categorySlug: cat?.slug || '',
      imageUrl,
    }
  })

  const categories = (categoriesRes.docs as unknown as { id: string; title: string; slug: string }[]).map((c) => ({
    id: c.id,
    title: c.title,
    slug: c.slug,
  }))

  return <CatalogScreen products={products} categories={categories} />
}
