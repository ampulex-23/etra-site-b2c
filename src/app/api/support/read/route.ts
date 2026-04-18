import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { getAuthenticatedCustomer } from '@/utils/auth/getAuthenticatedCustomer'
import { getAuthenticatedStaff } from '@/utils/auth/getAuthenticatedStaff'

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
    let upToAt: string | null = null
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
    const otherSide = mySide === 'staff' ? 'customer' : 'staff'

    // Reset unread counter
    const patch: Record<string, any> = {}
    if (mySide === 'staff') patch.unreadByStaff = 0
    else patch.unreadByCustomer = 0

    await payload.update({
      collection: 'chat-rooms' as any,
      id: room.id,
      data: patch,
      overrideAccess: true,
      context: { skipSupportHooks: true },
    })

    // Stamp readAt on peer's unread messages up to upToAt
    const readAt = new Date().toISOString()
    const unread = await payload.find({
      collection: 'messages' as any,
      where: {
        chatRoom: { equals: room.id },
        senderType: { equals: otherSide },
        readAt: { exists: false },
        createdAt: { less_than_equal: upToAt },
      },
      limit: 500,
      depth: 0,
      overrideAccess: true,
    })

    await Promise.all(
      unread.docs.map((m: any) =>
        payload.update({
          collection: 'messages' as any,
          id: m.id,
          data: { readAt } as any,
          overrideAccess: true,
        }),
      ),
    )

    return NextResponse.json({ ok: true, readAt, count: unread.docs.length })
  } catch (error: any) {
    console.error('[api/support/read] error:', error)
    return NextResponse.json({ error: error?.message || 'Ошибка сервера' }, { status: 500 })
  }
}
