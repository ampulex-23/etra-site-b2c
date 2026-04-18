import type { Payload } from 'payload'

/**
 * Поднимается вверх по цепочке спонсоров МЛМ до 3 уровней.
 * Возвращает массив партнёров: [level1, level2, level3]
 * Если уровня нет — элемент отсутствует в массиве.
 */
export async function getSponsorChain(
  payload: Payload,
  partnerId: number | string,
  maxLevels = 3,
): Promise<any[]> {
  const chain: any[] = []
  let currentId: number | string | null = partnerId

  for (let level = 0; level < maxLevels; level++) {
    if (!currentId) break

    const partner = (await payload.findByID({
      collection: 'referral-partners' as any,
      id: currentId,
    })) as any

    if (!partner?.sponsor) break

    const sponsorId =
      typeof partner.sponsor === 'object' ? partner.sponsor.id : partner.sponsor

    const sponsor = (await payload.findByID({
      collection: 'referral-partners' as any,
      id: sponsorId,
    })) as any

    if (!sponsor || sponsor.status !== 'active') break

    chain.push(sponsor)
    currentId = sponsor.id
  }

  return chain
}
