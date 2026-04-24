import type { Payload } from 'payload'

/**
 * Shared helpers for the "order top-up" flow (докомплектация).
 *
 * When a customer places a new order but already has an open (paid, not
 * shipped) order, we merge the new items into the existing order instead
 * of creating a separate shipment:
 *   - `items` aggregate by {product, variantName}
 *   - a new Payment row is attached for the delta amount
 *   - Delivery stays the same (one shipment)
 *   - partner commission gets a second row for the delta (referral_repeat)
 */

const TOP_UP_ELIGIBLE_STATUSES = new Set(['new', 'processing'])

export interface TopUpEligibility {
  eligible: boolean
  reason?: string
}

export interface TopUpSettings {
  topUpEnabled?: boolean
  topUpWindowDays?: number
}

/**
 * Decide whether a given order can still accept additional items.
 */
export function canTopUp(order: any, settings: TopUpSettings | null | undefined): TopUpEligibility {
  if (!order) return { eligible: false, reason: 'order_not_found' }
  if (settings && settings.topUpEnabled === false) {
    return { eligible: false, reason: 'top_up_disabled' }
  }
  if (order.allowTopUp === false) {
    return { eligible: false, reason: 'order_locked' }
  }
  if (!TOP_UP_ELIGIBLE_STATUSES.has(String(order.status))) {
    return { eligible: false, reason: `order_status_${order.status}` }
  }
  const windowDays = Number(settings?.topUpWindowDays ?? 14)
  if (windowDays > 0 && order.createdAt) {
    const created = new Date(order.createdAt).getTime()
    const ageDays = (Date.now() - created) / (1000 * 60 * 60 * 24)
    if (ageDays > windowDays) {
      return { eligible: false, reason: 'window_expired' }
    }
  }
  return { eligible: true }
}

export interface OrderItemInput {
  product: string | number | { id: string | number }
  variantName?: string | null
  quantity: number
  price: number
}

interface NormalisedItem {
  product: string | number
  variantName: string
  quantity: number
  price: number
}

function productId(item: OrderItemInput): string | number {
  return typeof item.product === 'object' ? (item.product as any).id : item.product
}

function normalise(item: OrderItemInput): NormalisedItem {
  return {
    product: productId(item),
    variantName: (item.variantName || '').trim(),
    quantity: Math.max(1, Number(item.quantity) || 1),
    price: Number(item.price) || 0,
  }
}

/**
 * Merge two arrays of order items by (product, variantName).
 * Quantity is summed, price is taken from the more recent item (the top-up).
 * Returns a fresh array — does not mutate inputs.
 */
export function mergeItems(existing: OrderItemInput[], toAdd: OrderItemInput[]): NormalisedItem[] {
  const byKey = new Map<string, NormalisedItem>()

  for (const item of existing) {
    const n = normalise(item)
    const key = `${n.product}|${n.variantName}`
    byKey.set(key, { ...n })
  }
  for (const item of toAdd) {
    const n = normalise(item)
    const key = `${n.product}|${n.variantName}`
    const prev = byKey.get(key)
    if (prev) {
      byKey.set(key, { ...prev, quantity: prev.quantity + n.quantity, price: n.price || prev.price })
    } else {
      byKey.set(key, { ...n })
    }
  }
  return Array.from(byKey.values())
}

export interface RecalcParams {
  items: NormalisedItem[] | OrderItemInput[]
  discount?: number
  deliveryCost?: number
}

export interface RecalcResult {
  subtotal: number
  total: number
}

/**
 * Recompute subtotal and total for an order. Delivery is paid on receipt in
 * this project, so it is NOT added to total — matches the checkout logic.
 */
export function recalcTotals({ items, discount = 0 }: RecalcParams): RecalcResult {
  const subtotal = items.reduce((sum, it) => sum + (Number((it as any).price) || 0) * (Number((it as any).quantity) || 1), 0)
  const total = Math.max(0, subtotal - (Number(discount) || 0))
  return { subtotal, total }
}

/**
 * Find the single best top-up target for the given customer — the earliest
 * eligible open order. Returns null if none.
 */
export async function findTopUpTarget(params: {
  payload: Payload
  customerId: string | number
  settings: TopUpSettings | null | undefined
}): Promise<any | null> {
  const { payload, customerId, settings } = params
  if (settings && settings.topUpEnabled === false) return null

  const candidates = await payload.find({
    collection: 'orders',
    where: {
      and: [
        { customer: { equals: customerId } },
        { status: { in: ['new', 'processing'] } },
        { allowTopUp: { not_equals: false } },
      ],
    },
    sort: 'createdAt',
    limit: 5,
    depth: 0,
    overrideAccess: true,
  })

  for (const order of candidates.docs) {
    const { eligible } = canTopUp(order, settings)
    if (eligible) return order
  }
  return null
}
