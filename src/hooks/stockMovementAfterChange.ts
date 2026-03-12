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
  const productId: string = typeof doc.product === 'object' ? doc.product.id : doc.product
  const warehouseId: string = typeof doc.warehouse === 'object' ? doc.warehouse.id : doc.warehouse
  const quantity: number = doc.quantity
  const targetWarehouseId: string | null = doc.targetWarehouse
    ? typeof doc.targetWarehouse === 'object'
      ? doc.targetWarehouse.id
      : doc.targetWarehouse
    : null

  const product = typeof doc.product === 'object'
    ? doc.product
    : await payload.findByID({ collection: 'products', id: productId })

  if (product?.isBundle && product.bundleItems?.length) {
    for (const item of product.bundleItems) {
      const baseProductId = typeof item.product === 'object' ? item.product.id : item.product
      const baseQty = quantity * (item.quantity || 1)

      await payload.create({
        collection: 'stock-movements' as any,
        data: {
          operationType,
          product: baseProductId,
          quantity: baseQty,
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
    }
    return doc
  }

  await updateStockLevel(payload, productId, warehouseId, operationType, quantity, targetWarehouseId, doc.status, req)

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

  if (!stockLevel) {
    stockLevel = await payload.create({
      collection: 'stock-levels',
      data: {
        product: productId,
        warehouse: warehouseId,
        calculated: 0,
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

  await payload.update({
    collection: 'stock-levels',
    id: stockLevel.id,
    data: {
      calculated,
      inTransit,
      available,
    },
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
