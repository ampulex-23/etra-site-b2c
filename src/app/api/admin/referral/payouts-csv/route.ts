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

/**
 * GET /api/admin/referral/payouts-csv?status=requested&from=YYYY-MM-DD&to=YYYY-MM-DD
 * Экспорт реестра выплат в CSV (для банка/бухгалтерии).
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
    const from = searchParams.get('from')
    const to = searchParams.get('to')

    const where: any = {}
    if (status) where.status = { equals: status }
    const dateRange: any = {}
    if (from) dateRange.greater_than_equal = from
    if (to) dateRange.less_than_equal = to
    if (Object.keys(dateRange).length > 0) where.requestedAt = dateRange

    const result = await payload.find({
      collection: 'referral-payouts' as any,
      where,
      limit: 10000,
      depth: 2,
    })

    const rows: string[] = []
    rows.push(
      [
        'ID',
        'Дата заявки',
        'Дата выплаты',
        'Статус',
        'Метод',
        'Сумма',
        'ФИО получателя',
        'Карта/Телефон',
        'Банк',
        'ИНН',
        'Промокод партнёра',
        'Email партнёра',
        'Имя партнёра',
        'Заметки',
      ].join(','),
    )

    for (const p of result.docs as any[]) {
      const partner = p.partner
      const customer = typeof partner === 'object' ? partner?.customer : null
      const pd = p.paymentDetails || {}
      rows.push(
        [
          p.id,
          p.requestedAt,
          p.paidAt || '',
          p.status,
          p.method,
          p.amount,
          pd.recipientFullName || '',
          pd.cardNumber || pd.phone || '',
          pd.bankName || '',
          pd.inn || '',
          typeof partner === 'object' ? partner?.promoCode || '' : '',
          typeof customer === 'object' ? customer?.email || '' : '',
          typeof customer === 'object' ? customer?.name || '' : '',
          p.adminNotes || '',
        ]
          .map(escapeCSV)
          .join(','),
      )
    }

    const csv = '\uFEFF' + rows.join('\n') // BOM для корректного открытия в Excel

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="referral-payouts-${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    })
  } catch (error) {
    console.error('[payouts-csv] error:', error)
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 })
  }
}
