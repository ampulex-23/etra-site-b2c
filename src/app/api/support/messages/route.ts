import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { getAuthenticatedCustomer } from '@/utils/auth/getAuthenticatedCustomer'

const MAX_TEXT = 4000

/**
 * POST /api/support/messages
 * Body: { text: string }
 * Creates/reuses the customer's support room and posts a new message.
 * Returns { room, message }.
 */
export async function POST(req: NextRequest) {
  try {
    const payload = await getPayload({ config })
    const customer = await getAuthenticatedCustomer(payload, req)
    if (!customer) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    const body = await req.json().catch(() => ({}))
    const text = String(body?.text ?? '').trim()
    if (!text) return NextResponse.json({ error: 'Текст обязателен' }, { status: 400 })
    if (text.length > MAX_TEXT) {
      return NextResponse.json({ error: `Сообщение слишком длинное (max ${MAX_TEXT})` }, { status: 400 })
    }

    // Find existing support room for this customer (any status)
    const existing = await payload.find({
      collection: 'chat-rooms' as any,
      where: {
        type: { equals: 'support' },
        customer: { equals: customer.id },
      },
      sort: '-createdAt',
      limit: 1,
      depth: 0,
      overrideAccess: true,
    })

    let room: any = existing.docs[0]
    if (!room) {
      room = await payload.create({
        collection: 'chat-rooms' as any,
        data: {
          type: 'support',
          title: 'Поддержка',
          customer: customer.id,
          status: 'open',
          isActive: true,
        } as any,
        user: customer,
        overrideAccess: false,
      })
    }

    const message = await payload.create({
      collection: 'messages' as any,
      data: {
        chatRoom: room.id,
        senderType: 'customer',
        senderCustomer: customer.id,
        text,
      } as any,
      user: customer,
      overrideAccess: false,
      depth: 1,
    })

    // Refresh room (messageAfterChange updated counters + lastMessage*)
    const refreshed = await payload.findByID({
      collection: 'chat-rooms' as any,
      id: room.id,
      depth: 0,
      overrideAccess: true,
    })

    return NextResponse.json({ room: refreshed, message })
  } catch (error: any) {
    console.error('[api/support/messages] error:', error)
    return NextResponse.json({ error: error?.message || 'Ошибка сервера' }, { status: 500 })
  }
}
