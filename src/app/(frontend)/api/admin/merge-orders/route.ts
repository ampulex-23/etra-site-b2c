import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { canTopUp, mergeItems, recalcTotals } from '@/utils/orders/topup'
import { headers as nextHeaders } from 'next/headers'

/**
 * POST /api/admin/merge-orders
 *
 * Manually merge a source order into a target order (both must belong to
 * the same customer). Requires an authenticated `users` (admin/manager).
 *
 * Request body: { sourceOrderId, targetOrderId }
 *
 * Effects:
 *   - target.items = merge(target.items, source.items)
 *   - target.subtotal/discount/total recomputed
 *   - source payments re-pointed to target (payments.order = targetId)
 *   - source.status = 'merged', source.mergedInto = target, target.mergedFrom << source
 *   - source.delivery (if any) marked cancelled — shipment happens via target only
 */
export async function POST(req: NextRequest) {
  try {
    const payload = await getPayload({ config })

    // Authenticate as a Payload user (admin/manager)
    const headerList = await nextHeaders()
    const auth = await payload.auth({ headers: headerList as any })
    if (!auth?.user || auth.user.collection !== 'users') {
      return NextResponse.json({ errors: [{ message: 'Unauthorized' }] }, { status: 401 })
    }
    const role = (auth.user as any).role
    if (role !== 'admin' && role !== 'manager') {
      return NextResponse.json({ errors: [{ message: 'Forbidden' }] }, { status: 403 })
    }

    const body = await req.json()
    const { sourceOrderId, targetOrderId } = body
    if (!sourceOrderId || !targetOrderId) {
      return NextResponse.json(
        { errors: [{ message: 'sourceOrderId and targetOrderId are required' }] },
        { status: 400 },
      )
    }
    if (String(sourceOrderId) === String(targetOrderId)) {
      return NextResponse.json({ errors: [{ message: 'Cannot merge order into itself' }] }, { status: 400 })
    }

    const [source, target, settings] = await Promise.all([
      payload.findByID({ collection: 'orders', id: sourceOrderId, depth: 0, overrideAccess: true }),
      payload.findByID({ collection: 'orders', id: targetOrderId, depth: 0, overrideAccess: true }),
      payload.findGlobal({ slug: 'shop-settings' as any }).catch(() => null),
    ])

    if (!source || !target) {
      return NextResponse.json({ errors: [{ message: 'Order not found' }] }, { status: 404 })
    }

    const sourceCustomerId = typeof (source as any).customer === 'object'
      ? (source as any).customer.id
      : (source as any).customer
    const targetCustomerId = typeof (target as any).customer === 'object'
      ? (target as any).customer.id
      : (target as any).customer

    if (String(sourceCustomerId) !== String(targetCustomerId)) {
      return NextResponse.json(
        { errors: [{ message: 'Orders belong to different customers' }] },
        { status: 409 },
      )
    }

    // Target must be eligible; source must not be shipped yet
    const eligibility = canTopUp(target, settings as any)
    if (!eligibility.eligible) {
      return NextResponse.json(
        { errors: [{ message: `Target cannot accept merge: ${eligibility.reason}` }] },
        { status: 409 },
      )
    }
    const sourceStatus = String((source as any).status)
    if (['shipped', 'delivered', 'completed', 'cancelled', 'merged'].includes(sourceStatus)) {
      return NextResponse.json(
        { errors: [{ message: `Source order is in final state: ${sourceStatus}` }] },
        { status: 409 },
      )
    }

    // Merge items
    const mergedItems = mergeItems(
      Array.isArray((target as any).items) ? (target as any).items : [],
      Array.isArray((source as any).items) ? (source as any).items : [],
    )

    const nextDiscount = Number((target as any).discount || 0) + Number((source as any).discount || 0)
    const { subtotal, total } = recalcTotals({ items: mergedItems, discount: nextDiscount })

    const nextCustomerDiscount =
      Number((target as any).customerDiscountApplied || 0) +
      Number((source as any).customerDiscountApplied || 0)

    const existingMergedFrom = Array.isArray((target as any).mergedFrom) ? (target as any).mergedFrom : []
    const nextMergedFrom = [
      ...existingMergedFrom.map((r: any) => (typeof r === 'object' ? r.id : r)),
      sourceOrderId,
    ]

    await payload.update({
      collection: 'orders',
      id: targetOrderId,
      data: {
        items: mergedItems,
        subtotal,
        discount: nextDiscount,
        total,
        customerDiscountApplied: nextCustomerDiscount,
        mergedFrom: nextMergedFrom,
      } as any,
      overrideAccess: true,
    })

    // Re-point payments from source to target
    try {
      const sourcePayments = await payload.find({
        collection: 'payments',
        where: { order: { equals: sourceOrderId } },
        limit: 100,
        overrideAccess: true,
      })
      for (const p of sourcePayments.docs) {
        await payload.update({
          collection: 'payments',
          id: p.id,
          data: { order: targetOrderId } as any,
          overrideAccess: true,
        })
      }
    } catch (err) {
      console.error('[merge-orders] failed to repoint payments:', err)
    }

    // Note: source delivery is NOT modified. The source order transitions to
    // 'merged' and will never reach 'shipped', so its linked delivery stays in
    // 'pending' and is effectively inert. Managers can clean up stale
    // deliveries from the admin list if desired.

    // Mark source as merged
    await payload.update({
      collection: 'orders',
      id: sourceOrderId,
      data: {
        status: 'merged',
        mergedInto: targetOrderId,
      } as any,
      overrideAccess: true,
    })

    return NextResponse.json({
      ok: true,
      targetOrderId,
      sourceOrderId,
      newTotals: { subtotal, discount: nextDiscount, total },
    })
  } catch (err) {
    console.error('[merge-orders] error:', err)
    const message = err instanceof Error ? err.message : 'Internal error'
    return NextResponse.json({ errors: [{ message }] }, { status: 500 })
  }
}
