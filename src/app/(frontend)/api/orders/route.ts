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

/**
 * POST /api/orders - Create a new order
 */
export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization')
    console.log('[Orders API] Auth header present:', !!authHeader)
    
    if (!authHeader || !authHeader.startsWith('JWT ')) {
      console.log('[Orders API] No JWT header')
      return NextResponse.json({ errors: [{ message: 'Unauthorized' }] }, { status: 401 })
    }

    const token = authHeader.replace('JWT ', '')
    console.log('[Orders API] Token length:', token.length)
    
    const decoded = verifyJwt(token, process.env.PAYLOAD_SECRET || '')
    console.log('[Orders API] Decoded:', decoded ? { id: decoded.id, collection: decoded.collection } : 'null')
    
    if (!decoded || !decoded.id || decoded.collection !== 'customers') {
      console.log('[Orders API] Invalid token - decoded:', !!decoded, 'id:', decoded?.id, 'collection:', decoded?.collection)
      return NextResponse.json({ errors: [{ message: 'Invalid token' }] }, { status: 401 })
    }

    // Check expiration
    if (decoded.exp && decoded.exp < Math.floor(Date.now() / 1000)) {
      console.log('[Orders API] Token expired')
      return NextResponse.json({ errors: [{ message: 'Token expired' }] }, { status: 401 })
    }

    const body = await req.json()
    console.log('[Orders API] Creating order for customer:', decoded.id)
    
    const payload = await getPayload({ config })

    // Validate required fields
    if (!body.items || !Array.isArray(body.items) || body.items.length === 0) {
      return NextResponse.json({ errors: [{ message: 'Items are required' }] }, { status: 400 })
    }

    console.log('[Orders API] Customer ID from token:', decoded.id)

    // Create order
    const order = await payload.create({
      collection: 'orders',
      data: {
        orderNumber: body.orderNumber || `ETR-${Date.now().toString(36).toUpperCase()}`,
        customer: decoded.id as any,
        items: body.items,
        subtotal: body.subtotal || 0,
        deliveryCost: body.deliveryCost || 0,
        total: body.total || 0,
        status: body.status || 'new',
        delivery: body.delivery || { method: 'pickup', address: 'Самовывоз' },
        notes: body.notes || '',
        payment: body.payment || { status: 'pending' },
        source: 'site',
      } as any,
    })

    return NextResponse.json(order, { status: 201 })
  } catch (err) {
    console.error('Create order error:', err)
    // Log full error details
    if (err instanceof Error) {
      console.error('Error stack:', err.stack)
      console.error('Error name:', err.name)
    }
    const message = err instanceof Error ? err.message : 'Failed to create order'
    return NextResponse.json({ errors: [{ message }] }, { status: 500 })
  }
}

/**
 * GET /api/orders - Get customer's orders
 */
export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('JWT ')) {
      return NextResponse.json({ errors: [{ message: 'Unauthorized' }] }, { status: 401 })
    }

    const token = authHeader.replace('JWT ', '')
    const decoded = verifyJwt(token, process.env.PAYLOAD_SECRET || '')
    
    if (!decoded || !decoded.id || decoded.collection !== 'customers') {
      return NextResponse.json({ errors: [{ message: 'Invalid token' }] }, { status: 401 })
    }

    const payload = await getPayload({ config })

    const orders = await payload.find({
      collection: 'orders',
      where: { customer: { equals: decoded.id } },
      sort: '-createdAt',
      depth: 1,
    })

    return NextResponse.json(orders)
  } catch (err) {
    console.error('Get orders error:', err)
    return NextResponse.json({ errors: [{ message: 'Failed to get orders' }] }, { status: 500 })
  }
}
