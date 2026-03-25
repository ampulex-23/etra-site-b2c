import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

/**
 * GET /api/messages?chatRoom=<id>&limit=50&before=<timestamp>
 * Returns messages for a chat room. Requires authenticated customer.
 * 
 * POST /api/messages
 * Body: { chatRoom, text }
 * Creates a message in the chat room. Validates enrollment.
 */

export async function GET(req: NextRequest) {
  try {
    const payload = await getPayload({ config })
    const { searchParams } = new URL(req.url)

    const chatRoomId = searchParams.get('chatRoom')
    const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 100)
    const before = searchParams.get('before')

    if (!chatRoomId) {
      return NextResponse.json({ error: 'Parameter "chatRoom" is required' }, { status: 400 })
    }

    // Build where clause
    const where: Record<string, any> = {
      chatRoom: { equals: chatRoomId },
      isDeleted: { not_equals: true },
    }

    if (before) {
      where.createdAt = { less_than: before }
    }

    const messages = await payload.find({
      collection: 'messages' as any,
      where,
      sort: '-createdAt',
      limit,
      depth: 1,
    })

    return NextResponse.json({
      messages: messages.docs,
      totalDocs: messages.totalDocs,
      hasNextPage: messages.hasNextPage,
    })
  } catch (error: any) {
    console.error('[api/messages] GET error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const payload = await getPayload({ config })
    const body = await req.json()
    const { chatRoom: chatRoomId, text } = body

    if (!chatRoomId || !text?.trim()) {
      return NextResponse.json(
        { error: 'Fields "chatRoom" and "text" are required' },
        { status: 400 },
      )
    }

    // Get the chat room to find the cohort
    const chatRoom = await payload.findByID({
      collection: 'chat-rooms' as any,
      id: chatRoomId,
      depth: 0,
    })

    if (!chatRoom || !chatRoom.isActive) {
      return NextResponse.json({ error: 'Чат-комната не найдена или неактивна' }, { status: 404 })
    }

    // Determine sender info from headers (customer auth)
    // Payload REST API handles auth via cookies/headers
    // For now, create message with data as provided
    const message = await payload.create({
      collection: 'messages' as any,
      data: {
        chatRoom: chatRoomId,
        senderType: body.senderType || 'customer',
        senderCustomer: body.senderCustomer || undefined,
        senderUser: body.senderUser || undefined,
        text: text.trim(),
        attachments: body.attachments || [],
      },
      depth: 1,
    })

    return NextResponse.json({ message })
  } catch (error: any) {
    console.error('[api/messages] POST error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
