import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { getAuthenticatedCustomer, getCustomerPartner } from '@/utils/auth/getAuthenticatedCustomer'
import { generatePromoCode } from '@/utils/referral/generatePromoCode'

/**
 * GET /api/referral/me
 * Возвращает данные партнёра текущего клиента.
 * Если клиент ещё не партнёр — автоматически создаёт запись типа 'client' (рефералка).
 */
export async function GET(req: NextRequest) {
  try {
    const payload = await getPayload({ config })
    const customer = await getAuthenticatedCustomer(payload, req)

    if (!customer) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    const settings = (await payload.findGlobal({
      slug: 'referral-settings' as any,
    })) as any

    if (!settings?.enabled) {
      return NextResponse.json({ enabled: false, partner: null })
    }

    let partner = await getCustomerPartner(payload, customer.id)

    // Автосоздание партнёра-клиента при первом обращении
    if (!partner) {
      const pattern = settings?.promoCodePattern || 'uppercase_name'
      const promoCode = await generatePromoCode(payload, pattern, customer.name || customer.email)
      partner = await payload.create({
        collection: 'referral-partners' as any,
        data: {
          customer: customer.id,
          type: 'client',
          status: 'active',
          promoCode,
          balance: 0,
          totalEarned: 0,
          totalPaid: 0,
        } as any,
      })
    }

    return NextResponse.json({
      enabled: true,
      partner: {
        id: partner.id,
        promoCode: partner.promoCode,
        type: partner.type,
        status: partner.status,
        balance: Number(partner.balance || 0),
        totalEarned: Number(partner.totalEarned || 0),
        totalPaid: Number(partner.totalPaid || 0),
        isMLM: partner.type === 'mlm_partner',
        partnerPriceEnabled: Boolean(partner.partnerPriceEnabled),
      },
      settings: {
        commissionFirstPurchase: Number(settings.commissionFirstPurchase ?? 10),
        commissionRepeatPurchase: Number(settings.commissionRepeatPurchase ?? 9),
        customerDiscountFirstPurchase: Number(settings.customerDiscountFirstPurchase ?? 10),
        partnerDiscountPercent: Number(settings.partnerDiscountPercent ?? 21),
        minPayoutAmount: Number(settings.minPayoutAmount ?? 500),
        payoutMethods: settings.payoutMethods || ['bank_card', 'sbp'],
        mlmEnabled: Boolean(settings.mlmEnabled),
        teamBonusEnabled: Boolean(settings.teamBonusEnabled),
        teamBonusThreshold: Number(settings.teamBonusThreshold ?? 500000),
        teamBonusPercent: Number(settings.teamBonusPercent ?? 3),
        level1Commission: Number(settings.level1Commission ?? 9),
        level2Commission: Number(settings.level2Commission ?? 9),
        level3Commission: Number(settings.level3Commission ?? 3),
      },
    })
  } catch (error) {
    console.error('[referral/me] error:', error)
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 })
  }
}
