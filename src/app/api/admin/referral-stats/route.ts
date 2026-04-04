import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

export async function GET() {
  try {
    const payload = await getPayload({ config })

    const [customersResult, referralsResult] = await Promise.all([
      payload.find({
        collection: 'customers',
        limit: 1000,
        depth: 0,
      }),
      payload.find({
        collection: 'referrals' as any,
        limit: 100,
        sort: '-createdAt',
        depth: 1,
      }),
    ])

    const customers = customersResult.docs as any[]
    const referrals = referralsResult.docs as any[]

    const activeReferrers = customers.filter(
      (c) => (c.totalReferrals || 0) > 0 || (c.totalReferralOrders || 0) > 0
    )

    const totalPointsAwarded = customers.reduce(
      (sum, c) => sum + (c.experiencePoints || 0),
      0
    )

    const totalReferralRevenue = customers.reduce(
      (sum, c) => sum + (c.totalReferralRevenue || 0),
      0
    )

    const totalReferrals = referrals.length

    const topReferrers = customers
      .filter((c) => (c.experiencePoints || 0) > 0)
      .sort((a, b) => (b.experiencePoints || 0) - (a.experiencePoints || 0))
      .slice(0, 10)
      .map((c) => ({
        id: c.id,
        name: c.name,
        email: c.email,
        referralCode: c.referralCode,
        experiencePoints: c.experiencePoints || 0,
        referralLevel: c.referralLevel || 'Новичок',
        totalReferrals: c.totalReferrals || 0,
        totalReferralOrders: c.totalReferralOrders || 0,
        totalReferralRevenue: c.totalReferralRevenue || 0,
      }))

    const recentReferrals = referrals.slice(0, 20).map((r) => ({
      id: r.id,
      referrer: r.referrer
        ? {
            id: typeof r.referrer === 'object' ? r.referrer.id : r.referrer,
            name: typeof r.referrer === 'object' ? r.referrer.name : null,
            email: typeof r.referrer === 'object' ? r.referrer.email : null,
          }
        : null,
      referred: r.referred
        ? {
            id: typeof r.referred === 'object' ? r.referred.id : r.referred,
            name: typeof r.referred === 'object' ? r.referred.name : null,
            email: typeof r.referred === 'object' ? r.referred.email : null,
          }
        : null,
      order: r.order
        ? {
            id: typeof r.order === 'object' ? r.order.id : r.order,
            orderNumber: typeof r.order === 'object' ? r.order.orderNumber : null,
            total: typeof r.order === 'object' ? r.order.total : null,
          }
        : null,
      status: r.status,
      pointsAwarded: r.pointsAwarded || 0,
      createdAt: r.createdAt,
    }))

    return NextResponse.json({
      totalCustomers: customersResult.totalDocs,
      activeReferrers: activeReferrers.length,
      totalReferrals,
      totalPointsAwarded,
      totalReferralRevenue,
      topReferrers,
      recentReferrals,
    })
  } catch (error) {
    console.error('Error fetching referral stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    )
  }
}
