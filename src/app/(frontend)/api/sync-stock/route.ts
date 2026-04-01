import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

/**
 * POST /api/sync-stock
 * Synchronizes inStock flag for all products based on stock-levels
 */
export async function POST() {
  try {
    const payload = await getPayload({ config })

    // Get all active products
    const products = await payload.find({
      collection: 'products',
      where: { status: { equals: 'active' } },
      limit: 1000,
      overrideAccess: true,
    })

    let updated = 0
    let outOfStock = 0

    for (const product of products.docs) {
      // Get stock levels for this product
      const stockLevels = await payload.find({
        collection: 'stock-levels',
        where: { product: { equals: product.id } },
        limit: 100,
        overrideAccess: true,
      })

      const totalAvailable = stockLevels.docs.reduce(
        (sum: number, sl: any) => sum + (sl.available || 0),
        0
      )

      const shouldBeInStock = totalAvailable > 0
      const currentInStock = product.inStock !== false

      // Update only if changed
      if (shouldBeInStock !== currentInStock) {
        await payload.update({
          collection: 'products',
          id: product.id,
          data: { inStock: shouldBeInStock },
          overrideAccess: true,
        })
        updated++
        if (!shouldBeInStock) outOfStock++
      } else if (!shouldBeInStock) {
        outOfStock++
      }
    }

    return NextResponse.json({
      success: true,
      total: products.docs.length,
      updated,
      outOfStock,
      message: `Синхронизировано ${updated} товаров. Нет в наличии: ${outOfStock}`,
    })
  } catch (err) {
    console.error('[sync-stock] Error:', err)
    const message = err instanceof Error ? err.message : 'Failed to sync stock'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

/**
 * GET /api/sync-stock
 * Returns current stock status for all products
 */
export async function GET() {
  try {
    const payload = await getPayload({ config })

    const products = await payload.find({
      collection: 'products',
      where: { status: { equals: 'active' } },
      limit: 1000,
      overrideAccess: true,
    })

    const result = []

    for (const product of products.docs) {
      const stockLevels = await payload.find({
        collection: 'stock-levels',
        where: { product: { equals: product.id } },
        limit: 100,
        overrideAccess: true,
      })

      const totalAvailable = stockLevels.docs.reduce(
        (sum: number, sl: any) => sum + (sl.available || 0),
        0
      )

      result.push({
        id: product.id,
        title: product.title,
        inStock: product.inStock,
        available: totalAvailable,
        needsSync: (totalAvailable > 0) !== (product.inStock !== false),
      })
    }

    const outOfStock = result.filter(p => p.available === 0)
    const needsSync = result.filter(p => p.needsSync)

    return NextResponse.json({
      total: result.length,
      outOfStock: outOfStock.length,
      needsSync: needsSync.length,
      products: result,
    })
  } catch (err) {
    console.error('[sync-stock] Error:', err)
    const message = err instanceof Error ? err.message : 'Failed to get stock status'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
