import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import crypto from 'crypto'
import config from '@payload-config'
import { getAuthenticatedStaff } from '@/utils/auth/getAuthenticatedStaff'

const TTL_SECONDS = 120

function b64url(input: Buffer | string): string {
  return Buffer.from(input)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
}

function signHS256(payload: Record<string, any>, secret: string): string {
  const header = { alg: 'HS256', typ: 'JWT' }
  const h = b64url(JSON.stringify(header))
  const p = b64url(JSON.stringify(payload))
  const data = `${h}.${p}`
  const sig = crypto.createHmac('sha256', secret).update(data).digest()
  return `${data}.${b64url(sig)}`
}

/**
 * POST /api/support/ws-ticket
 * Issues a short-lived JWT (aud=chat-ws, role=staff) so admin clients can
 * authenticate with the external WS server (which shares PAYLOAD_SECRET).
 */
export async function POST(req: NextRequest) {
  try {
    const payload = await getPayload({ config })
    const staff = await getAuthenticatedStaff(payload, req)
    if (!staff) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })

    const secret = process.env.PAYLOAD_SECRET
    if (!secret) {
      return NextResponse.json({ error: 'PAYLOAD_SECRET не задан' }, { status: 500 })
    }

    const now = Math.floor(Date.now() / 1000)
    const exp = now + TTL_SECONDS
    const token = signHS256(
      {
        sub: String(staff.id),
        role: 'staff',
        name: staff.name || staff.email,
        aud: 'chat-ws',
        iat: now,
        exp,
      },
      secret,
    )

    return NextResponse.json({ token, expiresAt: new Date(exp * 1000).toISOString() })
  } catch (error: any) {
    console.error('[api/support/ws-ticket] error:', error)
    return NextResponse.json({ error: error?.message || 'Ошибка сервера' }, { status: 500 })
  }
}
