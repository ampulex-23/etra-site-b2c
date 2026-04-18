import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { getAuthenticatedCustomer } from '@/utils/auth/getAuthenticatedCustomer'

/**
 * POST /api/referral/apply-promo
 * Body: { promoCode: string, orderAmount?: number }
 *
 * Проверяет промокод и возвращает информацию о скидке и партнёре.
 * Не применяет привязку — это делает хук `customerAfterOrderCreate` при создании заказа.
 */
export async function POST(req: NextRequest) {
  try {
    const { promoCode, orderAmount } = await req.json().catch(() => ({}))

    if (!promoCode || typeof promoCode !== 'string') {
      return NextResponse.json({ valid: false, error: 'Промокод не указан' }, { status: 400 })
    }

    const payload = await getPayload({ config })
    const settings = (await payload.findGlobal({
      slug: 'referral-settings' as any,
    })) as any

    if (!settings?.enabled) {
      return NextResponse.json({ valid: false, error: 'Реферальная программа отключена' }, { status: 400 })
    }

    const code = promoCode.trim().toUpperCase()
    const partners = await payload.find({
      collection: 'referral-partners' as any,
      where: {
        promoCode: { equals: code },
        status: { equals: 'active' },
      },
      depth: 1,
      limit: 1,
    })

    if (partners.docs.length === 0) {
      return NextResponse.json({ valid: false, error: 'Промокод не найден или неактивен' }, { status: 404 })
    }

    const partner = partners.docs[0] as any
    const partnerCustomer = partner.customer as any

    // Проверка: применён ли к текущему клиенту (пожизненная привязка)
    let isFirstPurchase = true
    let alreadyAttributedToSomeone = false
    let ownCode = false

    const customer = await getAuthenticatedCustomer(payload, req)
    if (customer) {
      const fullCustomer = (await payload.findByID({
        collection: 'customers',
        id: customer.id,
      })) as any

      if (fullCustomer?.attributedPartner) {
        const attributedId =
          typeof fullCustomer.attributedPartner === 'object'
            ? fullCustomer.attributedPartner.id
            : fullCustomer.attributedPartner
        alreadyAttributedToSomeone = attributedId !== partner.id
      }

      isFirstPurchase = !fullCustomer?.firstPurchaseCompleted

      // Клиент не может использовать свой собственный промокод
      const partnerCustomerId =
        typeof partner.customer === 'object' ? partner.customer.id : partner.customer
      if (partnerCustomerId === customer.id) {
        ownCode = true
      }
    }

    if (ownCode) {
      return NextResponse.json({
        valid: false,
        error: 'Нельзя использовать собственный промокод',
      }, { status: 400 })
    }

    const discountPct = Number(settings.customerDiscountFirstPurchase ?? 10)
    const applyDiscount = isFirstPurchase && !alreadyAttributedToSomeone
    const orderAmountNum = Number(orderAmount || 0)
    const discountAmount = applyDiscount
      ? Math.round((orderAmountNum * discountPct) / 100 * 100) / 100
      : 0

    return NextResponse.json({
      valid: true,
      promoCode: code,
      partnerName: partnerCustomer?.name || 'Партнёр',
      discountPercent: applyDiscount ? discountPct : 0,
      discountAmount,
      isFirstPurchase: applyDiscount,
      alreadyAttributed: alreadyAttributedToSomeone,
    })
  } catch (error) {
    console.error('[apply-promo] error:', error)
    return NextResponse.json({ valid: false, error: 'Ошибка сервера' }, { status: 500 })
  }
}
