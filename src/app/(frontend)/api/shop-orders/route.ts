import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import crypto from 'crypto'

/**
 * Authenticate customer from Authorization header.
 *
 * Decodes the JWT manually (Payload v3's `payload.auth()` does not accept the
 * `JWT <token>` scheme for custom collections like `customers`). Supports the
 * full HS256/HS384/HS512 family because Payload's tokens may be issued with
 * different algorithms or extended claim sets (e.g. for Telegram-linked
 * accounts) which made our previous fixed HS256 check reject valid tokens.
 *
 * Also supports the `payload-token` cookie as a fallback for browsers that
 * already have a session.
 */
function extractToken(headers: Headers): string | null {
  const auth = headers.get('Authorization')
  if (auth) {
    const m = auth.match(/^(?:JWT|Bearer)\s+(.+)$/i)
    if (m) return m[1].trim()
  }
  const cookie = headers.get('Cookie')
  if (cookie) {
    for (const part of cookie.split(';')) {
      const [k, ...rest] = part.trim().split('=')
      if (k === 'payload-token' || k === 'etra-customer-token') {
        return decodeURIComponent(rest.join('=')).trim()
      }
    }
  }
  return null
}

const HMAC_ALG_MAP: Record<string, string> = {
  HS256: 'sha256',
  HS384: 'sha384',
  HS512: 'sha512',
}

async function authenticateCustomer(
  payload: any,
  headers: Headers,
): Promise<{ id: string | number; email?: string } | null> {
  const token = extractToken(headers)
  if (!token) return null
  const secret = process.env.PAYLOAD_SECRET || ''
  if (!secret) return null

  const parts = token.split('.')
  if (parts.length !== 3) return null
  const [headerB64, bodyB64, signatureB64] = parts

  let alg = 'sha256'
  try {
    const headerObj = JSON.parse(Buffer.from(headerB64, 'base64url').toString()) as {
      alg?: string
    }
    if (headerObj?.alg && HMAC_ALG_MAP[headerObj.alg]) {
      alg = HMAC_ALG_MAP[headerObj.alg]
    }
  } catch {
    /* fallthrough — default sha256 */
  }

  const expectedSig = crypto
    .createHmac(alg, secret)
    .update(`${headerB64}.${bodyB64}`)
    .digest('base64url')

  if (signatureB64 !== expectedSig) {
    console.warn('[Orders API] JWT signature mismatch (alg:', alg, ', token len:', token.length, ')')
    return null
  }

  let decoded: { id?: string | number; email?: string; collection?: string; exp?: number } = {}
  try {
    decoded = JSON.parse(Buffer.from(bodyB64, 'base64url').toString())
  } catch {
    return null
  }
  if (!decoded?.id || decoded.collection !== 'customers') return null
  if (decoded.exp && decoded.exp < Math.floor(Date.now() / 1000)) {
    console.warn('[Orders API] JWT expired')
    return null
  }

  // Verify the customer still exists (helps surface "Не найдено" early instead
  // of having afterChange hooks fail mid-create).
  try {
    const customer = await payload.findByID({
      collection: 'customers',
      id: decoded.id,
      depth: 0,
      overrideAccess: true,
    })
    if (!customer) return null
  } catch (err) {
    console.warn('[Orders API] Customer not found for token id', decoded.id, err)
    return null
  }

  return { id: decoded.id, email: decoded.email }
}

/**
 * Reserve stock for order items
 */
async function reserveStock(payload: any, order: any) {
  const items: any[] = order.items || []
  for (const item of items) {
    const productId = typeof item.product === 'object' ? item.product.id : item.product
    const quantity = item.quantity || 1
    if (!productId) continue

    try {
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

      if (remaining > 0) {
        console.warn(`[Orders API] Not enough stock for product ${productId}, short by ${remaining}`)
      }
    } catch (err) {
      console.error(`[Orders API] Error reserving stock for product ${productId}:`, err)
    }
  }
}

/**
 * Create delivery and payment records asynchronously
 */
