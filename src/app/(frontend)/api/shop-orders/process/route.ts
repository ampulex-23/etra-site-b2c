import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

/**
 * POST /api/shop-orders/process
 * Creates delivery and payment records for an order
 * Called after order creation to avoid transaction issues
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { orderId } = body

    if (!orderId) {
      return NextResponse.json({ error: 'orderId is required' }, { status: 400 })
    }

    const payload = await getPayload({ config })

    // Fetch the order
    const order = await payload.findByID({
      collection: 'orders',
      id: orderId,
      depth: 1,
      overrideAccess: true,
    })

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    console.log('[orders/process] Processing order:', orderId)

    // Check if delivery already exists
    const existingDelivery = await payload.find({
      collection: 'deliveries',
      where: { order: { equals: orderId } },
      limit: 1,
      overrideAccess: true,
    })

    let deliveryId: string | null = null
    if (existingDelivery.docs.length > 0) {
      deliveryId = String(existingDelivery.docs[0].id)
      console.log('[orders/process] Delivery already exists:', deliveryId)
    } else {
      // Create delivery
      const deliveryMethod = order.delivery?.method || 'pickup'
      const customer = typeof order.customer === 'object' ? order.customer : null

      const deliveryData: Record<string, any> = {
        order: orderId,
        method: deliveryMethod,
        status: 'pending',
        recipient: {
          name: customer?.name || 'Клиент',
          phone: customer?.phone || '',
          email: customer?.email || '',
        },
        cost: order.deliveryCost || 0,
      }

      if (order.delivery?.address && deliveryMethod !== 'pickup') {
        deliveryData.address = {
          city: order.delivery.address.split(',')[0]?.trim() || '',
          street: order.delivery.address || '',
        }
      }

      const delivery = await payload.create({
        collection: 'deliveries',
        data: deliveryData as any,
        overrideAccess: true,
      })
      deliveryId = String(delivery.id)
      console.log('[orders/process] Created delivery:', deliveryId)
    }

    // Check if payment already exists
    const existingPayment = await payload.find({
      collection: 'payments',
      where: { order: { equals: orderId } },
      limit: 1,
      overrideAccess: true,
    })

    let paymentId: string | null = null
    if (existingPayment.docs.length > 0) {
      paymentId = String(existingPayment.docs[0].id)
      console.log('[orders/process] Payment already exists:', paymentId)
    } else {
      // Create payment
      const paymentMethod = order.payment?.method
      let method = 'cash'
      let gateway = 'none'
      if (paymentMethod === 'yokassa' || paymentMethod === 'tinkoff') {
        method = 'gateway'
        gateway = paymentMethod
      }

      const payment = await payload.create({
        collection: 'payments',
        data: {
          order: orderId,
          method: method as 'cash' | 'gateway' | 'card_transfer' | 'invoice',
          gateway: method === 'gateway' ? (gateway as 'yokassa' | 'tinkoff' | 'none') : undefined,
          status: (order.payment?.status || 'pending') as 'pending' | 'paid' | 'cancelled' | 'refunded',
          amount: order.total || 0,
        },
        overrideAccess: true,
      })
      paymentId = String(payment.id)
      console.log('[orders/process] Created payment:', paymentId)
    }

    // Link delivery and payment to order
    const linkData: Record<string, any> = {}
    if (deliveryId && !order.linkedDelivery) linkData.linkedDelivery = deliveryId
    if (paymentId && !order.linkedPayment) linkData.linkedPayment = paymentId

    if (Object.keys(linkData).length > 0) {
      await payload.update({
        collection: 'orders',
        id: orderId,
        data: linkData,
        overrideAccess: true,
      })
      console.log('[orders/process] Linked to order:', linkData)
    }

    return NextResponse.json({
      success: true,
      deliveryId,
      paymentId,
    })
  } catch (err) {
    console.error('[orders/process] Error:', err)
    const message = err instanceof Error ? err.message : 'Failed to process order'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
