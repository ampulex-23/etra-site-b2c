import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { canTopUp } from '@/utils/orders/topup'
import { headers as nextHeaders } from 'next/headers'

/**
 * GET /api/admin/merge-candidates?orderId=...
 *
 * Returns other open orders of the same customer that could accept a merge.
 * Used by the admin `OrderMergeButton` component.
 */
export async function GET(req: NextRequest) {
  try {
    const payload = await getPayload({ config })
    const headerList = await nextHeaders()
    const auth = await payload.auth({ headers: headerList as any })
    if (!auth?.user || auth.user.collection !== 'users') {
      return NextResponse.json({ errors: [{ message: 'Unauthorized' }] }, { status: 401 })
    }

    const orderId = req.nextUrl.searchParams.get('orderId')
    if (!orderId) {
      return NextResponse.json({ errors: [{ message: 'orderId is required' }] }, { status: 400 })
    }

    const source = await payload.findByID({
      collection: 'orders',
      id: orderId,
      depth: 0,
      overrideAccess: true,
    })
    if (!source) {
      return NextResponse.json({ errors: [{ message: 'Order not found' }] }, { status: 404 })
    }

    const customerId = typeof (source as any).customer === 'object'
      ? (source as any).customer.id
      : (source as any).customer
    if (!customerId) return NextResponse.json({ candidates: [] })

    const settings = (await payload
      .findGlobal({ slug: 'shop-settings' as any })
      .catch(() => null)) as any

    const siblings = await payload.find({
      collection: 'orders',
      where: {
        and: [
          { customer: { equals: customerId } },
          { status: { in: ['new', 'processing'] } },
          { id: { not_equals: orderId } },
        ],
      },
      sort: '-createdAt',
      limit: 20,
      depth: 0,
      overrideAccess: true,
    })

    const candidates = siblings.docs
      .filter((o: any) => canTopUp(o, settings).eligible)
      .map((o: any) => ({
        id: o.id,
        orderNumber: o.orderNumber,
        status: o.status,
        total: o.total,
        createdAt: o.createdAt,
        itemsCount: Array.isArray(o.items) ? o.items.length : 0,
      }))

    return NextResponse.json({ candidates })
  } catch (err) {
    console.error('[merge-candidates] error:', err)
    return NextResponse.json({ errors: [{ message: 'Internal error' }] }, { status: 500 })
  }
}
