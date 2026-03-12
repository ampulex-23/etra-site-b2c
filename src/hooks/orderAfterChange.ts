import type { CollectionAfterChangeHook } from 'payload'

export const orderAfterChange: CollectionAfterChangeHook = async ({
  doc,
  previousDoc,
  req,
  operation,
}) => {
  if (operation !== 'update') return doc

  const newStatus = doc.status
  const oldStatus = previousDoc?.status

  if (oldStatus === newStatus) return doc
  if (newStatus !== 'shipped') return doc

  const { payload } = req

  const logisticsWarehouse = await payload.find({
    collection: 'warehouses',
    where: { type: { equals: 'logistics' } },
    limit: 1,
    req,
  })

  if (!logisticsWarehouse.docs[0]) return doc

  const warehouseId = logisticsWarehouse.docs[0].id
  const items: any[] = doc.items || []

  for (const item of items) {
    const productId = typeof item.product === 'object' ? item.product.id : item.product
    const quantity = item.quantity || 1

    await payload.create({
      collection: 'stock-movements' as any,
      data: {
        operationType: 'shipped_to_customers',
        product: productId,
        quantity,
        warehouse: warehouseId,
        status: 'completed',
        operator: req.user?.id || undefined,
        order: doc.id,
        reason: `Заказ ${doc.orderNumber} — отправлен клиенту`,
        date: new Date().toISOString(),
      },
      req,
    })
  }

  return doc
}
