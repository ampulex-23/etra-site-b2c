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
    const parts = token.split('.')
    if (parts.length !== 3) return null
    
    const [header, payload, signature] = parts
    
    // Verify signature
    const expectedSig = crypto
      .createHmac('sha256', secret)
      .update(`${header}.${payload}`)
      .digest('base64url')
    
    if (signature !== expectedSig) return null
    
    // Decode payload
    const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString())
    return decoded as JwtPayload
  } catch {
    return null
  }
}

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('JWT ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.replace('JWT ', '')
    
    // Decode and verify JWT
    const decoded = verifyJwt(token, process.env.PAYLOAD_SECRET || '')
    
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    if (!decoded.id || decoded.collection !== 'customers') {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    // Check expiration
    if (decoded.exp && decoded.exp < Math.floor(Date.now() / 1000)) {
      return NextResponse.json({ error: 'Token expired' }, { status: 401 })
    }

    const payload = await getPayload({ config })

    const customer = await payload.findByID({
      collection: 'customers',
      id: decoded.id,
      depth: 0,
    })

    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
    }

    return NextResponse.json({
      user: {
        id: customer.id,
        email: customer.email,
        name: customer.name,
        phone: customer.phone,
        telegramId: (customer as any).telegram?.chatId,
      },
    })
  } catch (err) {
    console.error('Customer me error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
