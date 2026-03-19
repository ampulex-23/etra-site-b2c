import type { CollectionAfterChangeHook } from 'payload'

export const orderAfterChange: CollectionAfterChangeHook = async ({
  doc,
  previousDoc,
  req,
  operation,
}) => {
  const { payload } = req
  const newStatus: string = doc.status
  const oldStatus: string | undefined = previousDoc?.status

  // --- On CREATE: auto-create Delivery + Payment records, reserve stock ---
  if (operation === 'create') {
    const deliveryId = await createDeliveryRecord(payload, doc, req)
    const paymentId = await createPaymentRecord(payload, doc, req)
    await reserveStock(payload, doc, req)

    // Link back to order
    const linkData: Record<string, any> = {}
    if (deliveryId) linkData.linkedDelivery = deliveryId
    if (paymentId) linkData.linkedPayment = paymentId
    if (Object.keys(linkData).length > 0) {
      try {
        await payload.update({ collection: 'orders', id: doc.id, data: linkData, req })
      } catch (err) {
        console.error('[orderAfterChange] Error linking delivery/payment:', err)
      }
    }
    return doc
  }

  if (operation !== 'update') return doc
  if (oldStatus === newStatus) return doc

  // --- Status: shipped → create stock movements (ship from warehouse) ---
  if (newStatus === 'shipped' && oldStatus !== 'shipped') {
    await shipOrder(payload, doc, req)
  }

  // --- Status: cancelled → unreserve stock ---
  if (newStatus === 'cancelled' && oldStatus !== 'cancelled') {
    await unreserveStock(payload, doc, req)
  }

  // --- Status: delivered or completed → unreserve remaining (already shipped) ---
  if (
    (newStatus === 'delivered' || newStatus === 'completed') &&
    oldStatus !== 'delivered' &&
    oldStatus !== 'completed'
  ) {
    await unreserveStock(payload, doc, req)
  }

  return doc
}

// --- Create Delivery record from order data, return delivery ID ---
async function createDeliveryRecord(payload: any, order: any, req: any): Promise<string | null> {
  try {
    const deliveryMethod = order.delivery?.method || 'pickup'
    const customer = typeof order.customer === 'object' ? order.customer : null

    // Check if a delivery already exists for this order
    const existing = await payload.find({
      collection: 'deliveries',
      where: { order: { equals: order.id } },
      limit: 1,
      req,
    })
    if (existing.docs.length > 0) return existing.docs[0].id

    const deliveryData: Record<string, any> = {
      order: order.id,
      method: deliveryMethod,
      status: 'pending',
      recipient: {
        name: customer?.name || order.notes || 'Клиент',
        phone: customer?.phone || '',
        email: customer?.email || '',
      },
      cost: order.deliveryCost || 0,
    }

    // Parse address from order.delivery.address string
    if (order.delivery?.address && deliveryMethod !== 'pickup') {
      deliveryData.address = {
        city: order.delivery.address.split(',')[0]?.trim() || '',
        street: order.delivery.address || '',
      }
    }

    const delivery = await payload.create({
      collection: 'deliveries',
      data: deliveryData,
      req,
    })
    return delivery?.id || null
  } catch (err) {
    console.error('[orderAfterChange] Error creating delivery:', err)
    return null
  }
}

// --- Create Payment record from order data, return payment ID ---
async function createPaymentRecord(payload: any, order: any, req: any): Promise<string | null> {
  try {
    // Check if a payment already exists for this order
    const existing = await payload.find({
      collection: 'payments',
      where: { order: { equals: order.id } },
      limit: 1,
      req,
    })
    if (existing.docs.length > 0) return existing.docs[0].id

    const paymentMethod = order.payment?.method
    let method = 'cash'
    let gateway = 'none'
    if (paymentMethod === 'yokassa' || paymentMethod === 'tinkoff') {
      method = 'gateway'
      gateway = paymentMethod
    } else if (paymentMethod === 'cash') {
      method = 'cash'
    }

    const payment = await payload.create({
      collection: 'payments',
      data: {
        order: order.id,
        method,
        gateway: method === 'gateway' ? gateway : undefined,
        status: order.payment?.status || 'pending',
        amount: order.total || 0,
        transactionId: order.payment?.transactionId || undefined,
        paidAt: order.payment?.paidAt || undefined,
      },
      req,
    })
    return payment?.id || null
  } catch (err) {
    console.error('[orderAfterChange] Error creating payment:', err)
    return null
  }
}

