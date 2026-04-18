import type { Payload } from 'payload'

export interface AttributionResult {
  partnerId: number | string | null
  promoCode: string | null
  isFirstPurchase: boolean
  wasAlreadyAttributed: boolean
}

/**
 * Определяет к какому партнёру привязать клиента при оформлении заказа.
 *
 * Логика:
 *  1. Если клиент УЖЕ привязан к партнёру — оставляем эту привязку навсегда.
 *     Новый промокод игнорируется, но скидка первой покупки НЕ применяется (была уже привязка).
 *  2. Если клиент не привязан и вводит промокод — привязываем.
 *  3. Если у клиента свежая привязка (до firstPurchaseCompleted=true) — считаем первую покупку.
 */
export async function resolveAttribution(
  payload: Payload,
  customerId: number | string,
  submittedPromoCode?: string,
): Promise<AttributionResult> {
  const customer = (await payload.findByID({
    collection: 'customers',
    id: customerId,
  })) as any

  // Если уже привязан — не меняем
  if (customer?.attributedPartner) {
    const partnerId =
      typeof customer.attributedPartner === 'object'
        ? customer.attributedPartner.id
        : customer.attributedPartner

    return {
      partnerId,
      promoCode: null,
      isFirstPurchase: !customer.firstPurchaseCompleted,
      wasAlreadyAttributed: true,
    }
  }

  // Новая привязка по промокоду
  if (submittedPromoCode) {
    const partners = await payload.find({
      collection: 'referral-partners' as any,
      where: {
        promoCode: { equals: submittedPromoCode.toUpperCase() },
        status: { equals: 'active' },
      },
      limit: 1,
    })

    if (partners.docs.length > 0) {
      const partner = partners.docs[0] as any
      return {
        partnerId: partner.id,
        promoCode: partner.promoCode,
        isFirstPurchase: true,
        wasAlreadyAttributed: false,
      }
    }
  }

  return {
    partnerId: null,
    promoCode: null,
    isFirstPurchase: !customer?.firstPurchaseCompleted,
    wasAlreadyAttributed: false,
  }
}
