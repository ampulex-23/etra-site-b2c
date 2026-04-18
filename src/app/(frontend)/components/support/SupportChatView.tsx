'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '../../auth/AuthProvider'
import { useSupportChat, type SupportMessage } from './useSupportChat'

interface Props {
  mode: 'panel' | 'page'
  active?: boolean
  onClose?: () => void
}

function formatTime(dateStr: string) {
  try {
    return new Date(dateStr).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
  } catch {
    return ''
  }
}

function formatDateSeparator(dateStr: string) {
  const date = new Date(dateStr)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  if (date.toDateString() === today.toDateString()) return 'Сегодня'
  if (date.toDateString() === yesterday.toDateString()) return 'Вчера'
  return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })
}

export function SupportChatView({ mode, active = true, onClose }: Props) {
  const { customer } = useAuth()
  const pathname = usePathname()
  const chat = useSupportChat({ active })
  const [inputText, setInputText] = useState('')
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chat.messages])

  useEffect(() => {
    if (active && chat.room && chat.unread > 0) {
      chat.markRead()
    }
  }, [active, chat.room?.id, chat.unread, chat.markRead])

  const groups = useMemo(() => {
    const out: { date: string; messages: SupportMessage[] }[] = []
    let currentDate = ''
    for (const m of chat.messages) {
      const d = (m.createdAt || '').split('T')[0]
      if (d !== currentDate) {
        currentDate = d
        out.push({ date: d, messages: [m] })
      } else {
        out[out.length - 1].messages.push(m)
      }
    }
    return out
  }, [chat.messages])

  if (!chat.hasAuth) {
    const loginHref = `/auth/login${pathname ? `?return=${encodeURIComponent(pathname)}` : ''}`
    return (
      <div className={`support-view support-view--${mode}`}>
        {mode === 'panel' && (
          <div className="chat-header glass">
            <div className="chat-header__info">
              <div className="chat-header__title">💬 Поддержка</div>
            </div>
            {onClose && (
              <button className="support-view__close" onClick={onClose} aria-label="Закрыть">×</button>
            )}
          </div>
        )}
        <div className="support-view__empty">
          <p className="t-body t-sec" style={{ textAlign: 'center' }}>
            Войдите, чтобы написать в поддержку
          </p>
          <Link href={loginHref} className="btn btn--primary" style={{ marginTop: 16 }}>
            Войти
          </Link>
        </div>
      </div>
    )
  }

  const sendMessage = async () => {
    const text = inputText.trim()
    if (!text) return
    setInputText('')
    await chat.send(text)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const isOwn = (m: SupportMessage) =>
    m.senderType === 'customer' && (!m.senderId || String(m.senderId) === String(customer?.id))

  const hasHistory = chat.messages.length > 0
  const emptyState = !hasHistory && !chat.room

  return (
    <div className={`support-view support-view--${mode} chat-screen`}>
      <div className="chat-header glass">
        {mode === 'page' && (
          <Link href="/account" className="chat-header__back">← Назад</Link>
        )}
        <div className="chat-header__info">
          <div className="chat-header__title">💬 Поддержка</div>
          <div className="chat-header__status">
            {chat.status === 'loading' && '🔄 Подключение...'}
            {chat.status === 'connected' && '🟢 На связи'}
            {chat.status === 'disconnected' && '🟡 Автообновление'}
            {chat.status === 'error' && '🔴 Ошибка'}
            {chat.status === 'idle' && '⚪ Готово'}
          </div>
        </div>
        {mode === 'panel' && onClose && (
          <button className="support-view__close" onClick={onClose} aria-label="Закрыть">×</button>
        )}
      </div>

      {chat.error && (
        <div className="chat-error">{chat.error}</div>
      )}

      <div className="chat-messages">
        {emptyState && (
          <div className="support-view__welcome">
            <p className="t-body">Напишите нам — обычно отвечаем в течение дня.</p>
          </div>
        )}

        {groups.map((g) => (
          <React.Fragment key={g.date}>
            <div className="chat-date-separator">
              <span>{formatDateSeparator(g.messages[0].createdAt)}</span>
            </div>
            {g.messages.map((m) => (
              <div
                key={m.id}
                className={`chat-bubble ${isOwn(m) ? 'chat-bubble--own' : ''} ${m.senderType === 'system' ? 'chat-bubble--system' : ''}`}
              >
                {!isOwn(m) && m.senderType !== 'system' && m.senderName && (
                  <div className="chat-bubble__sender">{m.senderName}</div>
                )}
                <div className="chat-bubble__text">{m.text}</div>
                <div className="chat-bubble__time">
                  {formatTime(m.createdAt)}
                  {isOwn(m) && m.readAt && <span style={{ marginLeft: 4 }}>✓✓</span>}
                </div>
              </div>
            ))}
          </React.Fragment>
        ))}

        {chat.typing.length > 0 && (
          <div className="chat-typing">
            {chat.typing.length === 1
              ? `${chat.typing[0]} печатает...`
              : `${chat.typing.length} печатают...`}
          </div>
        )}
        <div ref={endRef} />
      </div>

      <div className="chat-input-bar">
        <textarea
          className="chat-input"
          placeholder="Написать сообщение..."
          value={inputText}
          onChange={(e) => {
            setInputText(e.target.value)
            chat.setTyping()
          }}
          onKeyDown={handleKeyDown}
          rows={1}
        />
        <button
          className="chat-send-btn"
          onClick={sendMessage}
          disabled={!inputText.trim()}
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
