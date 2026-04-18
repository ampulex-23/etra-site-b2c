import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { getAuthenticatedCustomer, getCustomerPartner } from '@/utils/auth/getAuthenticatedCustomer'

/**
 * GET /api/referral/me/commissions?page=1&limit=20&status=pending
 * История комиссий текущего партнёра.
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
      return NextResponse.json({ commissions: [], total: 0 })
    }

    const { searchParams } = new URL(req.url)
    const page = Math.max(1, Number(searchParams.get('page') || 1))
    const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit') || 20)))
    const statusFilter = searchParams.get('status')
    const typeFilter = searchParams.get('type')
    const monthFilter = searchParams.get('month')

    const where: any = { recipient: { equals: partner.id } }
    if (statusFilter) where.status = { equals: statusFilter }
    if (typeFilter) where.type = { equals: typeFilter }
    if (monthFilter) where.month = { equals: monthFilter }

    const result = await payload.find({
      collection: 'commissions' as any,
      where,
      sort: '-createdAt',
      page,
      limit,
      depth: 1,
    })

    return NextResponse.json({
      commissions: result.docs.map((c: any) => ({
        id: c.id,
        type: c.type,
        percent: c.percent,
        baseAmount: c.baseAmount,
        amount: c.amount,
        status: c.status,
        month: c.month,
        orderNumber: c.order?.orderNumber || null,
        buyerName: c.buyer?.name || null,
        createdAt: c.createdAt,
      })),
      total: result.totalDocs,
      page: result.page,
      totalPages: result.totalPages,
    })
  } catch (error) {
    console.error('[referral/me/commissions] error:', error)
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 })
  }
}
