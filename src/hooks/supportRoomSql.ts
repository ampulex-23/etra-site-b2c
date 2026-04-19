import { sql } from '@payloadcms/db-postgres'
import type { Payload } from 'payload'

/**
 * Grapheme-safe truncation (keeps emojis/surrogate pairs intact).
 */
export function graphemeSlice(input: string, max: number): string {
  if (!input) return ''
  const arr = Array.from(input)
  return arr.length <= max ? input : arr.slice(0, max).join('')
}

/**
 * Atomically applies last-message fields + increments the correct unread
 * counter on `chat_rooms`. For support rooms, reopens the conversation when
 * the customer posts after it was closed. All logic is done in a single SQL
 * statement — no read-modify-write race.
 */
export async function applyMessageToRoom(
  payload: Payload,
  params: {
    roomId: number | string
    senderType: 'customer' | 'staff' | 'system'
    text: string
    createdAt: string | Date
  },
): Promise<void> {
  const { roomId, senderType, text, createdAt } = params
  if (senderType === 'system') return

  const drizzle: any = (payload.db as any)?.drizzle
  if (!drizzle) {
    payload.logger?.warn?.('[supportRoomSql] drizzle adapter unavailable; skipping atomic update')
    return
  }

  const lastText = graphemeSlice(String(text || ''), 200)
  const createdAtIso = typeof createdAt === 'string' ? createdAt : new Date(createdAt).toISOString()
  const incStaff = senderType === 'customer' ? 1 : 0
  const incCustomer = senderType === 'staff' ? 1 : 0
  const reopen = senderType === 'customer'

  await drizzle.execute(sql`
    UPDATE chat_rooms
    SET
      last_message_text = ${lastText},
      last_message_at = ${createdAtIso}::timestamptz,
      last_message_sender_type = ${senderType},
      unread_by_staff = COALESCE(unread_by_staff, 0) + ${incStaff},
      unread_by_customer = COALESCE(unread_by_customer, 0) + ${incCustomer},
      status = CASE
        WHEN type = 'support' AND ${reopen} AND status = 'closed' THEN 'open'
        ELSE status
      END,
      closed_at = CASE
        WHEN type = 'support' AND ${reopen} AND status = 'closed' THEN NULL
        ELSE closed_at
      END,
      updated_at = NOW()
    WHERE id = ${roomId as any}
  `)
}

/**
 * Marks all unread peer messages as read up to a timestamp and resets the
 * unread counter on `chat_rooms` in a single round-trip (two statements).
 */
export async function markRoomRead(
  payload: Payload,
  params: {
    roomId: number | string
    mySide: 'customer' | 'staff'
    upToAt: string
  },
): Promise<number> {
  const { roomId, mySide, upToAt } = params
  const drizzle: any = (payload.db as any)?.drizzle
  if (!drizzle) return 0

  const otherSide = mySide === 'staff' ? 'customer' : 'staff'
  const readAt = new Date().toISOString()

  const result: any = await drizzle.execute(sql`
    UPDATE messages
    SET read_at = ${readAt}::timestamptz
    WHERE chat_room_id = ${roomId as any}
      AND sender_type = ${otherSide}
      AND read_at IS NULL
      AND created_at <= ${upToAt}::timestamptz
  `)

  const unreadColumn = mySide === 'staff' ? 'unread_by_staff' : 'unread_by_customer'
  await drizzle.execute(sql`
    UPDATE chat_rooms
    SET ${sql.raw(unreadColumn)} = 0, updated_at = NOW()
    WHERE id = ${roomId as any}
  `)

  return Number(result?.rowCount ?? result?.rows?.length ?? 0)
}
