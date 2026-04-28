import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import crypto from 'crypto'

interface JwtPayload {
  id: string
  email: string
  collection: string
  iat: number
  exp: number
}

function verifyJwt(token: string, secret: string): JwtPayload | null {
  try {
    const [headerB64, payloadB64, signatureB64] = token.split('.')
    if (!headerB64 || !payloadB64 || !signatureB64) return null

    const expectedSig = crypto
      .createHmac('sha256', secret)
      .update(`${headerB64}.${payloadB64}`)
      .digest('base64url')

    if (expectedSig !== signatureB64) return null

    const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString())
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return null

    return payload as JwtPayload
  } catch {
    return null
  }
}

function getDecodedFromAuth(req: NextRequest): JwtPayload | null {
  const authHeader = req.headers.get('authorization') || req.headers.get('Authorization')
  if (!authHeader?.startsWith('JWT ')) return null
  const token = authHeader.slice(4)
  const decoded = verifyJwt(token, process.env.PAYLOAD_SECRET || '')
  if (!decoded || decoded.collection !== 'customers' || !decoded.id) return null
  return decoded
}

/**
 * POST /api/customers/me/favorites
 * Body: { productId: string | number, action?: 'toggle' | 'add' | 'remove' }
 * Returns: { favorites: Array<id>, isFavorite: boolean }
 */
export async function POST(req: NextRequest) {
  try {
    const decoded = getDecodedFromAuth(req)
    if (!decoded) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = (await req.json().catch(() => ({}))) as {
      productId?: string | number
      action?: 'toggle' | 'add' | 'remove'
    }
    if (body.productId === undefined || body.productId === null) {
      return NextResponse.json({ error: 'productId is required' }, { status: 400 })
    }

    const productId = String(body.productId)
    const action = body.action || 'toggle'

    const payload = await getPayload({ config })

    const customer = await payload.findByID({
      collection: 'customers',
      id: decoded.id,
      depth: 0,
      overrideAccess: true,
    })

    if (!customer) return NextResponse.json({ error: 'Customer not found' }, { status: 404 })

    const current = Array.isArray((customer as any).favorites)
      ? ((customer as any).favorites as Array<string | number>).map((v) => String(v))
      : []

    const has = current.includes(productId)
    let next: string[]
    if (action === 'add') {
      next = has ? current : [...current, productId]
    } else if (action === 'remove') {
      next = current.filter((id) => id !== productId)
    } else {
      next = has ? current.filter((id) => id !== productId) : [...current, productId]
    }

    const updated = await payload.update({
      collection: 'customers',
      id: decoded.id,
      data: { favorites: next as any },
      overrideAccess: true,
      depth: 0,
    })

    const finalIds = Array.isArray((updated as any).favorites)
      ? ((updated as any).favorites as Array<string | number>).map((v) => String(v))
      : []

    return NextResponse.json({
      favorites: finalIds,
      isFavorite: finalIds.includes(productId),
    })
  } catch (err) {
    console.error('[favorites toggle] error', err)
    const message = err instanceof Error ? err.message : 'Server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
