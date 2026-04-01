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

    return payload
  } catch {
    return null
  }
}

/**
 * GET /api/profile - Get current customer profile
 */
export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization')
    if (!authHeader?.startsWith('JWT ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.slice(4)
    const secret = process.env.PAYLOAD_SECRET || ''
    const decoded = verifyJwt(token, secret)

    if (!decoded || decoded.collection !== 'customers') {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const payload = await getPayload({ config })

    const customer = await payload.findByID({
      collection: 'customers',
      id: decoded.id,
      depth: 2,
      overrideAccess: true,
    })

    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
    }

    return NextResponse.json(customer)
  } catch (err) {
    console.error('[Profile API] Error:', err)
    const message = err instanceof Error ? err.message : 'Failed to get profile'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

/**
 * PATCH /api/profile - Update current customer profile
 */
export async function PATCH(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization')
    if (!authHeader?.startsWith('JWT ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.slice(4)
    const secret = process.env.PAYLOAD_SECRET || ''
    const decoded = verifyJwt(token, secret)

    if (!decoded || decoded.collection !== 'customers') {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const body = await req.json()
    const payload = await getPayload({ config })

    // Only allow updating specific fields
    const allowedFields = ['name', 'phone', 'addresses']
    const updateData: Record<string, any> = {}

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field]
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
    }

    const updated = await payload.update({
      collection: 'customers',
      id: decoded.id,
      data: updateData,
      overrideAccess: true,
    })

    return NextResponse.json(updated)
  } catch (err) {
    console.error('[Profile API] Error:', err)
    const message = err instanceof Error ? err.message : 'Failed to update profile'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
