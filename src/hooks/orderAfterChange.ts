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

  // --- On CREATE: skip stock reservation (will be done asynchronously) ---
  if (operation === 'create') {
    console.log('[orderAfterChange] Order created, stock will be reserved asynchronously:', doc.id)
    // Note: Stock reservation, Delivery and Payment are created asynchronously via API route
    return doc
  }

  if (operation !== 'update') return doc
  if (oldStatus === newStatus) return doc

  // --- Status: processing (paid) → auto-create enrollment if infoproduct ---
  if (newStatus === 'processing' && oldStatus !== 'processing') {
    await autoCreateEnrollment(payload, doc, req)
  }

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
async function createDeliveryRecord(payload: any, order: any): Promise<string | null> {
  try {
    const deliveryMethod = order.delivery?.method || 'pickup'
    const customer = typeof order.customer === 'object' ? order.customer : null

    // Check if a delivery already exists for this order
    const existing = await payload.find({
      collection: 'deliveries',
      where: { order: { equals: order.id } },
      limit: 1,
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
      overrideAccess: true,
    })
    return delivery?.id || null
  } catch (err) {
    console.error('[orderAfterChange] Error creating delivery:', err)
    return null
  }
}

// --- Create Payment record from order data, return payment ID ---
async function createPaymentRecord(payload: any, order: any): Promise<string | null> {
  try {
    // Check if a payment already exists for this order
    const existing = await payload.find({
      collection: 'payments',
      where: { order: { equals: order.id } },
      limit: 1,
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
      overrideAccess: true,
    })
    return payment?.id || null
  } catch (err) {
    console.error('[orderAfterChange] Error creating payment:', err)
    return null
  }
}

// --- Reserve stock for all items in the order ---
async function reserveStock(payload: any, order: any) {
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

      // If not enough stock, create a stock-level entry with negative available (backorder signal)
      if (remaining > 0) {
        console.warn(`[orderAfterChange] Not enough stock for product ${productId}, short by ${remaining}`)
      }
    } catch (err) {
      console.error(`[orderAfterChange] Error reserving stock for product ${productId}:`, err)
    }
  }

  // Sync Products.inStock flags
  await syncProductInStock(payload, order.items)
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

  await syncProductInStock(payload, order.items)
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

// --- Auto-create enrollment when order is paid and contains an infoproduct ---
async function autoCreateEnrollment(payload: any, order: any, req: any) {
  try {
    const customerId = typeof order.customer === 'object' ? order.customer.id : order.customer
    if (!customerId) return

    // Check if order already has an enrollment
    const existingEnrollment = await payload.find({
      collection: 'enrollments',
      where: { order: { equals: order.id } },
      limit: 1,
      depth: 0,
    })
    if (existingEnrollment.totalDocs > 0) {
      console.log(`[orderAfterChange] Enrollment already exists for order ${order.id}`)
      return
    }

    // If order has a selectedCohort, use it directly
    const selectedCohortId = typeof order.selectedCohort === 'object'
      ? order.selectedCohort?.id
      : order.selectedCohort

    if (selectedCohortId) {
      await createEnrollmentForCohort(payload, customerId, selectedCohortId, order.id)
      return
    }

    // Otherwise, check if any item in the order is linked to an infoproduct via productBundle
    const orderItems: any[] = order.items || []
    for (const item of orderItems) {
      const productId = typeof item.product === 'object' ? item.product.id : item.product
      if (!productId) continue

      // Find infoproducts that have this product as their productBundle
      const infoproducts = await payload.find({
        collection: 'infoproducts',
        where: {
          productBundle: { equals: productId },
          status: { equals: 'active' },
        },
        limit: 1,
        depth: 0,
      })

      if (infoproducts.totalDocs === 0) continue

      const infoproduct = infoproducts.docs[0]

      // Find the nearest upcoming or active cohort for this infoproduct
      const cohorts = await payload.find({
        collection: 'course-cohorts',
        where: {
          infoproduct: { equals: infoproduct.id },
          status: { in: ['upcoming', 'active'] },
        },
        sort: 'startDate',
        limit: 1,
        depth: 0,
      })

      if (cohorts.totalDocs === 0) {
        console.warn(`[orderAfterChange] No upcoming/active cohort for infoproduct ${infoproduct.id} (${infoproduct.title})`)
        continue
      }

      const cohort = cohorts.docs[0]
      await createEnrollmentForCohort(payload, customerId, cohort.id, order.id)
    }
  } catch (err) {
    console.error('[orderAfterChange] Error auto-creating enrollment:', err)
  }
}

async function createEnrollmentForCohort(
  payload: any,
  customerId: string,
  cohortId: string,
  orderId: string,
) {
  // Check maxParticipants
  const cohort = await payload.findByID({
    collection: 'course-cohorts',
    id: cohortId,
    depth: 0,
  })

  if (!cohort) {
    console.error(`[orderAfterChange] Cohort ${cohortId} not found`)
    return
  }

  if (cohort.maxParticipants && cohort.maxParticipants > 0) {
    const currentCount = await payload.find({
      collection: 'enrollments',
      where: {
        cohort: { equals: cohortId },
        status: { in: ['pending', 'active'] },
      },
      limit: 0,
      depth: 0,
    })

    if (currentCount.totalDocs >= cohort.maxParticipants) {
      console.warn(`[orderAfterChange] Cohort ${cohortId} is full (${currentCount.totalDocs}/${cohort.maxParticipants})`)
      // Still create enrollment but log warning — business decision to handle overflow
    }
  }

  // Check for duplicate enrollment (same customer + cohort)
  const duplicate = await payload.find({
    collection: 'enrollments',
    where: {
      customer: { equals: customerId },
      cohort: { equals: cohortId },
      status: { not_in: ['refunded', 'expelled'] },
    },
    limit: 1,
    depth: 0,
  })

  if (duplicate.totalDocs > 0) {
    console.log(`[orderAfterChange] Customer ${customerId} already enrolled in cohort ${cohortId}`)
    return
  }

  const enrollment = await payload.create({
    collection: 'enrollments',
    data: {
      customer: customerId,
      cohort: cohortId,
      order: orderId,
      status: cohort.status === 'active' ? 'active' : 'pending',
      enrolledAt: new Date().toISOString(),
    },
    depth: 0,
  })

  console.log(`[orderAfterChange] Auto-created enrollment ${enrollment.id} for customer ${customerId} in cohort ${cohortId}`)
}

// --- Sync Products.inStock based on total available across all warehouses ---
async function syncProductInStock(payload: any, items: any[]) {
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
        overrideAccess: true,
      })

      const totalAvailable = stockLevels.docs.reduce(
        (sum: number, sl: any) => sum + (sl.available || 0),
        0,
      )

      await payload.update({
        collection: 'products',
        id: productId,
        data: { inStock: totalAvailable > 0 },
        overrideAccess: true,
      })
    } catch (err) {
      console.error(`[orderAfterChange] Error syncing inStock for product ${productId}:`, err)
    }
  }
}
