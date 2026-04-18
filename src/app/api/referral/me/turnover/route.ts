import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { getAuthenticatedCustomer, getCustomerPartner } from '@/utils/auth/getAuthenticatedCustomer'

/**
 * GET /api/referral/me/turnover?months=6
 * Командный оборот партнёра по месяцам.
 */
export async function GET(req: NextRequest) {
  try {
    const payload = await getPayload({ config })
    const customer = await getAuthenticatedCustomer(payload, req)
    if (!customer) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    const partner = await getCustomerPartner(payload, customer.id)
    if (!partner) {
      return NextResponse.json({ turnover: [] })
    }

    const { searchParams } = new URL(req.url)
    const months = Math.min(36, Math.max(1, Number(searchParams.get('months') || 6)))

    const result = await payload.find({
      collection: 'team-turnover' as any,
      where: { partner: { equals: partner.id } },
      sort: '-month',
      limit: months,
    })

    return NextResponse.json({
      turnover: result.docs.map((t: any) => ({
        month: t.month,
        personalSales: Number(t.personalSales || 0),
        level1Turnover: Number(t.level1Turnover || 0),
        level2Turnover: Number(t.level2Turnover || 0),
        level3Turnover: Number(t.level3Turnover || 0),
        totalTeamTurnover: Number(t.totalTeamTurnover || 0),
        teamBonusAwarded: Boolean(t.teamBonusAwarded),
        teamBonusAmount: Number(t.teamBonusAmount || 0),
      })),
    })
  } catch (error) {
    console.error('[referral/me/turnover] error:', error)
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 })
  }
}
