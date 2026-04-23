/**
 * One-time backfill for Customer.orderCount / Customer.orderTotalSum.
 *
 * Usage:
 *   pnpm payload run scripts/backfill-customer-order-stats.ts
 *
 * Safe to re-run at any time: it recomputes the two denormalised fields
 * from scratch for every customer, so the values always match the
 * current state of the orders table.
 *
 * Excludes orders with status='merged', since those have been absorbed
 * into a target order after merge and shouldn't count twice.
 */
import { getPayload } from 'payload'
import config from '@payload-config'

async function run() {
  const payload = await getPayload({ config })

  // Grab every customer id in one shot. 10k is comfortably above the
  // current customer base; raise if it ever grows beyond.
  const customers = await payload.find({
    collection: 'customers',
    limit: 10000,
    pagination: false,
    depth: 0,
  })

  const ids: Array<string | number> = (customers.docs as Array<{ id: string | number }>).map((c) => c.id)
  console.log(`[backfill] ${ids.length} customers to recompute`)

  let changed = 0
  let processed = 0
  const batchSize = 25

  for (let i = 0; i < ids.length; i += batchSize) {
    const batch = ids.slice(i, i + batchSize)

    await Promise.all(
      batch.map(async (customerId) => {
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
          select: { total: true },
        })

        const docs = (res.docs as Array<{ total?: number }>) || []
        const orderCount = docs.length
        const orderTotalSum = docs.reduce((acc, d) => acc + Number(d.total || 0), 0)

        try {
          await payload.update({
            collection: 'customers',
            id: customerId as any,
            data: { orderCount, orderTotalSum } as any,
            overrideAccess: true,
          })
          if (orderCount > 0) changed += 1
        } catch (err) {
          console.error(`[backfill] failed for customer ${customerId}:`, err)
        }
      }),
    )

    processed += batch.length
    console.log(`[backfill] ${processed}/${ids.length} processed, ${changed} non-empty so far`)
  }

  console.log(`[backfill] done: ${processed} customers processed, ${changed} with orders`)
  process.exit(0)
}

run().catch((err) => {
  console.error('[backfill] fatal:', err)
  process.exit(1)
})
