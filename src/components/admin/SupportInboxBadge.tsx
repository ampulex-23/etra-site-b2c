'use client'

import React, { useEffect, useState } from 'react'

const POLL_INTERVAL = 30_000

const SupportInboxBadge: React.FC = () => {
  const [count, setCount] = useState(0)
  const [rooms, setRooms] = useState(0)

  useEffect(() => {
    let cancelled = false
    const tick = async () => {
      try {
        const res = await fetch('/api/support/rooms?status=open&unread=1&limit=1', {
          credentials: 'include',
        })
        if (!res.ok) return
        const data = await res.json()
        if (!cancelled) {
          setCount(Number(data?.totalUnread || 0))
          setRooms(Number(data?.totalUnreadRooms || 0))
        }
      } catch { /* noop */ }
    }
    tick()
    const id = setInterval(tick, POLL_INTERVAL)
    return () => { cancelled = true; clearInterval(id) }
  }, [])

  if (count === 0) return null

  const href = '/admin/collections/chat-rooms?where[type][equals]=support&where[status][equals]=open&sort=-lastMessageAt'

  return (
    <a
      href={href}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '8px 10px',
        margin: '6px 10px',
        background: 'linear-gradient(135deg, #fef08a, #fde047)',
        color: '#78350f',
        borderRadius: 8,
        textDecoration: 'none',
        fontSize: 13,
        fontWeight: 500,
        border: '1px solid rgba(120, 53, 15, 0.2)',
      }}
      title={`${rooms} ${rooms === 1 ? 'обращение' : 'обращений'} с непрочитанными`}
    >
      <span style={{ fontSize: 16 }}>💬</span>
      <span>Поддержка</span>
      <span style={{
        marginLeft: 'auto',
        background: '#ef4444',
        color: '#fff',
        borderRadius: 10,
        minWidth: 20,
        height: 20,
        padding: '0 6px',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 11,
        fontWeight: 700,
      }}>
        {count > 99 ? '99+' : count}
      </span>
    </a>
  )
}

export default SupportInboxBadge
