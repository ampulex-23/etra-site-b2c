import type { CollectionAfterChangeHook, CollectionAfterDeleteHook } from 'payload'

/**
 * Recalculate denormalised order stats on a Customer:
 *   - orderCount      — total number of non-merged orders
 *   - orderTotalSum   — sum of `total` across the same set
 *
 * Merged orders (status='merged') are excluded because their totals have
 * already been absorbed into the target order after the merge.
 *
 * This helper is idempotent and safe to call from multiple hooks; it
 * aggregates the current truth directly from the orders collection.
 */
async function recomputeStatsForCustomer(
  payload: any,
  customerId: string | number,
): Promise<void> {
  if (!customerId) return

  try {
    const res = await payload.find({
      collection: 'orders',
      where: {
        and: [
          { customer: { equals: customerId } },
          { status: { not_equals: 'merged' } },
        ],
      },
      depth: 0,
      pagination: false,
      limit: 10000,
      select: {
        total: true,
        status: true,
      },
    })

    const docs: Array<{ total?: number }> = Array.isArray(res?.docs) ? res.docs : []
    const orderCount = docs.length
    const orderTotalSum = docs.reduce((acc, d) => acc + Number(d?.total || 0), 0)

    await payload.update({
      collection: 'customers',
      id: customerId,
      data: {
        orderCount,
        orderTotalSum,
      },
      // Avoid triggering our own hooks recursively.
      overrideAccess: true,
    })
  } catch (err) {
    console.error('[updateCustomerOrderStats] failed for customer', customerId, err)
  }
}

/**
 * Order afterChange: recompute stats for the affected customer. If the
 * customer has changed (re-assignment of a misfiled order), recompute
 * for both the previous and the new customer.
 */
export const updateCustomerOrderStatsAfterChange: CollectionAfterChangeHook = async ({
  doc,
  previousDoc,
  req,
}) => {
  const payload = req.payload
  const newCustomerId =
    typeof doc?.customer === 'object' ? doc.customer?.id : doc?.customer
  const oldCustomerId =
    typeof previousDoc?.customer === 'object'
      ? previousDoc.customer?.id
      : previousDoc?.customer

  const targets = new Set<string | number>()
  if (newCustomerId) targets.add(newCustomerId)
  if (oldCustomerId && oldCustomerId !== newCustomerId) targets.add(oldCustomerId)

  await Promise.all(
    Array.from(targets).map((id) => recomputeStatsForCustomer(payload, id)),
  )

  return doc
}

/**
 * Order afterDelete: recompute stats for the customer whose order was
 * removed, so the denormalised count/sum don't include ghost orders.
 */
export const updateCustomerOrderStatsAfterDelete: CollectionAfterDeleteHook = async ({
  doc,
  req,
}) => {
  const payload = req.payload
  const customerId =
    typeof doc?.customer === 'object' ? doc.customer?.id : doc?.customer
  if (customerId) {
    await recomputeStatsForCustomer(payload, customerId)
  }
  return doc
}
