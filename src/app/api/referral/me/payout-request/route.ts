import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { getAuthenticatedCustomer, getCustomerPartner } from '@/utils/auth/getAuthenticatedCustomer'

/**
 * POST /api/referral/me/payout-request
 * Body: { amount: number, method: string, paymentDetails: {...} }
 *
 * Создаёт заявку на выплату.
 * Сумма списывается с баланса (резервируется до оплаты).
 */
export async function POST(req: NextRequest) {
  try {
    const payload = await getPayload({ config })
    const customer = await getAuthenticatedCustomer(payload, req)
    if (!customer) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    const partner = await getCustomerPartner(payload, customer.id)
    if (!partner) {
      return NextResponse.json({ error: 'Не являетесь партнёром' }, { status: 403 })
    }

    const body = await req.json().catch(() => ({}))
    const amount = Number(body.amount || 0)
    const method = body.method
    const paymentDetails = body.paymentDetails || {}

    const settings = (await payload.findGlobal({
      slug: 'referral-settings' as any,
    })) as any
    const minAmount = Number(settings?.minPayoutAmount ?? 500)
    const allowedMethods: string[] = settings?.payoutMethods || ['bank_card', 'sbp']

    if (!method || !allowedMethods.includes(method)) {
      return NextResponse.json({ error: 'Метод выплаты недоступен' }, { status: 400 })
    }
    if (amount < minAmount) {
      return NextResponse.json(
        { error: `Минимальная сумма выплаты: ${minAmount} ₽` },
        { status: 400 },
      )
    }
    if (amount > Number(partner.balance || 0)) {
      return NextResponse.json({ error: 'Недостаточно средств на балансе' }, { status: 400 })
    }

    // Проверка кулдауна
    const cooldownDays = Number(settings?.payoutRequestCooldownDays ?? 0)
    if (cooldownDays > 0) {
      const cutoff = new Date(Date.now() - cooldownDays * 24 * 60 * 60 * 1000).toISOString()
      const recent = await payload.find({
        collection: 'referral-payouts' as any,
        where: {
          and: [
            { partner: { equals: partner.id } },
            { requestedAt: { greater_than: cutoff } },
          ],
        },
        limit: 1,
      })
      if (recent.docs.length > 0) {
        return NextResponse.json(
          { error: `Следующая заявка возможна через ${cooldownDays} дней` },
          { status: 429 },
        )
      }
    }

    // Резервируем: списываем сумму с баланса сразу
    await payload.update({
      collection: 'referral-partners' as any,
      id: partner.id,
      data: { balance: Number(partner.balance || 0) - amount } as any,
    })

    const payout = await payload.create({
      collection: 'referral-payouts' as any,
      data: {
        partner: partner.id,
        partnerCustomer: customer.id,
        amount,
        method,
        status: 'requested',
        paymentDetails,
        requestedAt: new Date().toISOString(),
      } as any,
    })

    return NextResponse.json({
      success: true,
      payout: {
        id: payout.id,
        amount,
        method,
        status: 'requested',
      },
      newBalance: Number(partner.balance || 0) - amount,
    })
  } catch (error) {
    console.error('[payout-request] error:', error)
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 })
  }
}

/**
 * GET /api/referral/me/payout-request
 * История выплат
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
      return NextResponse.json({ payouts: [] })
    }

    const result = await payload.find({
      collection: 'referral-payouts' as any,
      where: { partner: { equals: partner.id } },
      sort: '-requestedAt',
      limit: 50,
    })

    return NextResponse.json({
      payouts: result.docs.map((p: any) => ({
        id: p.id,
        amount: p.amount,
        method: p.method,
        status: p.status,
        requestedAt: p.requestedAt,
        paidAt: p.paidAt,
        rejectReason: p.rejectReason,
      })),
    })
  } catch (error) {
    console.error('[payout-request/list] error:', error)
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 })
  }
}
