import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { getAuthenticatedCustomer } from '@/utils/auth/getAuthenticatedCustomer'
import { getAuthenticatedStaff } from '@/utils/auth/getAuthenticatedStaff'
import { markRoomRead } from '@/hooks/supportRoomSql'

/**
 * POST /api/support/read
 * Body: { chatRoom, upTo?: messageId }
 * Clears unread counter for the caller's side and stamps `readAt` on the
 * other party's unread messages up to (and including) `upTo`.
 */
export async function POST(req: NextRequest) {
  try {
    const payload = await getPayload({ config })

    const staff = await getAuthenticatedStaff(payload, req)
    const customer = staff ? null : await getAuthenticatedCustomer(payload, req)
    if (!staff && !customer) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    const body = await req.json().catch(() => ({}))
    const chatRoomId = body?.chatRoom
    const upToId = body?.upTo
    if (!chatRoomId) {
      return NextResponse.json({ error: 'chatRoom обязателен' }, { status: 400 })
    }

    const room: any = await payload.findByID({
      collection: 'chat-rooms' as any,
      id: chatRoomId,
      depth: 0,
      overrideAccess: true,
    }).catch(() => null)
    if (!room) return NextResponse.json({ error: 'Комната не найдена' }, { status: 404 })

    // Ownership check for customer role
    if (customer) {
      const owner = typeof room.customer === 'object' ? room.customer?.id : room.customer
      if (!owner || String(owner) !== String(customer.id)) {
        return NextResponse.json({ error: 'Нет доступа' }, { status: 403 })
      }
    }

    // Resolve upTo timestamp
    let upToAt: string = ''
    if (upToId) {
      const msg: any = await payload
        .findByID({ collection: 'messages' as any, id: upToId, depth: 0, overrideAccess: true })
        .catch(() => null)
      if (msg && String(msg.chatRoom?.id ?? msg.chatRoom) === String(room.id)) {
        upToAt = msg.createdAt
      }
    }
    if (!upToAt) upToAt = room.lastMessageAt || new Date().toISOString()

    const mySide: 'customer' | 'staff' = staff ? 'staff' : 'customer'

    // Single-round-trip: stamp readAt on peer messages + reset unread counter.
    const count = await markRoomRead(payload, {
      roomId: room.id,
      mySide,
      upToAt,
    })

    return NextResponse.json({ ok: true, readAt: new Date().toISOString(), count })
  } catch (error: any) {
    console.error('[api/support/read] error:', error)
    return NextResponse.json({ error: error?.message || 'Ошибка сервера' }, { status: 500 })
  }
}
