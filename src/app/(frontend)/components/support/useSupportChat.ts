'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useAuth } from '../../auth/AuthProvider'

const WS_URL = process.env.NEXT_PUBLIC_CHAT_WS_URL || 'ws://localhost:3001'
const POLL_INTERVAL = 10_000
const RECONNECT_DELAY = 3_000

export interface SupportMessage {
  id: string
  senderType: 'customer' | 'staff' | 'system'
  senderId?: string
  senderName?: string
  text: string
  createdAt: string
  readAt?: string | null
}

export interface SupportRoom {
  id: string
  title: string
  status?: 'open' | 'closed'
  unreadByCustomer?: number
  unreadByStaff?: number
  lastMessageAt?: string
}

type Status = 'idle' | 'loading' | 'connected' | 'disconnected' | 'error'

interface Options {
  /** When true, the hook loads data and connects; otherwise stays idle. */
  active: boolean
}

export function useSupportChat({ active }: Options) {
  const { customer, token } = useAuth()
  const [room, setRoom] = useState<SupportRoom | null>(null)
  const [messages, setMessages] = useState<SupportMessage[]>([])
  const [unread, setUnread] = useState(0)
  const [status, setStatus] = useState<Status>('idle')
  const [typing, setTyping] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)

  const wsRef = useRef<WebSocket | null>(null)
  const reconnectRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const lastTypingSentRef = useRef(0)
  const typingClearRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const hasAuth = Boolean(customer && token)

  const clearReconnect = () => {
    if (reconnectRef.current) {
      clearTimeout(reconnectRef.current)
      reconnectRef.current = null
    }
  }

  const stopPolling = () => {
    if (pollRef.current) {
      clearInterval(pollRef.current)
      pollRef.current = null
    }
  }

  const fetchRoom = useCallback(async (): Promise<{ room: SupportRoom | null; messages: SupportMessage[] } | null> => {
    if (!token) return null
    try {
      const res = await fetch('/api/support/room', {
        headers: { Authorization: `JWT ${token}` },
      })
      if (!res.ok) return null
      return (await res.json()) as any
    } catch {
      return null
    }
  }, [token])

  const applyRoom = useCallback((data: { room: SupportRoom | null; messages: SupportMessage[] } | null) => {
    if (!data) return
    setRoom(data.room)
    setMessages(data.messages || [])
    setUnread(Number(data.room?.unreadByCustomer || 0))
  }, [])

  const startPolling = useCallback(() => {
    if (pollRef.current || !hasAuth) return
    pollRef.current = setInterval(async () => {
      const data = await fetchRoom()
      applyRoom(data)
    }, POLL_INTERVAL)
  }, [fetchRoom, applyRoom, hasAuth])

  const connectWs = useCallback(
    (roomId: string) => {
      if (!token || !roomId) return
      if (wsRef.current && wsRef.current.readyState <= WebSocket.OPEN) return

      setStatus('loading')
      setError(null)
      try {
        const ws = new WebSocket(WS_URL)
        wsRef.current = ws

        ws.onopen = () => {
          ws.send(JSON.stringify({ type: 'join', token, chatRoomId: roomId }))
          stopPolling()
        }

        ws.onmessage = (ev) => {
          let msg: any
          try { msg = JSON.parse(ev.data) } catch { return }
          switch (msg.type) {
            case 'history':
              setMessages(msg.messages || [])
              setStatus('connected')
              break
            case 'message': {
              const incoming: SupportMessage = {
                id: msg.id,
                senderType: msg.senderType,
                senderId: msg.senderId,
                senderName: msg.senderName,
                text: msg.text,
                createdAt: msg.createdAt,
              }
              setMessages((prev) => (prev.some((m) => m.id === incoming.id) ? prev : [...prev, incoming]))
              if (incoming.senderType === 'staff') setUnread((u) => u + 1)
              break
            }
            case 'typing':
              if (msg.customerName) {
                setTyping((prev) => (prev.includes(msg.customerName) ? prev : [...prev, msg.customerName]))
                if (typingClearRef.current) clearTimeout(typingClearRef.current)
                typingClearRef.current = setTimeout(() => setTyping([]), 3000)
              }
              break
            case 'read':
              if (msg.by === 'staff') {
                const readAt = msg.readAt
                setMessages((prev) => prev.map((m) => (m.senderType === 'customer' && !m.readAt ? { ...m, readAt } : m)))
              }
              break
            case 'error':
              setError(msg.error || 'Ошибка WS')
              setStatus('error')
              break
            case 'pong':
            case 'joined':
            case 'left':
              break
          }
        }

        ws.onclose = () => {
          setStatus('disconnected')
          if (wsRef.current === ws) wsRef.current = null
          clearReconnect()
          reconnectRef.current = setTimeout(() => connectWs(roomId), RECONNECT_DELAY)
          startPolling()
        }

        ws.onerror = () => {
          setError('Ошибка подключения к чату')
          setStatus('error')
        }
      } catch {
        setStatus('error')
        setError('Не удалось подключиться')
        startPolling()
      }
    },
    [token, startPolling],
  )

  // Initial load + WS connect
  useEffect(() => {
    if (!active || !hasAuth) return
    let cancelled = false
    setStatus('loading')
    ;(async () => {
      const data = await fetchRoom()
      if (cancelled) return
      applyRoom(data)
      if (data?.room?.id) {
        connectWs(String(data.room.id))
      } else {
        setStatus('disconnected')
        startPolling()
      }
    })()
    return () => {
      cancelled = true
    }
  }, [active, hasAuth, fetchRoom, applyRoom, connectWs, startPolling])

  // Cleanup on unmount / deactivate
  useEffect(() => {
    return () => {
      clearReconnect()
      stopPolling()
      if (wsRef.current) {
        try { wsRef.current.close() } catch { /* noop */ }
        wsRef.current = null
      }
    }
  }, [])

  // Keepalive ping
  useEffect(() => {
    if (!active) return
    const id = setInterval(() => {
      const ws = wsRef.current
      if (ws?.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ type: 'ping' }))
    }, 25_000)
    return () => clearInterval(id)
  }, [active])

  const send = useCallback(
    async (text: string) => {
      const trimmed = text.trim()
      if (!trimmed || !hasAuth) return
      const ws = wsRef.current
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'message', text: trimmed }))
        return
      }
      // REST fallback (also handles first-message lazy room creation)
      try {
        const res = await fetch('/api/support/messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `JWT ${token}` },
          body: JSON.stringify({ text: trimmed }),
        })
        if (!res.ok) {
          const err = await res.json().catch(() => ({}))
          throw new Error(err?.error || 'Ошибка отправки')
        }
        const data = await res.json()
        if (data?.room) {
          const prev = room
          setRoom(data.room)
          setMessages((cur) => (cur.some((m) => m.id === data.message?.id) ? cur : [...cur, data.message]))
          if (!prev?.id && data.room.id) connectWs(String(data.room.id))
        }
      } catch (e: any) {
        setError(e?.message || 'Ошибка отправки')
      }
    },
    [hasAuth, token, room, connectWs],
  )

  const setTypingSignal = useCallback(() => {
    const now = Date.now()
    if (now - lastTypingSentRef.current < 2000) return
    lastTypingSentRef.current = now
    const ws = wsRef.current
    if (ws?.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'typing' }))
    }
  }, [])

  const markRead = useCallback(async () => {
    if (!hasAuth || !room?.id) return
    const lastMsg = messages[messages.length - 1]
    try {
      const res = await fetch('/api/support/read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `JWT ${token}` },
        body: JSON.stringify({ chatRoom: room.id, upTo: lastMsg?.id }),
      })
      if (res.ok) {
        setUnread(0)
        const ws = wsRef.current
        if (ws?.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'read', upTo: lastMsg?.id }))
        }
      }
    } catch {
      /* silent */
    }
  }, [hasAuth, token, room?.id, messages])

  const refresh = useCallback(async () => {
    const data = await fetchRoom()
    applyRoom(data)
  }, [fetchRoom, applyRoom])

  return {
    hasAuth,
    room,
    messages,
    unread,
    typing,
    status,
    error,
    send,
    setTyping: setTypingSignal,
    markRead,
    refresh,
  }
}
