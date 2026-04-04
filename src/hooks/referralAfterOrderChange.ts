import type { CollectionAfterChangeHook } from 'payload'

export const referralAfterOrderChange: CollectionAfterChangeHook = async ({
  doc,
  previousDoc,
  req,
  operation,
}) => {
  if (operation !== 'update') return doc

  const paymentStatus = doc.payment?.status
  const prevPaymentStatus = previousDoc?.payment?.status

  if (paymentStatus === prevPaymentStatus) return doc
  if (!doc.referrer) return doc
  if (doc.referralPointsAwarded) return doc

  try {
    const referralSettings = await req.payload.findGlobal({
      slug: 'referral-settings' as any,
    }) as any

    if (!referralSettings?.enabled) return doc

    const awardOnStatus = referralSettings.awardOnStatus || 'paid'
    
    let shouldAward = false
    if (awardOnStatus === 'paid' && paymentStatus === 'paid') {
      shouldAward = true
    } else if (awardOnStatus === 'delivered' && doc.status === 'delivered') {
      shouldAward = true
    } else if (awardOnStatus === 'completed' && doc.status === 'completed') {
      shouldAward = true
    }

    if (!shouldAward) return doc

    const minOrderAmount = referralSettings.minOrderAmountForPoints || 0
    if (doc.total < minOrderAmount) return doc

    const basePoints = referralSettings.pointsPerOrder || 100
    const percentPoints = referralSettings.pointsPercentOfOrder || 0
    const orderTotal = doc.total || 0

    const totalPoints = Math.round(basePoints + (orderTotal * percentPoints / 100))

    const referrerId = typeof doc.referrer === 'object' ? doc.referrer.id : doc.referrer

    const referrer = await req.payload.findByID({
      collection: 'customers',
      id: referrerId,
    })

    if (!referrer) return doc

    const ref = referrer as any
    const newExperiencePoints = (ref.experiencePoints || 0) + totalPoints
    const newTotalReferralOrders = (ref.totalReferralOrders || 0) + 1
    const newTotalReferralRevenue = (ref.totalReferralRevenue || 0) + orderTotal

    await req.payload.update({
      collection: 'customers',
      id: referrerId,
      data: {
        experiencePoints: newExperiencePoints,
        totalReferralOrders: newTotalReferralOrders,
        totalReferralRevenue: newTotalReferralRevenue,
      } as any,
    })

    await req.payload.update({
      collection: 'orders',
      id: doc.id,
      data: {
        referralPointsAwarded: true,
      } as any,
    })

    const referrals = await req.payload.find({
      collection: 'referrals' as any,
      where: {
        referrer: { equals: referrerId },
        order: { equals: doc.id },
      },
      limit: 1,
    })

    if (referrals.docs.length > 0) {
      await req.payload.update({
        collection: 'referrals' as any,
        id: referrals.docs[0].id,
        data: {
          status: 'points_awarded',
          pointsAwarded: totalPoints,
        } as any,
      })
    } else {
      const customerId = typeof doc.customer === 'object' ? doc.customer.id : doc.customer
      
      await req.payload.create({
        collection: 'referrals' as any,
        data: {
          referrer: referrerId,
          referred: customerId,
          order: doc.id,
          status: 'points_awarded',
          pointsAwarded: totalPoints,
          orderTotal: orderTotal,
          source: 'direct',
        } as any,
      })
    }

    console.log(`Referral points awarded: ${totalPoints} points to customer ${referrerId} for order ${doc.orderNumber}`)

  } catch (error) {
    console.error('Error awarding referral points:', error)
  }

  return doc
}
