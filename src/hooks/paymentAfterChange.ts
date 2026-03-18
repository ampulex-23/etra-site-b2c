import type { CollectionAfterChangeHook } from 'payload'

export const paymentAfterChange: CollectionAfterChangeHook = async ({
  doc,
  previousDoc,
  req,
  operation,
}) => {
  const { payload } = req

  const newStatus: string = doc.status
  const oldStatus: string | undefined = previousDoc?.status

  // Only sync when status changes or on create
  if (operation === 'update' && oldStatus === newStatus) return doc

  const orderId = typeof doc.order === 'object' ? doc.order.id : doc.order
  if (!orderId) return doc

  try {
    // Map payment status to order payment status
    const paymentUpdate: Record<string, any> = {
      'payment.status': newStatus,
    }

    if (doc.method) {
      paymentUpdate['payment.method'] = doc.method === 'gateway'
        ? (doc.gateway || 'yokassa')
        : doc.method
    }

    if (doc.transactionId) {
      paymentUpdate['payment.transactionId'] = doc.transactionId
    }

    if (newStatus === 'paid' && doc.paidAt) {
      paymentUpdate['payment.paidAt'] = doc.paidAt
    } else if (newStatus === 'paid' && !doc.paidAt) {
      paymentUpdate['payment.paidAt'] = new Date().toISOString()
      // Also update the payment record itself
      await payload.update({
        collection: 'payments',
        id: doc.id,
        data: { paidAt: new Date().toISOString() },
        req,
      })
    }

    await payload.update({
      collection: 'orders',
      id: orderId,
      data: paymentUpdate,
      req,
    })

    // If paid, move order from 'new' to 'processing'
    if (newStatus === 'paid') {
      const order = await payload.findByID({
        collection: 'orders',
        id: orderId,
        depth: 0,
        req,
      })
      if (order && order.status === 'new') {
        await payload.update({
          collection: 'orders',
          id: orderId,
          data: { status: 'processing' },
          req,
        })
      }
    }
  } catch (err) {
    console.error(`[paymentAfterChange] Error syncing payment to order ${orderId}:`, err)
  }

  return doc
}
