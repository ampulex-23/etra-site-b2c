import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { getCustomerFromRequest } from '@/utils/auth/verifyCustomerJwt'
import { findTopUpTarget } from '@/utils/orders/topup'

/**
 * GET /api/shop-orders/eligible-top-up-target
 *
 * Returns the earliest open order of the current customer that can still
 * accept additional items, or `{ target: null }` if none.
 *
 * Response shape:
 *   { target: null }
 *   { target: { id, orderNumber, total, createdAt, deliveryMethod, deliveryAddress, itemsCount } }
 */
export async function GET(req: NextRequest) {
  try {
    const customer = getCustomerFromRequest(req)
    if (!customer) {
      return NextResponse.json({ errors: [{ message: 'Unauthorized' }] }, { status: 401 })
    }

    const payload = await getPayload({ config })

    const settings = (await payload
      .findGlobal({ slug: 'shop-settings' as any })
      .catch(() => null)) as any

    if (settings?.topUpEnabled === false) {
      return NextResponse.json({ target: null, disabled: true })
    }

    const target = await findTopUpTarget({
      payload,
      customerId: customer.id,
      settings,
    })

    if (!target) return NextResponse.json({ target: null })

    return NextResponse.json({
      target: {
        id: target.id,
        orderNumber: target.orderNumber,
        status: target.status,
        total: target.total,
        createdAt: target.createdAt,
        itemsCount: Array.isArray(target.items) ? target.items.length : 0,
        delivery: {
          method: target.delivery?.method || 'pickup',
          address: target.delivery?.address || '',
        },
      },
    })
  } catch (err) {
    console.error('[eligible-top-up-target] error:', err)
    return NextResponse.json({ errors: [{ message: 'Internal error' }] }, { status: 500 })
  }
}
