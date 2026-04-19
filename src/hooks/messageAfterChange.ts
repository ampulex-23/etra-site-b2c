import type { CollectionAfterChangeHook } from 'payload'
import { applyMessageToRoom } from './supportRoomSql'

/**
 * afterChange hook for `messages` collection.
 *
 * Atomically denormalises last-message info onto the parent `chat-rooms`
 * document and increments `unreadByStaff` / `unreadByCustomer` counters via
 * a single SQL UPDATE (no read-modify-write race). For support rooms,
 * re-opens a closed conversation when the customer sends a new message.
 *
 * NOTE: the external WebSocket server (chat-server) performs the same
 * update when it persists messages directly; keep the two implementations
 * in sync (see chat-server/src/index.ts → applyMessageToRoom).
 */
export const messageAfterChange: CollectionAfterChangeHook = async ({
  doc,
  operation,
  req,
  context,
}) => {
  if (operation !== 'create') return doc
  if ((context as any)?.skipSupportHooks) return doc
  if (doc.senderType === 'system') return doc

  const roomId =
    typeof doc.chatRoom === 'object' && doc.chatRoom !== null
      ? (doc.chatRoom as any).id
      : doc.chatRoom
  if (!roomId) return doc

  try {
    await applyMessageToRoom(req.payload, {
      roomId,
      senderType: doc.senderType,
      text: String(doc.text || ''),
      createdAt: doc.createdAt,
    })
  } catch (err) {
    req.payload.logger?.error?.({ err, msg: '[messageAfterChange] failed to update room' })
  }

  return doc
}
