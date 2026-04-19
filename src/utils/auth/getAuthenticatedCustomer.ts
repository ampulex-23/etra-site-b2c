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
    const src = req.headers as any
    const getHdr = (name: string): string | null =>
      typeof src.get === 'function' ? src.get(name) : (src[name] ?? src[name.toLowerCase()] ?? null)

    // Forward the original headers (including Cookie) so Payload reads either
    // the `Authorization: JWT …` header OR the httpOnly `payload-token` cookie.
    const fwd = new Headers()
    const auth = getHdr('authorization')
    if (auth) fwd.set('authorization', auth)
    const cookie = getHdr('cookie')
    if (cookie) fwd.set('cookie', cookie)
    if (!auth && !cookie) return null

    const result = await (payload as any).auth({ headers: fwd })
    const user = result?.user
    if (!user) return null

    // Only customers — admin users go through a different path.
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
