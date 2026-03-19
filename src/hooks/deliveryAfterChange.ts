import type { CollectionAfterChangeHook } from 'payload'
import { getCdekConfigFromPayload, createOrder } from '../lib/cdek'

/**
 * 1. Sync delivery data back to Order (trackingNumber, delivery status)
 * 2. When status = 'handed_over' and method = 'cdek', auto-create CDEK order
 */
export const deliveryAfterChange: CollectionAfterChangeHook = async ({
  doc,
  previousDoc,
  req,
  operation,
}) => {
  const { payload } = req

  // --- Sync delivery data back to Order ---
  const orderId = typeof doc.order === 'object' ? doc.order.id : doc.order
  if (orderId) {
    const trackChanged = doc.trackingNumber && doc.trackingNumber !== previousDoc?.trackingNumber
    const statusChanged = doc.status !== previousDoc?.status

    if (trackChanged || statusChanged) {
      try {
        const orderUpdate: Record<string, any> = {}
        if (trackChanged) {
          orderUpdate['delivery.trackingNumber'] = doc.trackingNumber
        }
        await payload.update({ collection: 'orders', id: orderId, data: orderUpdate, req })
      } catch (err) {
        console.error('[deliveryAfterChange] Error syncing to order:', err)
      }
    }
  }

  // --- CDEK order creation ---
  if (doc.method !== 'cdek') return doc
  if (doc.cdekOrderUuid) return doc // already created
  if (doc.status !== 'handed_over') return doc
  if (operation === 'update' && previousDoc?.status === doc.status) return doc

  try {
    const cdekConfig = await getCdekConfigFromPayload(payload)

    // Load full order data (orderId already resolved above)
    const order = await payload.findByID({
      collection: 'orders',
      id: orderId,
      depth: 2,
      req,
    })

    if (!order) {
      console.error('[CDEK] Order not found:', orderId)
      return doc
    }

    // Build packages from order items
    const items = (order.items || []) as Array<{
      product: { title?: string; sku?: string; weight?: number; price?: number } | number
      quantity: number
      price: number
    }>

    let totalWeight = 0
    const packageItems = items.map((item, idx) => {
      const product = typeof item.product === 'object' ? item.product : null
      const weight = product?.weight || 500
      totalWeight += weight * item.quantity
      return {
        name: product?.title || `Товар ${idx + 1}`,
        ware_key: product?.sku || `ITEM-${idx}`,
        payment: { value: 0, currency: 'RUB' }, // prepaid
        cost: item.price,
        weight,
        amount: item.quantity,
      }
    })

    // Determine delivery mode
    const isToPickupPoint = Boolean(doc.pickupPoint?.code)
    const tariffCode = isToPickupPoint
      ? cdekConfig.defaultTariffCode // e.g. 139 door-to-pvz
      : 138 // door-to-door

    const toLocation: Record<string, string | undefined> = {}
    if (doc.address?.city) toLocation.city = doc.address.city
    if (doc.address?.zip) toLocation.postal_code = doc.address.zip
    if (doc.address?.street) {
      toLocation.address = [doc.address.street, doc.address.apartment].filter(Boolean).join(', ')
    }

    const cdekOrder = await createOrder(cdekConfig, {
      type: 1,
      number: order.orderNumber || `ORD-${orderId}`,
      tariff_code: tariffCode,
      comment: doc.notes || undefined,
      recipient: {
        name: doc.recipient?.name || 'Получатель',
        phones: [{ number: doc.recipient?.phone || '' }],
        email: doc.recipient?.email || undefined,
      },
      from_location: {
        code: cdekConfig.senderCityCode,
        address: 'Склад отправителя',
      },
      to_location: toLocation as { code?: string; postal_code?: string; city?: string; address?: string },
      delivery_point: isToPickupPoint ? doc.pickupPoint.code : undefined,
      packages: [{
        number: `PKG-${orderId}`,
        weight: totalWeight || 500,
        length: 30,
        width: 20,
        height: 15,
        items: packageItems,
      }],
    })

    if (cdekOrder.entity?.uuid) {
      await payload.update({
        collection: 'deliveries',
        id: doc.id,
        data: {
          cdekOrderUuid: cdekOrder.entity.uuid,
          ...(cdekOrder.entity.cdek_number
            ? { trackingNumber: String(cdekOrder.entity.cdek_number) }
            : {}),
        },
        req,
      })
      console.log(`[CDEK] Order created: uuid=${cdekOrder.entity.uuid}, delivery=${doc.id}`)
    } else {
      const errors = cdekOrder.requests
        ?.flatMap((r) => r.errors || [])
        .map((e) => e.message)
        .join('; ')
      console.error(`[CDEK] Failed to create order for delivery ${doc.id}: ${errors}`)
    }
  } catch (err) {
    console.error('[CDEK] Error creating order:', err)
  }

  return doc
}
