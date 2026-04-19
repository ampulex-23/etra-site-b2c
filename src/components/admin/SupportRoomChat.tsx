'use client'

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useDocumentInfo, useAuth } from '@payloadcms/ui'

interface Msg {
  id: string
  senderType: 'customer' | 'staff' | 'system'
  senderId?: string
  senderName?: string
  text: string
  createdAt: string
  readAt?: string | null
}

const WS_URL = process.env.NEXT_PUBLIC_CHAT_WS_URL || ''
const RECONNECT_DELAY = 3_000
const POLL_INTERVAL = 5_000
const MAX_WS_ATTEMPTS = 3
// Optional WebSocket (progressive enhancement). If no endpoint is configured
// or the server is unreachable, we fall back to polling silently.
const WS_ENABLED = Boolean(WS_URL) && /^wss?:\/\//i.test(WS_URL)

const SupportRoomChat: React.FC = () => {
  const doc = useDocumentInfo()
  const roomId = doc?.id ? String(doc.id) : null
  const { user } = useAuth() as any

  const [messages, setMessages] = useState<Msg[]>([])
  const [text, setText] = useState('')
  const [status, setStatus] = useState<'idle' | 'connecting' | 'connected' | 'polling' | 'error'>('idle')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [roomStatus, setRoomStatus] = useState<'open' | 'closed' | null>(null)
  const [assigneeId, setAssigneeId] = useState<string | null>(null)

  const wsRef = useRef<WebSocket | null>(null)
  const endRef = useRef<HTMLDivElement>(null)
  const reconnectRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const wsAttemptsRef = useRef(0)
  const wsGiveUpRef = useRef(false)

  const scrollToEnd = useCallback(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => { scrollToEnd() }, [messages, scrollToEnd])

  const fetchRoom = useCallback(async () => {
    if (!roomId) return
    try {
      const res = await fetch(`/api/chat-rooms/${roomId}?depth=0`, { credentials: 'include' })
      if (res.ok) {
        const r = await res.json()
        setRoomStatus(r?.status || null)
        setAssigneeId(r?.assignee ? (typeof r.assignee === 'object' ? r.assignee.id : r.assignee) : null)
      }
    } catch { /* noop */ }
  }, [roomId])

  const fetchMessages = useCallback(async () => {
    if (!roomId) return
    try {
      const res = await fetch(
        `/api/messages?where[chatRoom][equals]=${roomId}&where[isDeleted][not_equals]=true&sort=-createdAt&limit=100&depth=1`,
        { credentials: 'include' },
      )
      if (!res.ok) return
      const data = await res.json()
      const docs: any[] = data?.docs || []
      setMessages(docs.reverse().map((m: any) => ({
        id: String(m.id),
        senderType: m.senderType,
        senderId: m.senderUser?.id || m.senderCustomer?.id,
        senderName: m.senderUser?.name || m.senderCustomer?.name || '',
        text: m.text,
        createdAt: m.createdAt,
        readAt: m.readAt,
      })))
    } catch { /* noop */ }
  }, [roomId])

  const markRead = useCallback(async () => {
    if (!roomId) return
    try {
      await fetch('/api/support/read', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chatRoom: roomId }),
      })
    } catch { /* noop */ }
  }, [roomId])

  const startPolling = useCallback(() => {
    if (pollRef.current) return
    setStatus('polling')
    pollRef.current = setInterval(() => { fetchMessages(); fetchRoom() }, POLL_INTERVAL)
  }, [fetchMessages, fetchRoom])
  const stopPolling = useCallback(() => {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null }
  }, [])

  const connectWs = useCallback(async () => {
    if (!roomId) return
    if (!WS_ENABLED || wsGiveUpRef.current) {
      // No WS endpoint configured — polling-only mode.
      startPolling()
      return
    }
    if (wsAttemptsRef.current === 0) setStatus('connecting')
    wsAttemptsRef.current += 1
    try {
      const r = await fetch('/api/support/ws-ticket', {
        method: 'POST',
        credentials: 'include',
      })
      if (!r.ok) throw new Error('ws-ticket unavailable')
      const { token } = await r.json()
      const ws = new WebSocket(WS_URL)
      wsRef.current = ws
      ws.onopen = () => {
        wsAttemptsRef.current = 0
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
            const inc: Msg = {
              id: msg.id,
              senderType: msg.senderType,
              senderId: msg.senderId,
              senderName: msg.senderName,
              text: msg.text,
              createdAt: msg.createdAt,
            }
            setMessages((prev) => (prev.some((m) => m.id === inc.id) ? prev : [...prev, inc]))
            break
          }
          case 'error':
            // App-level WS error — show, but keep polling as backup.
            setError(msg.error || 'WS ошибка')
            break
        }
      }
      ws.onclose = () => {
        if (wsRef.current === ws) wsRef.current = null
        if (reconnectRef.current) clearTimeout(reconnectRef.current)
        startPolling()
        if (wsAttemptsRef.current >= MAX_WS_ATTEMPTS) {
          wsGiveUpRef.current = true
          return
        }
        reconnectRef.current = setTimeout(() => connectWs(), RECONNECT_DELAY)
      }
      // Silent — onclose handles fallback; avoid flashing "Ошибка" banner.
      ws.onerror = () => { /* noop */ }
    } catch {
      wsGiveUpRef.current = true
      startPolling()
    }
  }, [roomId, startPolling, stopPolling])

  // Initial load + connect
  useEffect(() => {
    if (!roomId) return
    fetchMessages()
    fetchRoom()
    connectWs()
    return () => {
      if (wsRef.current) { try { wsRef.current.close() } catch { /* noop */ } }
      wsRef.current = null
      if (reconnectRef.current) clearTimeout(reconnectRef.current)
      stopPolling()
    }
  }, [roomId, fetchMessages, fetchRoom, connectWs, stopPolling])

  // Mark as read on mount & on new messages
  useEffect(() => {
    if (roomId && messages.length > 0) {
      markRead()
    }
  }, [roomId, messages.length, markRead])

  // Keepalive ping
  useEffect(() => {
    const id = setInterval(() => {
      const ws = wsRef.current
      if (ws?.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ type: 'ping' }))
    }, 25_000)
    return () => clearInterval(id)
  }, [])

  const send = useCallback(async () => {
    const trimmed = text.trim()
    if (!trimmed || !roomId) return
    setText('')
    const ws = wsRef.current
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'message', text: trimmed }))
      return
    }
    // REST fallback
    try {
      setBusy(true)
      const res = await fetch('/api/support/messages/staff', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chatRoom: roomId, text: trimmed }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err?.error || 'Ошибка отправки')
      }
      await fetchMessages()
    } catch (e: any) {
      setError(e?.message || 'Ошибка отправки')
    } finally {
      setBusy(false)
    }
  }, [text, roomId, fetchMessages])

  const patchRoom = useCallback(async (data: any) => {
    if (!roomId) return
    setBusy(true)
    try {
      const res = await fetch(`/api/chat-rooms/${roomId}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err?.message || err?.error || 'Ошибка обновления')
      }
      await fetchRoom()
    } catch (e: any) {
      setError(e?.message || 'Ошибка обновления')
    } finally {
      setBusy(false)
    }
  }, [roomId, fetchRoom])

  const formatTime = (d: string) => {
    try {
      return new Date(d).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
    } catch { return '' }
  }

  const statusLabel = useMemo(() => {
    if (status === 'connected') return '🟢 На связи'
    if (status === 'polling') return '🟡 Автообновление'
    if (status === 'connecting') return '🔄 Подключение'
    if (status === 'error') return '🔴 Ошибка'
    return '⚪ Готово'
  }, [status])

  const myId = user?.id ? String(user.id) : null
  const assignedToMe = myId && assigneeId && myId === assigneeId

  if (!roomId) {
    return (
      <div style={{ padding: 12, color: '#999' }}>
        Сохраните комнату, чтобы открыть чат.
      </div>
    )
  }

  return (
    <div style={{
      border: '1px solid var(--theme-elevation-100, #e5e5e5)',
      borderRadius: 8,
      overflow: 'hidden',
      marginBottom: 16,
      background: 'var(--theme-bg, #fff)',
    }}>
      {/* Header */}
      <div style={{
        padding: '10px 12px',
        background: 'var(--theme-elevation-50, #f8f8f8)',
        borderBottom: '1px solid var(--theme-elevation-100, #e5e5e5)',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        flexWrap: 'wrap',
      }}>
        <strong style={{ fontSize: 14 }}>💬 Чат обращения</strong>
        <span style={{ fontSize: 12, color: '#666' }}>{statusLabel}</span>
        <span style={{ flex: 1 }} />
        <button
          type="button"
          disabled={busy || Boolean(assignedToMe)}
          onClick={() => patchRoom({ assignee: myId })}
          style={btnStyle('#e5f3cf')}
        >
          {assignedToMe ? '👤 Вы ведёте' : '👤 Назначить на меня'}
        </button>
        {roomStatus === 'closed' ? (
          <button type="button" disabled={busy} onClick={() => patchRoom({ status: 'open' })} style={btnStyle('#dcfce7')}>
            🔓 Открыть снова
          </button>
        ) : (
          <button type="button" disabled={busy} onClick={() => patchRoom({ status: 'closed' })} style={btnStyle('#fee2e2')}>
            ✅ Закрыть обращение
          </button>
        )}
      </div>

      {error && (
        <div style={{ padding: 8, background: '#fef2f2', color: '#991b1b', fontSize: 12 }}>
          {error}
        </div>
      )}

      {/* Messages */}
      <div style={{
        padding: 12,
        maxHeight: 420,
        minHeight: 240,
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}>
        {messages.length === 0 && (
          <div style={{ color: '#999', textAlign: 'center', padding: 24 }}>Пока нет сообщений</div>
        )}
        {messages.map((m) => {
          const own = m.senderType === 'staff'
          return (
            <div
              key={m.id}
              style={{
                alignSelf: own ? 'flex-end' : 'flex-start',
                maxWidth: '80%',
                background: own ? '#dcfce7' : '#f3f4f6',
                color: '#111',
                padding: '8px 12px',
                borderRadius: 12,
                fontSize: 14,
                whiteSpace: 'pre-wrap',
              }}
            >
              {!own && m.senderName && (
                <div style={{ fontSize: 11, color: '#555', marginBottom: 2 }}>{m.senderName}</div>
              )}
              <div>{m.text}</div>
              <div style={{ fontSize: 10, color: '#666', marginTop: 4, textAlign: 'right' }}>
                {formatTime(m.createdAt)}
                {own && m.readAt && <span style={{ marginLeft: 4 }}>✓✓</span>}
              </div>
            </div>
          )
        })}
        <div ref={endRef} />
      </div>

      {/* Input */}
      <div style={{
        display: 'flex',
        gap: 8,
        padding: 10,
        borderTop: '1px solid var(--theme-elevation-100, #e5e5e5)',
        background: 'var(--theme-elevation-50, #fafafa)',
      }}>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              send()
            }
          }}
          rows={2}
          placeholder="Ответить клиенту..."
          style={{
            flex: 1,
            resize: 'vertical',
            padding: 8,
            border: '1px solid var(--theme-elevation-100, #d4d4d4)',
            borderRadius: 6,
            fontSize: 14,
            fontFamily: 'inherit',
          }}
        />
        <button
          type="button"
          disabled={!text.trim() || busy}
          onClick={send}
          style={{
            padding: '8px 16px',
            background: 'var(--theme-success-500, #65a30d)',
            color: '#fff',
            border: 'none',
            borderRadius: 6,
            cursor: 'pointer',
            fontWeight: 600,
          }}
        >
          Отправить
        </button>
      </div>
    </div>
  )
}

function btnStyle(bg: string): React.CSSProperties {
  return {
    padding: '6px 10px',
    background: bg,
    border: '1px solid rgba(0,0,0,0.1)',
    borderRadius: 6,
    fontSize: 12,
    cursor: 'pointer',
  }
}

export default SupportRoomChat
