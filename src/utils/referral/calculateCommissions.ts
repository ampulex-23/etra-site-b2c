import type { Payload } from 'payload'
import { getSponsorChain } from './getSponsorChain'

export interface CommissionToCreate {
  recipient: number | string
  recipientCustomer: number | string
  order: number | string
  buyer: number | string
  type:
    | 'referral_first'
    | 'referral_repeat'
    | 'mlm_level_1'
    | 'mlm_level_2'
    | 'mlm_level_3'
    | 'team_bonus'
    | 'marketing_fund'
  percent: number
  baseAmount: number
  amount: number
  status: 'pending' | 'approved'
  month: string
}

function monthKey(date: Date = new Date()): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  return `${y}-${m}`
}

function extractCustomerId(partner: any): number | string | null {
  if (!partner?.customer) return null
  return typeof partner.customer === 'object' ? partner.customer.id : partner.customer
}

/**
 * Рассчитывает все комиссии к начислению по заказу.
 * Возвращает массив записей, которые надо создать в collection `commissions`.
 */
export async function calculateCommissions(params: {
  payload: Payload
  order: any
  buyerId: number | string
  partner: any // ReferralPartner
  isFirstPurchase: boolean
  settings: any
}): Promise<CommissionToCreate[]> {
  const { payload, order, buyerId, partner, isFirstPurchase, settings } = params

  const commissions: CommissionToCreate[] = []
  const orderId = order.id
  const baseAmount = Number(order.total || 0)
  const month = monthKey(new Date(order.createdAt || Date.now()))

  if (baseAmount <= 0) return commissions

  const minAmount = Number(settings?.minOrderAmountForCommission || 0)
  if (baseAmount < minAmount) return commissions

  // Партнёрская закупка — не начисляем комиссии (уже получена маржа через скидку)
  if (order.isPartnerPurchase) return commissions

  const partnerCustomerId = extractCustomerId(partner)
  if (!partnerCustomerId) return commissions

  // ============ БАЗОВАЯ КОМИССИЯ ПАРТНЁРУ ============
  const firstPct = Number(settings?.commissionFirstPurchase ?? 10)
  const repeatPct = Number(settings?.commissionRepeatPurchase ?? 9)
  const basePercent = isFirstPurchase ? firstPct : repeatPct
  const baseCommissionAmount = Math.round((baseAmount * basePercent) / 100 * 100) / 100

  if (baseCommissionAmount > 0) {
    commissions.push({
      recipient: partner.id,
      recipientCustomer: partnerCustomerId,
      order: orderId,
      buyer: buyerId,
      type: isFirstPurchase ? 'referral_first' : 'referral_repeat',
      percent: basePercent,
      baseAmount,
      amount: baseCommissionAmount,
      status: 'pending',
      month,
    })
  }

  // ============ МЛМ-ЦЕПОЧКА ============
  const mlmEnabled = Boolean(settings?.mlmEnabled)
  if (!mlmEnabled) return commissions

  // МЛМ-уровни начисляются только если покупатель привязан к МЛМ-партнёру
  // Для обычных клиентов-рефералов и блогеров — только базовая комиссия
  if (partner.type !== 'mlm_partner') return commissions

  const levelPercents = [
    Number(settings?.level1Commission ?? 9),
    Number(settings?.level2Commission ?? 9),
    Number(settings?.level3Commission ?? 3),
  ]

  const chain = await getSponsorChain(payload, partner.id, 3)

  for (let i = 0; i < chain.length; i++) {
    const sponsor = chain[i]
    if (sponsor.status !== 'active') continue
    if (sponsor.type !== 'mlm_partner') continue

    const percent = levelPercents[i]
    if (!percent || percent <= 0) continue

    const amount = Math.round((baseAmount * percent) / 100 * 100) / 100
    if (amount <= 0) continue

    const sponsorCustomerId = extractCustomerId(sponsor)
    if (!sponsorCustomerId) continue

    commissions.push({
      recipient: sponsor.id,
      recipientCustomer: sponsorCustomerId,
      order: orderId,
      buyer: buyerId,
      type: (['mlm_level_1', 'mlm_level_2', 'mlm_level_3'] as const)[i],
      percent,
      baseAmount,
      amount,
      status: 'pending',
      month,
    })
  }

  return commissions
}
