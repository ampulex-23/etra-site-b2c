/**
 * Расчёт партнёрской цены товара
 *
 * Приоритет:
 *  1. Если excludeFromPartnerDiscount — розничная цена
 *  2. Если задан partnerPriceOverride — используется напрямую
 *  3. Если задан partnerDiscountPercentOverride — применяется к розничной
 *  4. Иначе — глобальный % скидки
 */
export function getPartnerPrice(
  product: any,
  globalPartnerDiscountPercent: number,
): number {
  const retailPrice = product?.price || 0
  if (retailPrice <= 0) return 0

  if (product?.excludeFromPartnerDiscount) {
    return retailPrice
  }

  if (typeof product?.partnerPriceOverride === 'number' && product.partnerPriceOverride > 0) {
    return product.partnerPriceOverride
  }

  const percent =
    typeof product?.partnerDiscountPercentOverride === 'number' &&
    product.partnerDiscountPercentOverride >= 0
      ? product.partnerDiscountPercentOverride
      : globalPartnerDiscountPercent

  const discount = retailPrice * (percent / 100)
  return Math.max(0, Math.round((retailPrice - discount) * 100) / 100)
}

/**
 * Проверка: имеет ли клиент право на партнёрскую цену
 */
export function customerHasPartnerPriceAccess(customer: any, partner: any): boolean {
  if (!customer?.attributedPartner) return false
  if (!partner) return false
  if (partner.status !== 'active') return false
  if (partner.type !== 'mlm_partner') return false
  return partner.partnerPriceEnabled !== false
}
