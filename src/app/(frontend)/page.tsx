import React from 'react'
import { getPayload } from 'payload'
import config from '@payload-config'
import { AboutScreen, type HomeFeaturedProduct } from './pwa/screens/AboutScreen'

export const dynamic = 'force-dynamic'

async function fetchFeaturedProducts(): Promise<HomeFeaturedProduct[]> {
  try {
    const payload = await getPayload({ config })
    // Prefer products flagged as "на главной"; fallback to latest active
    const featured = await payload.find({
      collection: 'products',
      where: {
        and: [{ status: { equals: 'active' } }, { featured: { equals: true } }],
      },
      limit: 8,
      sort: '-createdAt',
      depth: 1,
    })
    const docs =
      featured.docs.length > 0
        ? featured.docs
        : (
            await payload.find({
              collection: 'products',
              where: { status: { equals: 'active' } },
              limit: 8,
              sort: '-createdAt',
              depth: 1,
            })
          ).docs

    return (docs as unknown as Array<Record<string, unknown>>).map((p) => {
      const imgs = p.images as Array<{ image: { url?: string } | string }> | undefined
      const img = imgs?.[0]?.image
      const imageUrl = typeof img === 'object' && img?.url ? img.url : null
      return {
        id: String(p.id),
        title: String(p.title ?? ''),
        slug: String(p.slug ?? ''),
        shortDescription: (p.shortDescription as string) || '',
        price: Number(p.price ?? 0),
        oldPrice: (p.oldPrice as number) || undefined,
        imageUrl,
        featured: Boolean(p.featured),
        isBundle: Boolean(p.isBundle),
      }
    })
  } catch (err) {
    console.error('[home] Failed to load featured products:', err)
    return []
  }
}

export default async function HomePage() {
  const featuredProducts = await fetchFeaturedProducts()
  return <AboutScreen featuredProducts={featuredProducts} />
}
