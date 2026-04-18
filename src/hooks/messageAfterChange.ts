import type { CollectionAfterChangeHook } from 'payload'

/**
 * afterChange hook for `messages` collection.
 *
 * Denormalises last-message info onto the parent `chat-rooms` document and
 * maintains `unreadByStaff` / `unreadByCustomer` counters. For support rooms,
 * re-opens a closed conversation when the customer sends a new message.
 *
 * All nested operations pass `req` to stay within the same transaction.
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
    const room: any = await req.payload.findByID({
      collection: 'chat-rooms' as any,
      id: roomId,
      depth: 0,
      req,
    })
    if (!room) return doc

    const patch: Record<string, any> = {
      lastMessageText: String(doc.text || '').slice(0, 200),
      lastMessageAt: doc.createdAt,
      lastMessageSenderType: doc.senderType,
    }

    if (room.type === 'support') {
      if (doc.senderType === 'customer') {
        patch.unreadByStaff = (room.unreadByStaff ?? 0) + 1
        if (room.status === 'closed') {
          patch.status = 'open'
          patch.closedAt = null
        }
      } else if (doc.senderType === 'staff') {
        patch.unreadByCustomer = (room.unreadByCustomer ?? 0) + 1
      }
    }

    await req.payload.update({
      collection: 'chat-rooms' as any,
      id: roomId,
      data: patch,
      req,
      context: { skipSupportHooks: true },
    })
  } catch (err) {
    req.payload.logger?.error?.({ err, msg: '[messageAfterChange] failed to update room' })
  }

  return doc
}
