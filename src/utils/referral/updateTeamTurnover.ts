import type { Payload } from 'payload'
import { getSponsorChain } from './getSponsorChain'

function monthKey(date: Date = new Date()): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  return `${y}-${m}`
}

async function upsertTurnover(
  payload: Payload,
  partnerId: number | string,
  partnerCustomerId: number | string | null,
  month: string,
  field: 'personalSales' | 'level1Turnover' | 'level2Turnover' | 'level3Turnover',
  addAmount: number,
  settings: any,
) {
  const existing = await payload.find({
    collection: 'team-turnover' as any,
    where: {
      and: [
        { partner: { equals: partnerId } },
        { month: { equals: month } },
      ],
    },
    limit: 1,
  })

  const prev = (existing.docs[0] as any) || {}
  const newValue = Number(prev[field] || 0) + addAmount

  const level1 = field === 'level1Turnover' ? newValue : Number(prev.level1Turnover || 0)
  const level2 = field === 'level2Turnover' ? newValue : Number(prev.level2Turnover || 0)
  const level3 = field === 'level3Turnover' ? newValue : Number(prev.level3Turnover || 0)
  const personal = field === 'personalSales' ? newValue : Number(prev.personalSales || 0)
  const total = level1 + level2 + level3

  const threshold = Number(settings?.teamBonusThreshold ?? 500000)
  const teamBonusEnabled = Boolean(settings?.teamBonusEnabled)
  const teamBonusPercent = Number(settings?.teamBonusPercent ?? 3)
  let bonusAwarded = Boolean(prev.teamBonusAwarded)
  let bonusAmount = Number(prev.teamBonusAmount || 0)

  if (teamBonusEnabled && !bonusAwarded && total >= threshold) {
    bonusAwarded = true
    bonusAmount = Math.round((total * teamBonusPercent) / 100 * 100) / 100
  }

  const data = {
    partner: partnerId,
    partnerCustomer: partnerCustomerId,
    month,
    personalSales: personal,
    level1Turnover: level1,
    level2Turnover: level2,
    level3Turnover: level3,
    totalTeamTurnover: total,
    teamBonusAwarded: bonusAwarded,
    teamBonusAmount: bonusAmount,
  }

  if (existing.docs.length > 0) {
    await payload.update({
      collection: 'team-turnover' as any,
      id: (existing.docs[0] as any).id,
      data: data as any,
    })
  } else {
    await payload.create({
      collection: 'team-turnover' as any,
      data: data as any,
    })
  }
}

/**
 * Обновляет агрегаты оборота команды по всем уровням вверх от партнёра.
 */
export async function updateTeamTurnover(params: {
  payload: Payload
  partner: any // тот, кто привязан к покупателю
  orderAmount: number
  orderCreatedAt?: string | Date
  settings: any
}) {
  const { payload, partner, orderAmount, orderCreatedAt, settings } = params
  if (!partner || orderAmount <= 0) return
  if (partner.type !== 'mlm_partner') return

  const month = monthKey(new Date(orderCreatedAt || Date.now()))

  const partnerCustomerId =
    typeof partner.customer === 'object' ? partner.customer.id : partner.customer

  // Личные продажи самого партнёра (для информации)
  await upsertTurnover(payload, partner.id, partnerCustomerId, month, 'personalSales', orderAmount, settings)

  // Цепочка выше (уровни 1/2/3)
  const chain = await getSponsorChain(payload, partner.id, 3)
  for (let i = 0; i < chain.length; i++) {
    const sponsor = chain[i]
    if (sponsor.status !== 'active') continue
    if (sponsor.type !== 'mlm_partner') continue

    const sponsorCustomerId =
      typeof sponsor.customer === 'object' ? sponsor.customer.id : sponsor.customer

    const field = (['level1Turnover', 'level2Turnover', 'level3Turnover'] as const)[i]
    await upsertTurnover(payload, sponsor.id, sponsorCustomerId, month, field, orderAmount, settings)
  }
}
