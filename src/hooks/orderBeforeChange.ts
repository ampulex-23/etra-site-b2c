import type { CollectionBeforeChangeHook } from 'payload'

export const orderBeforeChange: CollectionBeforeChangeHook = async ({ data, req, operation }) => {
  const { payload } = req

  if (!data.items || !Array.isArray(data.items) || data.items.length === 0) {
    data.subtotal = 0
    data.total = Math.max(0, (data.deliveryCost || 0) - (data.discount || 0))
    return data
  }

  // --- Pull prices from products and check stock ---
  for (const item of data.items) {
    if (!item.product) continue

    const productId = typeof item.product === 'object' ? item.product.id : item.product
    if (!productId) continue

    // Фиксируем цену только при создании заказа или для новых позиций без цены.
    // При обновлении существующих позиций цена НЕ перезаписывается — сохраняем
    // ту, по которой клиент фактически оформил заказ (важно для возвратов и отчётности).
    const shouldSetPrice = item.price === undefined || item.price === null

    try {
      const product = await payload.findByID({
        collection: 'products',
        id: productId,
        depth: 0,
        req,
      })

      if (!product) continue

      const variants = (product.variants as { name: string; price: number }[]) || []

      if (shouldSetPrice) {
        if (item.variantName && variants.length > 0) {
          const variant = variants.find((v) => v.name === item.variantName)
          if (variant) {
            item.price = variant.price
          } else {
            item.price = product.price as number
          }
        } else if (variants.length === 1) {
          item.variantName = variants[0].name
          item.price = variants[0].price
        } else {
          item.price = product.price as number
        }
      } else if (!item.variantName && variants.length === 1) {
        // Автоподстановка названия варианта для старых записей, если оно отсутствует
        item.variantName = variants[0].name
      }

      // Check stock availability (warn only, don't block)
      if (operation === 'create') {
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
        if (totalAvailable < (item.quantity || 1)) {
          console.warn(
            `[orderBeforeChange] Low stock for "${product.title}": need ${item.quantity}, available ${totalAvailable}`,
          )
        }
      }
    } catch {
      // keep existing price if product fetch fails
    }
  }

  const subtotal = data.items.reduce((sum: number, item: { price?: number; quantity?: number }) => {
    return sum + (item.price || 0) * (item.quantity || 1)
  }, 0)

  data.subtotal = subtotal

  // --- Apply promo code ---
  let discount = 0
  if (data.promoCode && operation === 'create') {
    try {
      const promoId = typeof data.promoCode === 'object' ? data.promoCode.id : data.promoCode
      const promo = await payload.findByID({
        collection: 'promo-codes',
        id: promoId,
        depth: 0,
        req,
      })

      if (promo && promo.active) {
        const now = new Date()
        const validFrom = promo.validFrom ? new Date(promo.validFrom) : null
        const validTo = promo.validTo ? new Date(promo.validTo) : null
        const withinDates = (!validFrom || now >= validFrom) && (!validTo || now <= validTo)
        const withinUsage = !promo.maxUses || (promo.usedCount || 0) < promo.maxUses
        const meetsMinimum = !promo.minOrderAmount || subtotal >= promo.minOrderAmount

        if (withinDates && withinUsage && meetsMinimum) {
          if (promo.discountType === 'percent') {
            discount = Math.round(subtotal * (promo.discountValue / 100))
          } else {
            discount = promo.discountValue || 0
          }

          // Increment usedCount
          await payload.update({
            collection: 'promo-codes',
            id: promoId,
            data: { usedCount: (promo.usedCount || 0) + 1 },
            req,
          })
        }
      }
    } catch (err) {
      console.error('[orderBeforeChange] Error applying promo code:', err)
    }
  }

  data.discount = discount || data.discount || 0
  data.total = Math.max(0, subtotal - (data.discount || 0) + (data.deliveryCost || 0))

  return data
}
