import type { CollectionBeforeChangeHook } from 'payload'

export const orderBeforeChange: CollectionBeforeChangeHook = async ({ data, req, operation }) => {
  const { payload } = req

  if (!data.items || !Array.isArray(data.items) || data.items.length === 0) {
    data.subtotal = 0
    data.total = Math.max(0, (data.deliveryCost || 0) - (data.discount || 0))
    return data
  }

  for (const item of data.items) {
    if (!item.product) continue

    const productId = typeof item.product === 'object' ? item.product.id : item.product
    if (!productId) continue

    try {
      const product = await payload.findByID({
        collection: 'products',
        id: productId,
        depth: 0,
        req,
      })

      if (!product) continue

      const variants = (product.variants as { name: string; price: number }[]) || []

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
    } catch {
      // keep existing price if product fetch fails
    }
  }

  const subtotal = data.items.reduce((sum: number, item: { price?: number; quantity?: number }) => {
    return sum + (item.price || 0) * (item.quantity || 1)
  }, 0)

  data.subtotal = subtotal
  data.total = Math.max(0, subtotal - (data.discount || 0) + (data.deliveryCost || 0))

  return data
}
