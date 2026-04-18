import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { getAuthenticatedCustomer } from '@/utils/auth/getAuthenticatedCustomer'

/**
 * GET /api/support/room
 * Returns the current customer's support room (if any) + last 50 messages.
 * Does NOT create the room — creation happens lazily on first POST /messages.
 */
export async function GET(req: NextRequest) {
  try {
    const payload = await getPayload({ config })
    const customer = await getAuthenticatedCustomer(payload, req)
    if (!customer) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    const roomsRes = await payload.find({
      collection: 'chat-rooms' as any,
      where: {
        type: { equals: 'support' },
        customer: { equals: customer.id },
      },
      sort: '-lastMessageAt',
      limit: 1,
      depth: 0,
    })

    const room = roomsRes.docs[0] || null
    if (!room) return NextResponse.json({ room: null, messages: [] })

    const msgs = await payload.find({
      collection: 'messages' as any,
      where: {
        chatRoom: { equals: (room as any).id },
        isDeleted: { not_equals: true },
      },
      sort: '-createdAt',
      limit: 50,
      depth: 1,
    })

    const messages = [...msgs.docs].reverse()
    return NextResponse.json({ room, messages })
  } catch (error: any) {
    console.error('[api/support/room] error:', error)
    return NextResponse.json({ error: error?.message || 'Ошибка сервера' }, { status: 500 })
  }
}
