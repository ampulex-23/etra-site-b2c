import type { CollectionAfterChangeHook } from 'payload'

export const inventoryAfterChange: CollectionAfterChangeHook = async ({
  doc,
  previousDoc,
  req,
  operation,
}) => {
  const { payload } = req

  // Only process when inventory is completed
  if (doc.status !== 'completed') return doc
  if (operation === 'update' && previousDoc?.status === 'completed') return doc

  const warehouseId = typeof doc.warehouse === 'object' ? doc.warehouse.id : doc.warehouse
  if (!warehouseId) return doc

  const items: any[] = doc.items || []

  for (const item of items) {
    const productId = typeof item.product === 'object' ? item.product.id : item.product
    if (!productId) continue

    const actualQty: number = item.actualQty ?? 0
    const calculatedQty: number = item.calculatedQty ?? 0
    const discrepancy: number = actualQty - calculatedQty

    try {
      // Update StockLevels with actual count
      const stockLevels = await payload.find({
        collection: 'stock-levels',
        where: {
          product: { equals: productId },
          warehouse: { equals: warehouseId },
        },
        limit: 1,
        req,
      })

      if (stockLevels.docs[0]) {
        const sl = stockLevels.docs[0]
        await payload.update({
          collection: 'stock-levels',
          id: sl.id,
          data: {
            actual: actualQty,
            calculated: actualQty, // Reset calculated to match actual after inventory
            available: Math.max(0, actualQty - (sl.reserved || 0) - (sl.inTransit || 0)),
            discrepancy,
            lastInventoryDate: doc.date || new Date().toISOString(),
          },
          req,
        })
      } else {
        // Create a new StockLevel record
        await payload.create({
          collection: 'stock-levels',
          data: {
            product: productId,
            warehouse: warehouseId,
            calculated: actualQty,
            actual: actualQty,
            reserved: 0,
            inTransit: 0,
            available: actualQty,
            discrepancy,
            lastInventoryDate: doc.date || new Date().toISOString(),
          },
          req,
        })
      }

      // Create inventory_adjustment stock movement if there's a discrepancy
      if (discrepancy !== 0) {
        await payload.create({
          collection: 'stock-movements' as any,
          data: {
            operationType: 'inventory_adjustment',
            product: productId,
            quantity: Math.abs(discrepancy),
            warehouse: warehouseId,
            status: 'completed',
            operator: doc.conductor
              ? (typeof doc.conductor === 'object' ? doc.conductor.id : doc.conductor)
              : req.user?.id || undefined,
            reason: `Инвентаризация: расхождение ${discrepancy > 0 ? '+' : ''}${discrepancy} (было ${calculatedQty}, факт ${actualQty})`,
            date: doc.date || new Date().toISOString(),
          },
          req,
        })
      }

      // Sync Products.inStock
      const allStock = await payload.find({
        collection: 'stock-levels',
        where: { product: { equals: productId } },
        limit: 100,
        req,
      })
      const totalAvailable = allStock.docs.reduce(
        (sum: number, s: any) => sum + (s.available || 0),
        0,
      )
      await payload.update({
        collection: 'products',
        id: productId,
        data: { inStock: totalAvailable > 0 },
        req,
      })
    } catch (err) {
      console.error(`[inventoryAfterChange] Error processing product ${productId}:`, err)
    }
  }

  return doc
}
