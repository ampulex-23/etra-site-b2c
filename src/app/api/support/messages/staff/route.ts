import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { getAuthenticatedStaff } from '@/utils/auth/getAuthenticatedStaff'

const MAX_TEXT = 4000

/**
 * POST /api/support/messages/staff
 * Body: { chatRoom, text }
 * Staff-authored reply to an existing chat room.
 */
export async function POST(req: NextRequest) {
  try {
    const payload = await getPayload({ config })
    const staff = await getAuthenticatedStaff(payload, req)
    if (!staff) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })

    const body = await req.json().catch(() => ({}))
    const chatRoomId = body?.chatRoom
    const text = String(body?.text ?? '').trim()
    if (!chatRoomId) return NextResponse.json({ error: 'chatRoom обязателен' }, { status: 400 })
    if (!text) return NextResponse.json({ error: 'Текст обязателен' }, { status: 400 })
    if (text.length > MAX_TEXT) {
      return NextResponse.json({ error: `Сообщение слишком длинное (max ${MAX_TEXT})` }, { status: 400 })
    }

    const room: any = await payload.findByID({
      collection: 'chat-rooms' as any,
      id: chatRoomId,
      depth: 0,
      overrideAccess: true,
    }).catch(() => null)
    if (!room) return NextResponse.json({ error: 'Комната не найдена' }, { status: 404 })
    if (room.type !== 'support') {
      return NextResponse.json(
        { error: 'Этот эндпоинт предназначен только для support-комнат' },
        { status: 400 },
      )
    }

    const message = await payload.create({
      collection: 'messages' as any,
      data: {
        chatRoom: room.id,
        senderType: 'staff',
        senderUser: staff.id,
        text,
      } as any,
      user: staff,
      overrideAccess: false,
      depth: 1,
    })

    return NextResponse.json({ message })
  } catch (error: any) {
    console.error('[api/support/messages/staff] error:', error)
    return NextResponse.json({ error: error?.message || 'Ошибка сервера' }, { status: 500 })
  }
}
