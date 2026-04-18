import type { Payload } from 'payload'
import crypto from 'crypto'

/**
 * Транслитерация русского имени в латиницу (упрощённая)
 */
function transliterate(text: string): string {
  const map: Record<string, string> = {
    а: 'A', б: 'B', в: 'V', г: 'G', д: 'D', е: 'E', ё: 'E', ж: 'ZH',
    з: 'Z', и: 'I', й: 'Y', к: 'K', л: 'L', м: 'M', н: 'N', о: 'O',
    п: 'P', р: 'R', с: 'S', т: 'T', у: 'U', ф: 'F', х: 'H', ц: 'TS',
    ч: 'CH', ш: 'SH', щ: 'SCH', ъ: '', ы: 'Y', ь: '', э: 'E', ю: 'YU', я: 'YA',
  }
  return text
    .toLowerCase()
    .split('')
    .map((char) => map[char] ?? char)
    .join('')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
}

function randomDigits(length: number): string {
  return Math.floor(Math.random() * Math.pow(10, length))
    .toString()
    .padStart(length, '0')
}

function randomAlnum(length: number): string {
  return crypto.randomBytes(length).toString('hex').slice(0, length).toUpperCase()
}

/**
 * Проверка уникальности промокода
 */
async function isCodeUnique(payload: Payload, code: string): Promise<boolean> {
  const result = await payload.find({
    collection: 'referral-partners' as any,
    where: { promoCode: { equals: code } },
    limit: 1,
  })
  return result.docs.length === 0
}

/**
 * Генерация уникального промокода на основе настроек
 * @param pattern 'uppercase_name' | 'random_6' | 'custom'
 * @param customerName имя клиента (для uppercase_name)
 */
export async function generatePromoCode(
  payload: Payload,
  pattern: string,
  customerName?: string,
): Promise<string> {
  const maxAttempts = 20

  for (let i = 0; i < maxAttempts; i++) {
    let code = ''

    if (pattern === 'uppercase_name' && customerName) {
      const name = transliterate(customerName).slice(0, 8) || 'PARTNER'
      const suffix = randomDigits(i === 0 ? 2 : 4)
      code = `${name}${suffix}`
    } else {
      code = randomAlnum(6)
    }

    if (await isCodeUnique(payload, code)) {
      return code
    }
  }

  // Фоллбэк: длинный случайный код
  return randomAlnum(10)
}
