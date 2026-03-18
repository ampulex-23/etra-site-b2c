import type { CollectionBeforeChangeHook } from 'payload'

export const inventoryBeforeChange: CollectionBeforeChangeHook = async ({ data, req }) => {
  const { payload } = req

  if (!data.items || !Array.isArray(data.items)) return data

  for (const item of data.items) {
    if (!item.product) continue

    const productId = typeof item.product === 'object' ? item.product.id : item.product

    // Auto-fill calculatedQty from StockLevels if not set
    if (item.calculatedQty === undefined || item.calculatedQty === null || item.calculatedQty === 0) {
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
          if (stockLevels.docs[0]) {
            item.calculatedQty = stockLevels.docs[0].calculated || 0
          }
        }
      } catch {
        // keep existing value
      }
    }

    // Auto-calculate discrepancy
    if (item.actualQty !== undefined && item.actualQty !== null) {
      item.discrepancy = (item.actualQty || 0) - (item.calculatedQty || 0)
    }
  }

  return data
}
