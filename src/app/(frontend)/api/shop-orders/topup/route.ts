import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { getCustomerFromRequest } from '@/utils/auth/verifyCustomerJwt'
import { canTopUp, mergeItems, recalcTotals } from '@/utils/orders/topup'

/**
 * POST /api/shop-orders/topup
 *
 * Add items to an existing open order instead of creating a new one.
 * Request body:
 *   {
 *     targetOrderId: string,
 *     items: [{ product, variantName?, quantity, price }],
 *     deltaDiscount?: number,       // additional discount (from promo in second checkout)
 *     promoCodeApplied?: string,    // canonical promo code for the delta (optional)
 *     paymentMethod?: 'yokassa'|'tinkoff'|'cash',
 *   }
 *
 * Response:
 *   { orderId, paymentId, delta: { subtotal, total }, newTotals: { subtotal, total } }
 *
 * Side effects:
 *   - merges items into the target order (aggregated by product+variant)
 *   - reserves stock for the delta items
 *   - creates a new Payment row (status=pending)
 *   - appends delta discount to order.discount / customerDiscountApplied
 *   - does NOT create or modify the Delivery record
 */
export async function POST(req: NextRequest) {
  try {
    const customer = getCustomerFromRequest(req)
    if (!customer) {
      return NextResponse.json({ errors: [{ message: 'Unauthorized' }] }, { status: 401 })
    }

    const body = await req.json()
    const { targetOrderId, items: addItems, deltaDiscount, promoCodeApplied, paymentMethod } = body

    if (!targetOrderId) {
      return NextResponse.json({ errors: [{ message: 'targetOrderId is required' }] }, { status: 400 })
    }
    if (!Array.isArray(addItems) || addItems.length === 0) {
      return NextResponse.json({ errors: [{ message: 'items are required' }] }, { status: 400 })
    }

    const payload = await getPayload({ config })

    // Load target order + settings
    const [target, settings] = await Promise.all([
      payload.findByID({ collection: 'orders', id: targetOrderId, depth: 0, overrideAccess: true }),
      payload.findGlobal({ slug: 'shop-settings' as any }).catch(() => null),
    ])

    if (!target) {
      return NextResponse.json({ errors: [{ message: 'Order not found' }] }, { status: 404 })
    }

    // Ownership check
    const targetCustomerId = typeof (target as any).customer === 'object'
      ? (target as any).customer.id
      : (target as any).customer
    if (String(targetCustomerId) !== String(customer.id)) {
      return NextResponse.json({ errors: [{ message: 'Forbidden' }] }, { status: 403 })
    }

    // Eligibility check
    const eligibility = canTopUp(target, settings as any)
    if (!eligibility.eligible) {
      return NextResponse.json(
        { errors: [{ message: `Order cannot be topped up: ${eligibility.reason}` }] },
        { status: 409 },
      )
    }

    // Validate & normalise added items (price must come from server-side to avoid tampering)
    const verifiedItems: Array<{ product: string | number; variantName: string; quantity: number; price: number }> = []
    for (const raw of addItems) {
      const productId = typeof raw.product === 'object' ? raw.product?.id : raw.product
      if (!productId) continue
      const qty = Math.max(1, Number(raw.quantity) || 1)

      const product = await payload.findByID({ collection: 'products', id: productId, depth: 0, overrideAccess: true }).catch(() => null)
      if (!product) {
        return NextResponse.json({ errors: [{ message: `Product ${productId} not found` }] }, { status: 400 })
      }

      // Resolve price: variant > product
      let price = Number((product as any).price || 0)
      const variantName = (raw.variantName || '').toString().trim()
      if (variantName && Array.isArray((product as any).variants)) {
        const variant = (product as any).variants.find((v: any) => v.name === variantName)
        if (variant?.price != null) price = Number(variant.price)
      }

      verifiedItems.push({ product: productId, variantName, quantity: qty, price })
    }

    if (verifiedItems.length === 0) {
      return NextResponse.json({ errors: [{ message: 'No valid items' }] }, { status: 400 })
    }

    // Compute delta amounts BEFORE merging
    const deltaSubtotal = verifiedItems.reduce((s, it) => s + it.price * it.quantity, 0)
    const appliedDeltaDiscount = Math.max(0, Math.min(Number(deltaDiscount) || 0, deltaSubtotal))
    const deltaTotal = Math.max(0, deltaSubtotal - appliedDeltaDiscount)

    if (deltaTotal <= 0) {
      return NextResponse.json({ errors: [{ message: 'Delta total must be positive' }] }, { status: 400 })
    }

    // Merge items
    const existing = Array.isArray((target as any).items) ? (target as any).items : []
    const mergedItems = mergeItems(existing as any, verifiedItems as any)

    const nextDiscount = Number((target as any).discount || 0) + appliedDeltaDiscount
    const { subtotal: newSubtotal, total: newTotal } = recalcTotals({
      items: mergedItems,
      discount: nextDiscount,
    })

    // Re-check eligibility inside the "transaction window" (optimistic)
    const targetFresh = await payload.findByID({ collection: 'orders', id: targetOrderId, depth: 0, overrideAccess: true })
    const recheck = canTopUp(targetFresh, settings as any)
    if (!recheck.eligible) {
      return NextResponse.json(
        { errors: [{ message: `Order state changed: ${recheck.reason}` }] },
        { status: 409 },
      )
    }

    // Reserve stock for the added items
    try {
      await reserveStockForItems(payload, verifiedItems)
    } catch (err) {
      console.error('[topup] stock reservation failed:', err)
      // Continue — order updates should not block on stock reservation
    }

    // Update the order
    const updateData: Record<string, any> = {
      items: mergedItems,
      subtotal: newSubtotal,
      discount: nextDiscount,
      total: newTotal,
    }
    if (promoCodeApplied) {
      // Append to existing promoCodeApplied log (append rather than replace)
      const existingPromo = (targetFresh as any).promoCodeApplied || ''
      updateData.promoCodeApplied = existingPromo
        ? `${existingPromo},${promoCodeApplied}`.slice(0, 250)
        : promoCodeApplied
    }
    if (appliedDeltaDiscount > 0) {
      updateData.customerDiscountApplied =
        Number((targetFresh as any).customerDiscountApplied || 0) + appliedDeltaDiscount
    }

    await payload.update({
      collection: 'orders',
      id: targetOrderId,
      data: updateData,
      overrideAccess: true,
    })

    // Create a new Payment for the delta
    let gateway: 'yokassa' | 'tinkoff' | 'none' = 'none'
    let method: 'cash' | 'gateway' = 'cash'
    if (paymentMethod === 'yokassa' || paymentMethod === 'tinkoff') {
      method = 'gateway'
      gateway = paymentMethod
    } else if (paymentMethod === 'cash') {
      method = 'cash'
    }

    const newPayment = await payload.create({
      collection: 'payments',
      data: {
        order: targetOrderId,
        method,
        gateway: method === 'gateway' ? gateway : undefined,
        status: 'pending' as const,
        amount: deltaTotal,
        notes: `Докомплектация: +${verifiedItems.length} позиц. на ${deltaTotal}₽`,
      } as any,
      overrideAccess: true,
    })

    return NextResponse.json(
      {
        orderId: targetOrderId,
        paymentId: newPayment.id,
        delta: { subtotal: deltaSubtotal, discount: appliedDeltaDiscount, total: deltaTotal },
        newTotals: { subtotal: newSubtotal, discount: nextDiscount, total: newTotal },
      },
      { status: 201 },
    )
  } catch (err) {
    console.error('[topup] error:', err)
    const message = err instanceof Error ? err.message : 'Internal error'
    return NextResponse.json({ errors: [{ message }] }, { status: 500 })
  }
}

async function reserveStockForItems(
  payload: any,
  items: Array<{ product: string | number; quantity: number }>,
) {
  for (const item of items) {
    const productId = item.product
    const quantity = item.quantity
    if (!productId || quantity <= 0) continue

    const stockLevels = await payload.find({
      collection: 'stock-levels',
      where: {
        product: { equals: productId },
        available: { greater_than: 0 },
      },
      limit: 10,
      overrideAccess: true,
    })

    let remaining = quantity
    for (const sl of stockLevels.docs) {
      if (remaining <= 0) break
      const canReserve = Math.min(remaining, sl.available || 0)
      if (canReserve <= 0) continue

      await payload.update({
        collection: 'stock-levels',
        id: sl.id,
        data: {
          reserved: (sl.reserved || 0) + canReserve,
          available: Math.max(0, (sl.available || 0) - canReserve),
        },
        overrideAccess: true,
      })
      remaining -= canReserve
    }
  }
}
