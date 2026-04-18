import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { getAuthenticatedCustomer, getCustomerPartner } from '@/utils/auth/getAuthenticatedCustomer'

interface NetworkNode {
  id: number | string
  promoCode: string
  customerName: string
  type: string
  status: string
  joinedAt: string | null
  totalEarnedFromThem: number
  children: NetworkNode[]
}

async function buildSubtree(
  payload: any,
  partnerId: number | string,
  level: number,
  maxLevel: number,
  parentCustomerId: number | string,
): Promise<NetworkNode[]> {
  if (level > maxLevel) return []

  const partners = await payload.find({
    collection: 'referral-partners' as any,
    where: { sponsor: { equals: partnerId } },
    depth: 1,
    limit: 1000,
  })

  const result: NetworkNode[] = []
  for (const p of partners.docs as any[]) {
    const customerName =
      typeof p.customer === 'object' ? (p.customer?.name || p.customer?.email || '—') : '—'

    // Сумма комиссий от этого партнёра
    const commissions = await payload.find({
      collection: 'commissions' as any,
      where: {
        and: [
          { recipientCustomer: { equals: parentCustomerId } },
          { buyer: { equals: typeof p.customer === 'object' ? p.customer.id : p.customer } },
          { status: { not_equals: 'cancelled' } },
        ],
      },
      limit: 1000,
      depth: 0,
    })

    const totalFromThem = commissions.docs.reduce(
      (sum: number, c: any) => sum + Number(c.amount || 0),
      0,
    )

    const children = level < maxLevel
      ? await buildSubtree(payload, p.id, level + 1, maxLevel, parentCustomerId)
      : []

    result.push({
      id: p.id,
      promoCode: p.promoCode,
      customerName,
      type: p.type,
      status: p.status,
      joinedAt: p.joinedMLMAt || p.createdAt || null,
      totalEarnedFromThem: totalFromThem,
      children,
    })
  }
  return result
}

/**
 * GET /api/referral/me/network
 * Возвращает дерево сети (3 уровня) для МЛМ-партнёра.
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
      return NextResponse.json({ network: [], counts: { level1: 0, level2: 0, level3: 0 } })
    }

    const tree = await buildSubtree(payload, partner.id, 1, 3, customer.id)

    const counts = {
      level1: tree.length,
      level2: tree.reduce((s, n) => s + n.children.length, 0),
      level3: tree.reduce(
        (s, n) => s + n.children.reduce((ss, nn) => ss + nn.children.length, 0),
        0,
      ),
    }

    return NextResponse.json({ network: tree, counts })
  } catch (error) {
    console.error('[referral/me/network] error:', error)
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 })
  }
}