async function createRelatedRecordsAsync(payload: any, order: any, body: any) {
  // First, reserve stock
  try {
    await reserveStock(payload, order)
    console.log('[Orders API] Stock reserved for order:', order.id)
  } catch (err) {
    console.error('[Orders API] Error reserving stock:', err)
  }

  let deliveryId: string | null = null
  let paymentId: string | null = null

  try {
    // Create delivery
    const deliveryMethod = order.delivery?.method || 'pickup'
    const customer = typeof order.customer === 'object' ? order.customer : null

    const deliveryData: Record<string, any> = {
      order: order.id,
      method: deliveryMethod,
      status: 'pending',
      recipient: {
        name: customer?.name || body.customerName || 'Клиент',
        phone: customer?.phone || body.customerPhone || '',
        email: customer?.email || body.customerEmail || '',
      },
      cost: order.deliveryCost || 0,
    }

    if (order.delivery?.address && deliveryMethod !== 'pickup') {
      deliveryData.address = {
        city: String(order.delivery.address).split(',')[0]?.trim() || '',
        street: order.delivery.address || '',
      }
    }

    const delivery = await payload.create({
      collection: 'deliveries',
      data: deliveryData as any,
      overrideAccess: true,
    })
    deliveryId = String(delivery.id)
    console.log('[Orders API] Created delivery:', deliveryId)
  } catch (deliveryErr) {
    console.error('[Orders API] Error creating delivery:', deliveryErr)
  }

  try {
    // Create payment
    const paymentMethod = order.payment?.method
    let method: 'cash' | 'gateway' = 'cash'
    let gateway: 'yokassa' | 'tinkoff' | 'none' = 'none'
    if (paymentMethod === 'yokassa' || paymentMethod === 'tinkoff') {
      method = 'gateway'
      gateway = paymentMethod
    }

    const payment = await payload.create({
      collection: 'payments',
      data: {
        order: order.id,
        method,
        gateway: method === 'gateway' ? gateway : undefined,
        status: 'pending' as const,
        amount: order.total || 0,
      } as any,
      overrideAccess: true,
    })
    paymentId = String(payment.id)
    console.log('[Orders API] Created payment:', paymentId)
  } catch (paymentErr) {
    console.error('[Orders API] Error creating payment:', paymentErr)
  }

  // Link delivery and payment to order
  if (deliveryId || paymentId) {
    try {
      const linkData: Record<string, any> = {}
      if (deliveryId) linkData.linkedDelivery = deliveryId
      if (paymentId) linkData.linkedPayment = paymentId

      await payload.update({
        collection: 'orders',
        id: order.id,
        data: linkData,
        overrideAccess: true,
      })
      console.log('[Orders API] Linked delivery/payment to order')
    } catch (linkErr) {
      console.error('[Orders API] Error linking delivery/payment:', linkErr)
    }
  }
}

/**
 * POST /api/shop-orders - Create a new order
 */
export async function POST(req: NextRequest) {
  const t0 = Date.now()
  try {
    console.log('[Orders API] Auth header present:', !!req.headers.get('Authorization'))

    const payload = await getPayload({ config })

    const auth = await authenticateCustomer(payload, req.headers)
    if (!auth) {
      console.log('[Orders API] Auth rejected')
      return NextResponse.json({ errors: [{ message: 'Invalid token' }] }, { status: 401 })
    }
    console.log('[Orders API] Authenticated customer:', auth.id, 'in', Date.now() - t0, 'ms')

    const body = await req.json()

    // Validate required fields
    if (!body.items || !Array.isArray(body.items) || body.items.length === 0) {
      return NextResponse.json({ errors: [{ message: 'Items are required' }] }, { status: 400 })
    }

    const tCreate = Date.now()
    // Create order
    const order = await payload.create({
      collection: 'orders',
      data: {
        orderNumber: body.orderNumber || `ETR-${Date.now().toString(36).toUpperCase()}`,
        customer: auth.id as any,
        items: body.items,
        subtotal: body.subtotal || 0,
        deliveryCost: body.deliveryCost || 0,
        total: body.total || 0,
        status: body.status || 'new',
        delivery: body.delivery || { method: 'pickup', address: 'Самовывоз' },
        notes: body.notes || '',
        payment: body.payment || { status: 'pending' },
        source: 'site',
      } as any,
      overrideAccess: true,
    })
    console.log('[Orders API] payload.create done in', Date.now() - tCreate, 'ms, order:', order.id)

    // Return order immediately to client
    const response = NextResponse.json(order, { status: 201 })

    // Create delivery and payment asynchronously (don't await)
    console.log('[Orders API] Scheduling async creation of delivery/payment for order:', order.id)

    createRelatedRecordsAsync(payload, order, body).catch((err: Error) => {
      console.error('[Orders API] Error in async creation:', err)
    })

    console.log('[Orders API] Responding 201 in', Date.now() - t0, 'ms')
    return response
  } catch (err) {
    console.error('Create order error:', err)
    if (err instanceof Error) {
      console.error('Error stack:', err.stack)
      console.error('Error name:', err.name)
    }
    const message = err instanceof Error ? err.message : 'Failed to create order'
    return NextResponse.json({ errors: [{ message }] }, { status: 500 })
  }
}

/**
 * GET /api/shop-orders - Get customer's orders
 */
export async function GET(req: NextRequest) {
  try {
    const payload = await getPayload({ config })

    const auth = await authenticateCustomer(payload, req.headers)
    if (!auth) {
      return NextResponse.json({ errors: [{ message: 'Invalid token' }] }, { status: 401 })
    }

    const orders = await payload.find({
      collection: 'orders',
      where: { customer: { equals: auth.id } },
      sort: '-createdAt',
      depth: 1,
      overrideAccess: true,
    })

    return NextResponse.json(orders)
  } catch (err) {
    console.error('Get orders error:', err)
    return NextResponse.json({ errors: [{ message: 'Failed to get orders' }] }, { status: 500 })
  }
}
