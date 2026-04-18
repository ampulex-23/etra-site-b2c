import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { getAuthenticatedStaff } from '@/utils/auth/getAuthenticatedStaff'

/**
 * GET /api/support/rooms
 * Query: status?, assignee?=me|<id>, unread?=1, q?, limit?=20, page?=1, sort?=-lastMessageAt
 * Staff-only listing of support rooms + totalUnread aggregate.
 */
export async function GET(req: NextRequest) {
  try {
    const payload = await getPayload({ config })
    const staff = await getAuthenticatedStaff(payload, req)
    if (!staff) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })

    const url = new URL(req.url)
    const status = url.searchParams.get('status')
    const assignee = url.searchParams.get('assignee')
    const unread = url.searchParams.get('unread')
    const q = url.searchParams.get('q')
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '20', 10) || 20, 100)
    const page = parseInt(url.searchParams.get('page') || '1', 10) || 1
    const sort = url.searchParams.get('sort') || '-lastMessageAt'

    const and: any[] = [{ type: { equals: 'support' } }]
    if (status) and.push({ status: { equals: status } })
    if (unread === '1') and.push({ unreadByStaff: { greater_than: 0 } })
    if (assignee) {
      const id = assignee === 'me' ? staff.id : assignee
      and.push({ assignee: { equals: id } })
    }
    if (q) {
      and.push({
        or: [
          { title: { contains: q } },
          { 'customer.name': { contains: q } },
          { 'customer.email': { contains: q } },
        ],
      })
    }

    const result = await payload.find({
      collection: 'chat-rooms' as any,
      where: { and },
      sort,
      limit,
      page,
      depth: 1,
      overrideAccess: true,
    })

    // Aggregate total unread for the staff badge
    const unreadAgg = await payload.find({
      collection: 'chat-rooms' as any,
      where: {
        and: [
          { type: { equals: 'support' } },
          { status: { equals: 'open' } },
          { unreadByStaff: { greater_than: 0 } },
        ],
      },
      limit: 1000,
      depth: 0,
      overrideAccess: true,
    })
    const totalUnread = unreadAgg.docs.reduce(
      (sum: number, r: any) => sum + (r.unreadByStaff || 0),
      0,
    )
    const totalUnreadRooms = unreadAgg.docs.length

    return NextResponse.json({
      docs: result.docs,
      totalDocs: result.totalDocs,
      totalPages: result.totalPages,
      page: result.page,
      hasNextPage: result.hasNextPage,
      totalUnread,
      totalUnreadRooms,
    })
  } catch (error: any) {
    console.error('[api/support/rooms] error:', error)
    return NextResponse.json({ error: error?.message || 'Ошибка сервера' }, { status: 500 })
  }
}
