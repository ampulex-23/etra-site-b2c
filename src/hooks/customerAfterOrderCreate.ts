import type { CollectionAfterChangeHook } from 'payload'
import { resolveAttribution } from '../utils/referral/resolveAttribution'

/**
 * После создания заказа:
 *  - Определяем привязку клиента к партнёру по промокоду
 *  - Заполняем `referralPartner`, `promoCodeApplied`, `customerDiscountApplied`
 *  - Обновляем `Customer.attributedPartner` если ещё не привязан
 *  - Создаём событие в `referral-events`
 *
 * Важно: комиссии НЕ начисляются здесь, только привязка.
 * Комиссии создаются в referralAfterOrderPaid при оплате.
 */
export const customerAfterOrderCreate: CollectionAfterChangeHook = async ({
  doc,
  req,
  operation,
}) => {
  if (operation !== 'create') return doc

  try {
    const settings = (await req.payload.findGlobal({
      slug: 'referral-settings' as any,
    })) as any

    if (!settings?.enabled) return doc
    if (doc.referralPartner) return doc // Уже привязан

    const customerId = typeof doc.customer === 'object' ? doc.customer.id : doc.customer
    if (!customerId) return doc

    const promoCode = (doc.promoCodeApplied || '').toString().trim().toUpperCase()

    const attribution = await resolveAttribution(req.payload, customerId, promoCode)

    const updates: any = {}

    if (attribution.partnerId) {
      updates.referralPartner = attribution.partnerId

      // Применить скидку первой покупки (если привязка новая и нет ещё первой покупки)
      if (attribution.isFirstPurchase && !attribution.wasAlreadyAttributed) {
        const discountPct = Number(settings?.customerDiscountFirstPurchase ?? 10)
        const orderTotal = Number(doc.total || 0)
        const discountAmount = Math.round((orderTotal * discountPct) / (100 + discountPct) * 100) / 100
        // Применяем к уже созданному total чисто как учётное поле (не пересчитываем сам заказ)
        updates.customerDiscountApplied = discountAmount
      }

      // Создать событие
      try {
        await req.payload.create({
          collection: 'referral-events' as any,
          data: {
            partner: attribution.partnerId,
            eventType: attribution.wasAlreadyAttributed ? 'order_placed' : 'attribution',
            customer: customerId,
            order: doc.id,
            promoCode: attribution.promoCode,
            source: 'direct',
          } as any,
        })
      } catch (err) {
        console.error('[referral] Failed to create referral-event:', err)
      }

      // Обновить Customer.attributedPartner если ещё не привязан
      if (!attribution.wasAlreadyAttributed && attribution.partnerId) {
        try {
          await req.payload.update({
            collection: 'customers',
            id: customerId,
            data: {
              attributedPartner: attribution.partnerId,
              attributedAt: new Date().toISOString(),
            } as any,
          })
        } catch (err) {
          console.error('[referral] Failed to update customer attribution:', err)
        }
      }
    }

    if (Object.keys(updates).length > 0) {
      await req.payload.update({
        collection: 'orders',
        id: doc.id,
        data: updates,
      })
    }
  } catch (error) {
    console.error('[customerAfterOrderCreate] error:', error)
  }

  return doc
}
