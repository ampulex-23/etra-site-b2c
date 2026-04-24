import crypto from 'crypto'

export interface CustomerJwtPayload {
  id: string
  email: string
  collection: string
  iat: number
  exp: number
}

/**
 * Minimal HS256 JWT verification for the `customers` collection.
 * Returns null if the token is malformed, has a bad signature, is expired,
 * or was issued for a different collection.
 */
export function verifyCustomerJwt(
  token: string,
  secret: string = process.env.PAYLOAD_SECRET || '',
): CustomerJwtPayload | null {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null

    const [header, payload, signature] = parts
    const expectedSig = crypto
      .createHmac('sha256', secret)
      .update(`${header}.${payload}`)
      .digest('base64url')

    if (signature !== expectedSig) return null

    const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString()) as CustomerJwtPayload
    if (!decoded || !decoded.id || decoded.collection !== 'customers') return null
    if (decoded.exp && decoded.exp < Math.floor(Date.now() / 1000)) return null
    return decoded
  } catch {
    return null
  }
}

/**
 * Extract + verify the `JWT <token>` Authorization header.
 */
export function getCustomerFromRequest(req: Request): CustomerJwtPayload | null {
  const authHeader = req.headers.get('Authorization')
  if (!authHeader || !authHeader.startsWith('JWT ')) return null
  return verifyCustomerJwt(authHeader.replace('JWT ', ''))
}
