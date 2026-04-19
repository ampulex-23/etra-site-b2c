import type { Payload } from 'payload'
import crypto from 'crypto'

interface JwtPayload {
  id: string | number
  email?: string
  collection?: string
  iat?: number
  exp?: number
}

/**
 * Manual JWT verify (HMAC-SHA256 with PAYLOAD_SECRET) — mirrors the logic
 * used in /api/profile which is proven to work with the tokens issued by
 * `/api/customers/login`. We avoid `payload.auth()` here because in Payload
 * v3 it rejects the `JWT <token>` scheme for custom (non-users) collections.
 */
function verifyJwt(token: string, secret: string): JwtPayload | null {
  try {
    const [headerB64, payloadB64, signatureB64] = token.split('.')
    if (!headerB64 || !payloadB64 || !signatureB64) return null
    const expected = crypto
      .createHmac('sha256', secret)
      .update(`${headerB64}.${payloadB64}`)
      .digest('base64url')
    if (expected !== signatureB64) return null
    const decoded = JSON.parse(Buffer.from(payloadB64, 'base64url').toString()) as JwtPayload
    if (decoded.exp && decoded.exp < Math.floor(Date.now() / 1000)) return null
    return decoded
  } catch {
    return null
  }
}

function extractToken(
  req: { headers: Headers | { get(name: string): string | null } },
): string | null {
  const src = req.headers as any
  const getHdr = (name: string): string | null =>
    typeof src.get === 'function' ? src.get(name) : (src[name] ?? src[name.toLowerCase()] ?? null)

  const auth = getHdr('authorization')
  if (auth) {
    const m = auth.match(/^(?:JWT|Bearer)\s+(.+)$/i)
    if (m) return m[1].trim()
  }

  // Fallback to Payload cookie
  const cookie = getHdr('cookie')
  if (cookie) {
    for (const part of cookie.split(';')) {
      const [k, ...rest] = part.trim().split('=')
      if (k === 'payload-token' || k === 'etra-customer-token') {
        return decodeURIComponent(rest.join('='))
      }
    }
  }
  return null
}

/**
 * Extracts the authenticated customer from the request.
 * Returns null if unauthorized.
 */
export async function getAuthenticatedCustomer(
  payload: Payload,
  req: { headers: Headers | { get(name: string): string | null } },
): Promise<any | null> {
  try {
    const token = extractToken(req)
    if (!token) return null

    const secret = process.env.PAYLOAD_SECRET || ''
    if (!secret) {
      console.error('[getAuthenticatedCustomer] PAYLOAD_SECRET is not set')
      return null
    }

    const decoded = verifyJwt(token, secret)
    if (!decoded || decoded.collection !== 'customers' || !decoded.id) return null

    const customer = await payload.findByID({
      collection: 'customers',
      id: decoded.id as any,
      depth: 0,
      overrideAccess: true,
    })
    return customer || null
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
