import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { headers } from 'next/headers'

function escapeCSV(value: any): string {
  const str = value == null ? '' : String(value)
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

const TYPE_LABELS: Record<string, string> = {
  referral_first: 'Рефералка (первая)',
  referral_repeat: 'Рефералка (повторная)',
  mlm_level_1: 'МЛМ ур.1',
  mlm_level_2: 'МЛМ ур.2',
  mlm_level_3: 'МЛМ ур.3',
  team_bonus: 'Командный бонус',
  marketing_fund: 'Фонд маркетинга',
}

/**
 * GET /api/admin/referral/commissions-csv?status=pending&month=YYYY-MM
 * Экспорт комиссий в CSV.
 */
export async function GET(req: NextRequest) {
  try {
    const payload = await getPayload({ config })
    const headersList = await headers()
    const { user } = await (payload as any).auth({ headers: headersList })

    if (!user || user.collection !== 'users') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')
    const month = searchParams.get('month')

    const where: any = {}
    if (status) where.status = { equals: status }
    if (month) where.month = { equals: month }

    const result = await payload.find({
      collection: 'commissions' as any,
      where,
      limit: 50000,
      depth: 2,
    })

    const rows: string[] = []
    rows.push(
      [
        'ID',
        'Дата',
        'Месяц',
        'Тип',
        'Статус',
        'Сумма',
        '%',
        'База',
        'Партнёр (промокод)',
        'Партнёр (email)',
        'Покупатель',
        'Заказ',
      ].join(','),
    )

    for (const c of result.docs as any[]) {
      const recipient = c.recipient
      const recipientCustomer = typeof recipient === 'object' ? recipient?.customer : null
      const buyer = c.buyer
      const order = c.order
      rows.push(
        [
          c.id,
          c.createdAt,
          c.month,
          TYPE_LABELS[c.type] || c.type,
          c.status,
          c.amount,
          c.percent,
          c.baseAmount,
          typeof recipient === 'object' ? recipient?.promoCode || '' : '',
          typeof recipientCustomer === 'object' ? recipientCustomer?.email || '' : '',
          typeof buyer === 'object' ? buyer?.email || '' : '',
          typeof order === 'object' ? order?.orderNumber || '' : '',
        ]
          .map(escapeCSV)
          .join(','),
      )
    }

    const csv = '\uFEFF' + rows.join('\n')

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="commissions-${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    })
  } catch (error) {
    console.error('[commissions-csv] error:', error)
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 })
  }
}
