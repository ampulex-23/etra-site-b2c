export const dynamic = 'force-dynamic'

import React from 'react'
import { getPayload } from 'payload'
import config from '@payload-config'
import { notFound } from 'next/navigation'
import { ProductDetailClient } from './ProductDetailClient'

interface Props {
  params: Promise<{ slug: string }>
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params
  const payload = await getPayload({ config })

  const result = await payload.find({
    collection: 'products',
    where: {
      slug: { equals: slug },
      status: { equals: 'active' },
    },
    limit: 1,
    depth: 2,
  })

  const doc = result.docs[0] as unknown as Record<string, unknown> | undefined
  if (!doc) notFound()

  const images: { url: string }[] = []
  const rawImages = doc.images as { image: Record<string, unknown> | string }[] | undefined
  if (rawImages) {
    for (const item of rawImages) {
      const img = item.image
      if (typeof img === 'object' && img?.url) {
        images.push({ url: img.url as string })
      }
    }
  }

  const variants: { name: string; price: number; sku?: string }[] = []
  const rawVariants = doc.variants as { name: string; price: number; sku?: string }[] | undefined
  if (rawVariants) {
    for (const v of rawVariants) {
      variants.push({ name: v.name, price: v.price, sku: v.sku })
    }
  }

  const cat = typeof doc.category === 'object' && doc.category
    ? (doc.category as { title: string; slug: string })
    : null

  // Map bundle items
  const bundleItems: { product: { id: string; title: string; slug: string; price: number; images?: { url: string }[] } | null; quantity: number }[] = []
  const rawBundleItems = doc.bundleItems as { product: Record<string, unknown> | number; quantity: number }[] | undefined
  if (rawBundleItems) {
    for (const bi of rawBundleItems) {
      const bp = bi.product
      if (typeof bp === 'object' && bp?.id) {
        const bpImages: { url: string }[] = []
        const bpRawImages = bp.images as { image: Record<string, unknown> }[] | undefined
        if (bpRawImages) {
          for (const bpImg of bpRawImages) {
            if (typeof bpImg.image === 'object' && bpImg.image?.url) {
              bpImages.push({ url: bpImg.image.url as string })
            }
          }
        }
        bundleItems.push({
          product: {
            id: String(bp.id),
            title: bp.title as string,
            slug: bp.slug as string,
            price: bp.price as number,
            images: bpImages.length > 0 ? bpImages : undefined,
          },
          quantity: bi.quantity || 1,
        })
      } else {
        bundleItems.push({ product: null, quantity: bi.quantity || 1 })
      }
    }
  }

  const product = {
    id: doc.id as string,
    title: doc.title as string,
    slug: doc.slug as string,
    shortDescription: (doc.shortDescription as string) || '',
    description: doc.description || null,
    composition: doc.composition || null,
    usage: doc.usage || null,
    price: doc.price as number,
    oldPrice: (doc.oldPrice as number) || undefined,
    images,
    variants,
    inStock: doc.inStock !== false,
    featured: (doc.featured as boolean) || false,
    weight: (doc.weight as number) || undefined,
    sku: (doc.sku as string) || undefined,
    category: cat ? { title: cat.title, slug: cat.slug } : null,
    isBundle: (doc.isBundle as boolean) || false,
    bundleItems: bundleItems.length > 0 ? bundleItems : undefined,
  }

  return <ProductDetailClient product={product} />
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params
  const payload = await getPayload({ config })
  const result = await payload.find({
    collection: 'products',
    where: { slug: { equals: slug } },
    limit: 1,
  })
  const doc = result.docs[0] as unknown as Record<string, unknown> | undefined
  if (!doc) return { title: 'Товар не найден' }

  const seo = doc.seo as { title?: string; description?: string } | undefined
  return {
    title: seo?.title || `${doc.title} — ЭТРА`,
    description: seo?.description || (doc.shortDescription as string) || '',
  }
}
