import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

/**
 * GET /api/products/[id]/availability
 * Check if product is available (including bundle items check)
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const payload = await getPayload({ config })
    const productId = params.id

    const product = await payload.findByID({
      collection: 'products',
      id: productId,
      depth: 2,
      overrideAccess: true,
    })

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    // For regular products, just check stock levels
    if (!product.isBundle) {
      const stockLevels = await payload.find({
        collection: 'stock-levels',
        where: { product: { equals: productId } },
        limit: 100,
        overrideAccess: true,
      })

      const totalAvailable = stockLevels.docs.reduce(
        (sum: number, sl: any) => sum + (sl.available || 0),
        0
      )

      return NextResponse.json({
        available: totalAvailable > 0,
        quantity: totalAvailable,
        isBundle: false,
      })
    }

    // For bundles, check all items
    const bundleItems = product.bundleItems || []
    if (bundleItems.length === 0) {
      return NextResponse.json({
        available: false,
        quantity: 0,
        isBundle: true,
        reason: 'Bundle has no items',
      })
    }

    const itemsAvailability = []
    let minAvailableQuantity = Infinity

    for (const item of bundleItems) {
      const itemProductId = typeof item.product === 'object' ? item.product.id : item.product
      const requiredQty = item.quantity || 1

      const stockLevels = await payload.find({
        collection: 'stock-levels',
        where: { product: { equals: itemProductId } },
        limit: 100,
        overrideAccess: true,
      })

      const totalAvailable = stockLevels.docs.reduce(
        (sum: number, sl: any) => sum + (sl.available || 0),
        0
      )

      const maxBundles = Math.floor(totalAvailable / requiredQty)
      minAvailableQuantity = Math.min(minAvailableQuantity, maxBundles)

      itemsAvailability.push({
        productId: itemProductId,
        required: requiredQty,
        available: totalAvailable,
        maxBundles,
      })
    }

    return NextResponse.json({
      available: minAvailableQuantity > 0,
      quantity: minAvailableQuantity === Infinity ? 0 : minAvailableQuantity,
      isBundle: true,
      items: itemsAvailability,
    })
  } catch (err) {
    console.error('[products/availability] Error:', err)
    const message = err instanceof Error ? err.message : 'Failed to check availability'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
