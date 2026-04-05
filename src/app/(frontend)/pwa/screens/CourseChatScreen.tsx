'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '../../auth/AuthProvider'

interface ChatMessage {
  id: string
  senderType: string
  senderId: string
  senderName: string
  text: string
  createdAt: string
}

const WS_URL = process.env.NEXT_PUBLIC_CHAT_WS_URL || 'ws://localhost:3001'

export function CourseChatScreen() {
  const params = useParams()
  const router = useRouter()
  const { customer, token } = useAuth()

  const enrollmentId = params.enrollmentId as string
  const roomId = params.roomId as string

  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputText, setInputText] = useState('')
  const [connected, setConnected] = useState(false)
  const [connecting, setConnecting] = useState(true)
  const [typingUsers, setTypingUsers] = useState<Map<string, string>>(new Map())
  const [onlineCount, setOnlineCount] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const wsRef = useRef<WebSocket | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastTypingSentRef = useRef(0)

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  // Clear typing indicators after 3 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setTypingUsers((prev) => {
        const now = Date.now()
        const next = new Map(prev)
        let changed = false
        // This simple approach just clears all typing every 3s
        if (next.size > 0) {
          next.clear()
          changed = true
        }
        return changed ? next : prev
      })
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  const connect = useCallback(() => {
    if (!token || !roomId) return

    setConnecting(true)
    setError(null)

    try {
      const ws = new WebSocket(WS_URL)
      wsRef.current = ws

      ws.onopen = () => {
        // Join the chat room
        ws.send(JSON.stringify({
          type: 'join',
          token,
          chatRoomId: roomId,
        }))
      }

      ws.onmessage = (event) => {
        const msg = JSON.parse(event.data)

        switch (msg.type) {
          case 'history':
            setMessages(msg.messages || [])
            setConnected(true)
            setConnecting(false)
            break

          case 'message':
            setMessages((prev) => [...prev, {
              id: msg.id,
              senderType: msg.senderType,
              senderId: msg.senderId,
              senderName: msg.senderName,
              text: msg.text,
              createdAt: msg.createdAt,
            }])
            // Clear typing for this user
            setTypingUsers((prev) => {
              const next = new Map(prev)
              next.delete(msg.senderId)
              return next
            })
            break

          case 'typing':
            setTypingUsers((prev) => {
              const next = new Map(prev)
              next.set(msg.customerId, msg.customerName)
              return next
            })
            break

          case 'joined':
            setOnlineCount(msg.onlineCount || 0)
            break

          case 'left':
            setOnlineCount(msg.onlineCount || 0)
            setTypingUsers((prev) => {
              const next = new Map(prev)
              next.delete(msg.customerId)
              return next
            })
            break

          case 'error':
            setError(msg.error)
            setConnecting(false)
            break

          case 'pong':
            break
        }
      }

      ws.onclose = () => {
        setConnected(false)
        // Reconnect after 3 seconds
        reconnectTimeoutRef.current = setTimeout(() => {
          if (wsRef.current === ws) connect()
        }, 3000)
      }

      ws.onerror = () => {
        setError('Ошибка подключения к чату')
        setConnecting(false)
      }
    } catch {
      setError('Не удалось подключиться к чату')
      setConnecting(false)
    }
  }, [token, roomId])

  useEffect(() => {
    connect()

    return () => {
      if (wsRef.current) {
        wsRef.current.close()
        wsRef.current = null
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
    }
  }, [connect])

  // Ping every 25 seconds to keep alive
  useEffect(() => {
    const interval = setInterval(() => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'ping' }))
      }
    }, 25000)
    return () => clearInterval(interval)
  }, [])

  const sendMessage = () => {
    if (!inputText.trim() || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return

    wsRef.current.send(JSON.stringify({
      type: 'message',
      text: inputText.trim(),
    }))
    setInputText('')
  }

  const sendTyping = () => {
    const now = Date.now()
    if (now - lastTypingSentRef.current < 2000) return
    lastTypingSentRef.current = now

    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'typing' }))
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const formatDateSeparator = (dateStr: string) => {
    const date = new Date(dateStr)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (date.toDateString() === today.toDateString()) return 'Сегодня'
    if (date.toDateString() === yesterday.toDateString()) return 'Вчера'
    return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })
  }

  const isOwnMessage = (msg: ChatMessage) =>
    msg.senderType === 'customer' && msg.senderId === customer?.id

  // Group messages by date
  const messagesByDate: { date: string; messages: ChatMessage[] }[] = []
  let currentDate = ''
  for (const msg of messages) {
    const msgDate = msg.createdAt?.split('T')[0] || ''
    if (msgDate !== currentDate) {
      currentDate = msgDate
      messagesByDate.push({ date: msgDate, messages: [msg] })
    } else {
      messagesByDate[messagesByDate.length - 1].messages.push(msg)
    }
  }

  const typingNames = Array.from(typingUsers.values())

  if (!customer) {
    return (
      <div className="pwa-screen animate-in" style={{ textAlign: 'center', padding: 40 }}>
        <p className="t-body t-sec">Войдите для доступа к чату</p>
        <Link href="/auth/login" className="btn btn--primary" style={{ marginTop: 16 }}>Войти</Link>
      </div>
    )
  }

  return (
    <div className="pwa-screen pwa-screen--flush chat-screen">
      {/* Header */}
      <div className="chat-header glass">
        <Link href={`/courses/my/${enrollmentId}`} className="chat-header__back">
          ← Назад
        </Link>
        <div className="chat-header__info">
          <div className="chat-header__title">💬 Чат</div>
          <div className="chat-header__status">
            {connecting ? '🔄 Подключение...' : connected ? `🟢 ${onlineCount} онлайн` : '🔴 Отключен'}
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="chat-error">
          {error}
          <button onClick={connect} className="btn btn--sm btn--secondary" style={{ marginLeft: 8 }}>
            Переподключиться
          </button>
        </div>
      )}

      {/* Messages */}
      <div className="chat-messages">
        {messagesByDate.map((group) => (
          <React.Fragment key={group.date}>
            <div className="chat-date-separator">
              <span>{formatDateSeparator(group.messages[0].createdAt)}</span>
            </div>
            {group.messages.map((msg) => (
              <div
                key={msg.id}
                className={`chat-bubble ${isOwnMessage(msg) ? 'chat-bubble--own' : ''} ${msg.senderType === 'system' ? 'chat-bubble--system' : ''}`}
              >
                {!isOwnMessage(msg) && msg.senderType !== 'system' && (
                  <div className="chat-bubble__sender">{msg.senderName}</div>
                )}
                <div className="chat-bubble__text">{msg.text}</div>
                <div className="chat-bubble__time">{formatTime(msg.createdAt)}</div>
              </div>
            ))}
          </React.Fragment>
        ))}

        {/* Typing indicator */}
        {typingNames.length > 0 && (
          <div className="chat-typing">
            {typingNames.length === 1
              ? `${typingNames[0]} печатает...`
              : `${typingNames.length} участников печатают...`}
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="chat-input-bar">
        <textarea
          className="chat-input"
          placeholder="Написать сообщение..."
          value={inputText}
          onChange={(e) => {
            setInputText(e.target.value)
            sendTyping()
          }}
          onKeyDown={handleKeyDown}
          rows={1}
          disabled={!connected}
        />
        <button
          className="chat-send-btn"
          onClick={sendMessage}
          disabled={!inputText.trim() || !connected}
        >
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="22" y1="2" x2="11" y2="13" />
            <polygon points="22 2 15 22 11 13 2 9 22 2" />
          </svg>
        </button>
      </div>
    </div>
  )
}
