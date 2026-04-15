import type { CollectionAfterChangeHook } from 'payload'

export const stockMovementAfterChange: CollectionAfterChangeHook = async ({
  doc,
  req,
  operation,
}) => {
  if (operation !== 'create') return doc
  if (doc.status === 'cancelled') return doc

  const { payload } = req

  const operationType: string = doc.operationType
  const warehouseId: string = typeof doc.warehouse === 'object' ? doc.warehouse.id : doc.warehouse
  const targetWarehouseId: string | null = doc.targetWarehouse
    ? typeof doc.targetWarehouse === 'object'
      ? doc.targetWarehouse.id
      : doc.targetWarehouse
    : null

  const items: any[] = doc.items || []
  if (items.length === 0) return doc

  for (const entry of items) {
    const productId: string = typeof entry.product === 'object' ? entry.product.id : entry.product
    const quantity: number = entry.quantity || 1
    if (!productId) continue

    const product = typeof entry.product === 'object'
      ? entry.product
      : await payload.findByID({ collection: 'products', id: productId })

    // Bundle decomposition: create a separate movement with decomposed items
    if (product?.isBundle && product.bundleItems?.length) {
      const decomposedItems = product.bundleItems.map((bi: any) => ({
        product: typeof bi.product === 'object' ? bi.product.id : bi.product,
        quantity: quantity * (bi.quantity || 1),
      }))

      await payload.create({
        collection: 'stock-movements' as any,
        data: {
          operationType,
          items: decomposedItems,
          warehouse: warehouseId,
          targetWarehouse: targetWarehouseId,
          status: doc.status,
          operator: doc.operator ? (typeof doc.operator === 'object' ? doc.operator.id : doc.operator) : undefined,
          order: doc.order ? (typeof doc.order === 'object' ? doc.order.id : doc.order) : undefined,
          bundle: productId,
          reason: `Автоматическое разложение набора: ${product.title} x${quantity}`,
          date: doc.date,
        },
        req,
      })
      continue
    }

    await updateStockLevel(payload, productId, warehouseId, operationType, quantity, targetWarehouseId, doc.status, req)
    await syncProductInStock(payload, productId, req)
  }

  return doc
}

async function updateStockLevel(
  payload: any,
  productId: string,
  warehouseId: string,
  operationType: string,
  quantity: number,
  targetWarehouseId: string | null,
  status: string,
  req: any,
) {
  const existing = await payload.find({
    collection: 'stock-levels',
    where: {
      product: { equals: productId },
      warehouse: { equals: warehouseId },
    },
    limit: 1,
    req,
  })

  let stockLevel = existing.docs[0]

  const isNewStockLevel = !stockLevel
  if (!stockLevel) {
    stockLevel = await payload.create({
      collection: 'stock-levels',
      data: {
        product: productId,
        warehouse: warehouseId,
        calculated: 0,
        actual: 0, // Will be updated below for 'produced' operation
        reserved: 0,
        inTransit: 0,
        available: 0,
      },
      req,
    })
  }

  let calculated: number = stockLevel.calculated || 0
  let inTransit: number = stockLevel.inTransit || 0
  let reserved: number = stockLevel.reserved || 0

  switch (operationType) {
    case 'produced':
      calculated += quantity
      break

    case 'sent_to_logistics':
      calculated -= quantity
      if (status === 'in_transit') {
        inTransit += quantity
      }
      break

    case 'received_at_logistics':
      calculated += quantity
      if (targetWarehouseId) {
        await ensureTargetTransitReduced(payload, productId, targetWarehouseId, quantity, req)
      }
      // Also reduce inTransit on the source warehouse (where the goods were sent from)
      await reduceSourceWarehouseTransit(payload, productId, warehouseId, quantity, req)
      break

    case 'shipped_to_customers':
    case 'retail_shipment':
    case 'employee_issue':
    case 'write_off':
      calculated -= quantity
      break

    case 'return_to_stock':
      calculated += quantity
      break

    case 'inventory_adjustment':
      break
  }

  const available = Math.max(0, calculated - reserved - inTransit)

  // For 'produced' operation, also update 'actual' since production is a verified physical event
  // This makes sense because: produced goods are physically counted and added to stock
  const updateData: Record<string, any> = {
    calculated,
    inTransit,
    available,
  }

  // Update actual for operations that represent verified physical changes
  if (operationType === 'produced' || operationType === 'return_to_stock') {
    // Add to actual (or set if null)
    updateData.actual = (stockLevel.actual ?? 0) + quantity
  } else if (operationType === 'shipped_to_customers' || operationType === 'retail_shipment' || 
             operationType === 'employee_issue' || operationType === 'write_off') {
    // Subtract from actual (if it was set)
    if (stockLevel.actual !== null && stockLevel.actual !== undefined) {
      updateData.actual = Math.max(0, stockLevel.actual - quantity)
    }
  }

  await payload.update({
    collection: 'stock-levels',
    id: stockLevel.id,
    data: updateData,
    req,
  })

  if (operationType === 'sent_to_logistics' && targetWarehouseId && status === 'in_transit') {
    const targetExisting = await payload.find({
      collection: 'stock-levels',
      where: {
        product: { equals: productId },
        warehouse: { equals: targetWarehouseId },
      },
      limit: 1,
      req,
    })

    let targetStock = targetExisting.docs[0]
    if (!targetStock) {
      await payload.create({
        collection: 'stock-levels',
        data: {
          product: productId,
          warehouse: targetWarehouseId,
          calculated: 0,
          reserved: 0,
          inTransit: quantity,
          available: 0,
        },
        req,
      })
    } else {
      await payload.update({
        collection: 'stock-levels',
        id: targetStock.id,
        data: {
          inTransit: (targetStock.inTransit || 0) + quantity,
        },
        req,
      })
    }
  }
}

async function ensureTargetTransitReduced(
  payload: any,
  productId: string,
  warehouseId: string,
  quantity: number,
  req: any,
) {
  const existing = await payload.find({
    collection: 'stock-levels',
    where: {
      product: { equals: productId },
      warehouse: { equals: warehouseId },
    },
    limit: 1,
    req,
  })

  if (existing.docs[0]) {
    const stock = existing.docs[0]
    const newTransit = Math.max(0, (stock.inTransit || 0) - quantity)
    await payload.update({
      collection: 'stock-levels',
      id: stock.id,
      data: {
        inTransit: newTransit,
        available: Math.max(0, (stock.calculated || 0) - (stock.reserved || 0) - newTransit),
      },
      req,
    })
  }
}

async function reduceSourceWarehouseTransit(
  payload: any,
  productId: string,
  sourceWarehouseId: string,
  quantity: number,
  req: any,
) {
  const existing = await payload.find({
    collection: 'stock-levels',
    where: {
      product: { equals: productId },
      warehouse: { equals: sourceWarehouseId },
    },
    limit: 1,
    req,
  })

  if (existing.docs[0]) {
    const stock = existing.docs[0]
    const newTransit = Math.max(0, (stock.inTransit || 0) - quantity)
    await payload.update({
      collection: 'stock-levels',
      id: stock.id,
      data: {
        inTransit: newTransit,
        available: Math.max(0, (stock.calculated || 0) - (stock.reserved || 0) - newTransit),
      },
      req,
    })
  }
}

async function syncProductInStock(payload: any, productId: string, req: any) {
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
    console.error(`[stockMovementAfterChange] Error syncing inStock for product ${productId}:`, err)
  }
}
