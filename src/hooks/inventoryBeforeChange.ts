import type { CollectionBeforeChangeHook } from 'payload'

export const inventoryBeforeChange: CollectionBeforeChangeHook = async ({ data, req }) => {
  const { payload } = req

  if (!data.items || !Array.isArray(data.items)) return data

  for (const item of data.items) {
    if (!item.product) continue

    const productId = typeof item.product === 'object' ? item.product.id : item.product

    // Always fill calculatedQty from StockLevels (current stock at inventory time)
    try {
      const warehouseId = typeof data.warehouse === 'object' ? data.warehouse.id : data.warehouse
      if (warehouseId) {
        const stockLevels = await payload.find({
          collection: 'stock-levels',
          where: {
            product: { equals: productId },
            warehouse: { equals: warehouseId },
          },
          limit: 1,
          req,
        })
        // Set to current stock or 0 if no stock record exists (new product)
        item.calculatedQty = stockLevels.docs[0]?.calculated ?? 0
      } else {
        item.calculatedQty = item.calculatedQty ?? 0
      }
    } catch {
      item.calculatedQty = item.calculatedQty ?? 0
    }

    // Auto-calculate discrepancy
    if (item.actualQty !== undefined && item.actualQty !== null) {
      item.discrepancy = (item.actualQty || 0) - (item.calculatedQty || 0)
    }
  }

  return data
}
