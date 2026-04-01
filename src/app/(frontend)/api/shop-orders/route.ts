import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import crypto from 'crypto'

interface JwtPayload {
  id: string
  email: string
  collection: string
  iat: number
  exp: number
}

function verifyJwt(token: string, secret: string): JwtPayload | null {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null
    
    const [header, payload, signature] = parts
    
    // Verify signature
    const expectedSig = crypto
      .createHmac('sha256', secret)
      .update(`${header}.${payload}`)
      .digest('base64url')
    
    if (signature !== expectedSig) return null
    
    // Decode payload
    const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString())
    return decoded as JwtPayload
  } catch {
    return null
  }
}

/**
 * POST /api/shop-orders - Create a new order
 */
export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization')
    console.log('[Orders API] Auth header present:', !!authHeader)
    
    if (!authHeader || !authHeader.startsWith('JWT ')) {
      console.log('[Orders API] No JWT header')
      return NextResponse.json({ errors: [{ message: 'Unauthorized' }] }, { status: 401 })
    }

    const token = authHeader.replace('JWT ', '')
    console.log('[Orders API] Token length:', token.length)
    
    const decoded = verifyJwt(token, process.env.PAYLOAD_SECRET || '')
    console.log('[Orders API] Decoded:', decoded ? { id: decoded.id, collection: decoded.collection } : 'null')
    
    if (!decoded || !decoded.id || decoded.collection !== 'customers') {
      console.log('[Orders API] Invalid token - decoded:', !!decoded, 'id:', decoded?.id, 'collection:', decoded?.collection)
      return NextResponse.json({ errors: [{ message: 'Invalid token' }] }, { status: 401 })
    }

    // Check expiration
    if (decoded.exp && decoded.exp < Math.floor(Date.now() / 1000)) {
      console.log('[Orders API] Token expired')
      return NextResponse.json({ errors: [{ message: 'Token expired' }] }, { status: 401 })
    }

    const body = await req.json()
    console.log('[Orders API] Creating order for customer:', decoded.id)
    
    const payload = await getPayload({ config })

    // Validate required fields
    if (!body.items || !Array.isArray(body.items) || body.items.length === 0) {
      return NextResponse.json({ errors: [{ message: 'Items are required' }] }, { status: 400 })
    }

    console.log('[Orders API] Customer ID from token:', decoded.id)

    // Create order
    const order = await payload.create({
      collection: 'orders',
      data: {
        orderNumber: body.orderNumber || `ETR-${Date.now().toString(36).toUpperCase()}`,
        customer: decoded.id as any,
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
    })

    // Create delivery and payment records directly (after order is created)
    console.log('[Orders API] Creating delivery and payment for order:', order.id)
    
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

    return NextResponse.json(order, { status: 201 })
  } catch (err) {
    console.error('Create order error:', err)
    // Log full error details
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
    const authHeader = req.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('JWT ')) {
      return NextResponse.json({ errors: [{ message: 'Unauthorized' }] }, { status: 401 })
    }

    const token = authHeader.replace('JWT ', '')
    const decoded = verifyJwt(token, process.env.PAYLOAD_SECRET || '')
    
    if (!decoded || !decoded.id || decoded.collection !== 'customers') {
      return NextResponse.json({ errors: [{ message: 'Invalid token' }] }, { status: 401 })
    }

    const payload = await getPayload({ config })

    const orders = await payload.find({
      collection: 'orders',
      where: { customer: { equals: decoded.id } },
      sort: '-createdAt',
      depth: 1,
    })

    return NextResponse.json(orders)
  } catch (err) {
    console.error('Get orders error:', err)
    return NextResponse.json({ errors: [{ message: 'Failed to get orders' }] }, { status: 500 })
  }
}
