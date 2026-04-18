import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

/**
 * Публичные настройки реферальной программы (без чувствительных данных)
 */
export async function GET() {
  try {
    const payload = await getPayload({ config })
    const settings = (await payload.findGlobal({
      slug: 'referral-settings' as any,
    })) as any

    if (!settings?.enabled) {
      return NextResponse.json({ enabled: false })
    }

    return NextResponse.json({
      enabled: true,
      shareTitle: settings.shareTitle || 'Рекомендую ЭТРА!',
      shareText: settings.shareText || '',
      enabledSources: settings.enabledSources || ['telegram', 'vk', 'whatsapp', 'copy'],
      commissionFirstPurchase: Number(settings.commissionFirstPurchase ?? 10),
      commissionRepeatPurchase: Number(settings.commissionRepeatPurchase ?? 9),
      customerDiscountFirstPurchase: Number(settings.customerDiscountFirstPurchase ?? 10),
      mlmEnabled: Boolean(settings.mlmEnabled),
      partnerDiscountPercent: Number(settings.partnerDiscountPercent ?? 21),
      level1Commission: Number(settings.level1Commission ?? 9),
      level2Commission: Number(settings.level2Commission ?? 9),
      level3Commission: Number(settings.level3Commission ?? 3),
      teamBonusEnabled: Boolean(settings.teamBonusEnabled),
      teamBonusPercent: Number(settings.teamBonusPercent ?? 3),
      teamBonusThreshold: Number(settings.teamBonusThreshold ?? 500000),
      minPayoutAmount: Number(settings.minPayoutAmount ?? 500),
      payoutMethods: settings.payoutMethods || ['bank_card', 'sbp'],
    })
  } catch (error) {
    console.error('Error fetching referral settings:', error)
    return NextResponse.json({ enabled: false })
  }
}
