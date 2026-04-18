import type { Payload } from 'payload'

/**
 * Извлекает клиента из JWT-заголовка Authorization.
 * Возвращает null если не авторизован.
 */
export async function getAuthenticatedCustomer(
  payload: Payload,
  req: { headers: Headers | { get(name: string): string | null } },
): Promise<any | null> {
  try {
    const authHeader =
      typeof (req.headers as Headers).get === 'function'
        ? (req.headers as Headers).get('authorization')
        : (req.headers as any).authorization

    if (!authHeader) return null

    // Формат: "JWT <token>" или "Bearer <token>"
    const token = authHeader.replace(/^(JWT|Bearer)\s+/i, '').trim()
    if (!token) return null

    // Payload имеет метод auth для проверки токена
    const result = await (payload as any).auth({
      headers: new Headers({ authorization: `JWT ${token}` }),
    })

    const user = result?.user
    if (!user) return null

    // Убеждаемся что это клиент, а не админ
    if (user.collection !== 'customers') return null

    return user
  } catch (error) {
    console.error('[getAuthenticatedCustomer] error:', error)
    return null
  }
}

/**
 * Находит `ReferralPartner` для клиента (может вернуть null если не партнёр)
 */
export async function getCustomerPartner(
  payload: Payload,
  customerId: number | string,
): Promise<any | null> {
  const result = await payload.find({
    collection: 'referral-partners' as any,
    where: { customer: { equals: customerId } },
    depth: 1,
    limit: 1,
  })
  return result.docs[0] || null
}
