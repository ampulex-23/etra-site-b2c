import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

/**
 * POST /api/cdek/webhook
 * Receives CDEK ORDER_STATUS webhook events.
 * CDEK sends: { type, date_time, uuid, attributes: { is_return, cdek_number, number, status_code, status_date_time, city_name } }
 */

const CDEK_STATUS_MAP: Record<string, string> = {
  CREATED: 'pending',
  RECEIVED_AT_SENDER_WAREHOUSE: 'handed_over',
  READY_FOR_SHIPMENT_AT_SENDER_WAREHOUSE: 'handed_over',
  ACCEPTED_AT_SENDER_WAREHOUSE: 'handed_over',
  ACCEPTED_AT_WAREHOUSE_ON_DEMAND: 'handed_over',
  SENT_TO_TRANSIT_WAREHOUSE: 'in_transit',
  ACCEPTED_AT_TRANSIT_WAREHOUSE: 'in_transit',
  SENT_TO_RECIPIENT_CITY: 'in_transit',
  ACCEPTED_AT_RECIPIENT_CITY_WAREHOUSE: 'in_transit',
  ACCEPTED_AT_PICK_UP_POINT: 'arrived_at_pickup',
  TAKEN_BY_COURIER: 'in_transit',
  DELIVERED: 'delivered',
  NOT_DELIVERED: 'returned',
  RETURNED_TO_SENDER_CITY_WAREHOUSE: 'returned',
  RETURNED_TO_SENDER: 'returned',
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { type, uuid, attributes } = body

    if (type !== 'ORDER_STATUS') {
      return NextResponse.json({ ok: true })
    }

    const cdekNumber = attributes?.cdek_number
    const statusCode = attributes?.status_code
    const orderNumber = attributes?.number

    if (!statusCode) {
      return NextResponse.json({ ok: true })
    }

    const payload = await getPayload({ config })

    // Find delivery by cdekOrderUuid or trackingNumber
    const deliveries = await payload.find({
      collection: 'deliveries',
      where: {
        or: [
          ...(uuid ? [{ cdekOrderUuid: { equals: uuid } }] : []),
          ...(cdekNumber ? [{ trackingNumber: { equals: String(cdekNumber) } }] : []),
        ],
      },
      limit: 1,
    })

    if (deliveries.docs.length === 0) {
      console.warn(`[CDEK webhook] Delivery not found for uuid=${uuid}, cdek_number=${cdekNumber}, order=${orderNumber}`)
      return NextResponse.json({ ok: true })
    }

    const delivery = deliveries.docs[0]
    const newStatus: string = CDEK_STATUS_MAP[statusCode as string] || (delivery.status as string) || 'pending'

    const updateData: Record<string, unknown> = { status: newStatus }

    if (cdekNumber && !delivery.trackingNumber) {
      updateData.trackingNumber = String(cdekNumber)
    }

    if (statusCode === 'DELIVERED') {
      updateData.deliveredAt = new Date().toISOString()
    }

    await payload.update({
      collection: 'deliveries',
      id: delivery.id,
      data: updateData,
    })

    // Sync Order status based on delivery status
    if (delivery.order) {
      const orderId = typeof delivery.order === 'object' ? delivery.order.id : delivery.order
      const ORDER_STATUS_MAP: Record<string, string> = {
        'in_transit': 'shipped',
        'arrived_at_pickup': 'shipped',
        'delivered': 'delivered',
        'returned': 'cancelled',
      }
      const orderStatus = newStatus ? ORDER_STATUS_MAP[newStatus] : undefined
      if (orderStatus) {
        try {
          const order = await payload.findByID({ collection: 'orders', id: orderId, depth: 0 })
          // Only advance status, never go backwards (except return)
          const ORDER_PRIORITY: Record<string, number> = {
            new: 0, processing: 1, shipped: 2, delivered: 3, completed: 4, cancelled: 5,
          }
          const currentStatus: string = (order?.status as string) || 'new'
          const currentPriority = ORDER_PRIORITY[currentStatus] ?? 0
          const newPriority = ORDER_PRIORITY[orderStatus] ?? 0
          if (newPriority > currentPriority || orderStatus === 'cancelled') {
            const orderUpdateData: Record<string, unknown> = { status: orderStatus }
            if (orderStatus === 'shipped' && (delivery.trackingNumber || cdekNumber)) {
              orderUpdateData['delivery'] = {
                ...((order as any)?.delivery || {}),
                trackingNumber: delivery.trackingNumber || String(cdekNumber),
              }
            }
            await payload.update({
              collection: 'orders',
              id: orderId,
              data: orderUpdateData as any,
            })
          }
        } catch (e) {
          console.error('[CDEK webhook] Failed to update order status', e)
        }
      }
    }

    console.log(`[CDEK webhook] Delivery ${delivery.id} updated: status=${newStatus}, cdek_status=${statusCode}`)

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[CDEK webhook] Error:', err)
    return NextResponse.json({ ok: true })
  }
}