// --- Reserve stock for all items in the order ---
async function reserveStock(payload: any, order: any, req: any) {
  const items: any[] = order.items || []
  for (const item of items) {
    const productId = typeof item.product === 'object' ? item.product.id : item.product
    const quantity = item.quantity || 1
    if (!productId) continue

    try {
      // Find any warehouse that has this product in stock
      const stockLevels = await payload.find({
        collection: 'stock-levels',
        where: {
          product: { equals: productId },
          available: { greater_than: 0 },
        },
        limit: 10,
        req,
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
          req,
        })
        remaining -= canReserve
      }

      // If not enough stock, create a stock-level entry with negative available (backorder signal)
      if (remaining > 0) {
        console.warn(`[orderAfterChange] Not enough stock for product ${productId}, short by ${remaining}`)
      }
    } catch (err) {
      console.error(`[orderAfterChange] Error reserving stock for product ${productId}:`, err)
    }
  }

  // Sync Products.inStock flags
  await syncProductInStock(payload, order.items, req)
}

// --- Unreserve stock (on cancel or after shipment completes) ---
async function unreserveStock(payload: any, order: any, req: any) {
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
          reserved: { greater_than: 0 },
        },
        limit: 10,
        req,
      })

      let remaining = quantity
      for (const sl of stockLevels.docs) {
        if (remaining <= 0) break
        const canUnreserve = Math.min(remaining, sl.reserved || 0)
        if (canUnreserve <= 0) continue

        await payload.update({
          collection: 'stock-levels',
          id: sl.id,
          data: {
            reserved: Math.max(0, (sl.reserved || 0) - canUnreserve),
            available: (sl.available || 0) + canUnreserve,
          },
          req,
        })
        remaining -= canUnreserve
      }
    } catch (err) {
      console.error(`[orderAfterChange] Error unreserving stock for product ${productId}:`, err)
    }
  }

  await syncProductInStock(payload, order.items, req)
}

// --- Ship order: create stock movements from the appropriate warehouse ---
async function shipOrder(payload: any, order: any, req: any) {
  const deliveryMethod = order.delivery?.method || 'pickup'

  // Determine warehouse type based on delivery method
  const warehouseType = deliveryMethod === 'pickup' ? 'production' : 'logistics'

  const warehouseResult = await payload.find({
    collection: 'warehouses',
    where: { type: { equals: warehouseType }, active: { equals: true } },
    limit: 1,
    req,
  })

  // Fallback: try any active warehouse
  let warehouseId: string | null = warehouseResult.docs[0]?.id || null
  if (!warehouseId) {
    const fallback = await payload.find({
      collection: 'warehouses',
      where: { active: { equals: true } },
      limit: 1,
      req,
    })
    warehouseId = fallback.docs[0]?.id || null
  }

  if (!warehouseId) {
    console.error('[orderAfterChange] No active warehouse found for shipment')
    return
  }

  const orderItems: any[] = order.items || []
  const movementItems = orderItems
    .map((item: any) => ({
      product: typeof item.product === 'object' ? item.product.id : item.product,
      quantity: item.quantity || 1,
    }))
    .filter((i: any) => i.product)

  if (movementItems.length === 0) return

  try {
    await payload.create({
      collection: 'stock-movements' as any,
      data: {
        operationType: 'shipped_to_customers',
        items: movementItems,
        warehouse: warehouseId,
        status: 'completed',
        operator: req.user?.id || undefined,
        order: order.id,
        reason: `Заказ ${order.orderNumber} — отправлен клиенту`,
        date: new Date().toISOString(),
      },
      req,
    })
  } catch (err) {
    console.error('[orderAfterChange] Error creating shipment movement:', err)
  }

  // Unreserve the stock that was just shipped
  await unreserveStock(payload, order, req)
}

// --- Sync Products.inStock based on total available across all warehouses ---
async function syncProductInStock(payload: any, items: any[], req: any) {
  if (!items || !Array.isArray(items)) return

  const productIds = items
    .map((item: any) => typeof item.product === 'object' ? item.product.id : item.product)
    .filter(Boolean)

  const uniqueIds = [...new Set(productIds)]

  for (const productId of uniqueIds) {
    try {
      const stockLevels = await payload.find({
        collection: 'stock-levels',
        where: { product: { equals: productId } },
        limit: 100,
        req,
      })

      const totalAvailable = stockLevels.docs.reduce(
        (sum: number, sl: any) => sum + (sl.available || 0),
        0,
      )

      await payload.update({
        collection: 'products',
        id: productId,
        data: { inStock: totalAvailable > 0 },
        req,
      })
    } catch (err) {
      console.error(`[orderAfterChange] Error syncing inStock for product ${productId}:`, err)
    }
  }
}
