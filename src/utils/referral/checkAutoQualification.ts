import type { Payload } from 'payload'
import { generatePromoCode } from './generatePromoCode'

/**
 * Пересчитывает totalSpent за последние N месяцев и,
 * если сумма превышает порог — создаёт МЛМ-партнёра автоматически.
 *
 * Возвращает созданного партнёра или null.
 */
export async function checkAutoQualification(params: {
  payload: Payload
  customerId: number | string
  triggeringOrderId?: number | string
  settings: any
}): Promise<any | null> {
  const { payload, customerId, triggeringOrderId, settings } = params

  if (!settings?.autoQualifyEnabled) return null
  if (!settings?.mlmEnabled) return null

  const threshold = Number(settings?.autoQualifyThreshold ?? 60000)
  const periodMonths = Number(settings?.autoQualifyPeriodMonths ?? 6)
  const periodMs = periodMonths * 30 * 24 * 60 * 60 * 1000
  const sinceDate = new Date(Date.now() - periodMs).toISOString()

  // Сумма оплаченных заказов за период
  const orders = await payload.find({
    collection: 'orders',
    where: {
      and: [
        { customer: { equals: customerId } },
        { 'payment.status': { equals: 'paid' } },
        { 'payment.paidAt': { greater_than_equal: sinceDate } },
      ],
    },
    limit: 1000,
    depth: 0,
  })

  const total = orders.docs.reduce((sum, o: any) => sum + Number(o.total || 0), 0)

  // Обновить кешированное значение в customer
  await payload.update({
    collection: 'customers',
    id: customerId,
    data: {
      totalSpent6Months: total,
      lastMLMQualificationCheck: new Date().toISOString(),
    } as any,
  })

  if (total < threshold) return null

  // Проверка: уже партнёр?
  const existing = await payload.find({
    collection: 'referral-partners' as any,
    where: { customer: { equals: customerId } },
    limit: 1,
  })

  if (existing.docs.length > 0) {
    const p = existing.docs[0] as any
    // Если уже МЛМ — ничего не делаем
    if (p.type === 'mlm_partner') return null

    // Если был рефералом/блогером — апгрейдим в МЛМ
    const updated = await payload.update({
      collection: 'referral-partners' as any,
      id: p.id,
      data: {
        type: 'mlm_partner',
        invitationSource: 'auto_qualified',
        entryType: 'auto',
        entryOrder: triggeringOrderId,
        joinedMLMAt: new Date().toISOString(),
        partnerPriceEnabled: true,
      } as any,
    })
    return updated
  }

  // Создаём партнёра
  const customer = (await payload.findByID({ collection: 'customers', id: customerId })) as any
  const pattern = settings?.promoCodePattern || 'uppercase_name'
  const promoCode = await generatePromoCode(payload, pattern, customer?.name)

  const created = await payload.create({
    collection: 'referral-partners' as any,
    data: {
      customer: customerId,
      type: 'mlm_partner',
      status: 'active',
      promoCode,
      balance: 0,
      totalEarned: 0,
      totalPaid: 0,
      invitationSource: 'auto_qualified',
      entryType: 'auto',
      entryOrder: triggeringOrderId,
      joinedMLMAt: new Date().toISOString(),
      partnerPriceEnabled: true,
    } as any,
  })

  return created
}
