'use client'

import React, { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { useAuth } from '../../auth/AuthProvider'
import { SupportChatView } from './SupportChatView'

function isHiddenOnRoute(pathname: string | null): boolean {
  if (!pathname) return false
  if (pathname.startsWith('/auth')) return true
  if (pathname === '/account/support') return true
  if (/^\/courses\/my\/[^/]+\/chat\//.test(pathname)) return true
  if (pathname.startsWith('/admin')) return true
  return false
}

/**
 * Live unread counter for the FAB badge (lightweight background hook — does
 * not mount the full chat view until the panel is opened).
 */
function useUnreadBadge() {
  const { customer, token } = useAuth()
  const [unread, setUnread] = useState(0)
  useEffect(() => {
    if (!customer || !token) {
      setUnread(0)
      return
    }
    let cancelled = false
    const tick = async () => {
      try {
        const res = await fetch('/api/support/room', {
          headers: { Authorization: `JWT ${token}` },
        })
        if (!res.ok) return
        const data = await res.json()
        if (!cancelled) setUnread(Number(data?.room?.unreadByCustomer || 0))
      } catch { /* noop */ }
    }
    tick()
    const id = setInterval(tick, 30_000)
    return () => {
      cancelled = true
      clearInterval(id)
    }
  }, [customer, token])
  return unread
}

export function SupportFab() {
  const pathname = usePathname()
  const { customer } = useAuth()
  const [open, setOpen] = useState(false)
  const unread = useUnreadBadge()
  const hidden = isHiddenOnRoute(pathname)

  // Lock body scroll while panel is open on mobile (keep hook order stable)
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])

  if (hidden) return null

  return (
    <>
      <button
        className="support-fab"
        onClick={() => setOpen(true)}
        aria-label="Поддержка"
      >
        <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M21 15a4 4 0 0 1-4 4H7l-4 4V5a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z" />
        </svg>
        {customer && unread > 0 && <span className="support-fab__badge">{unread > 9 ? '9+' : unread}</span>}
      </button>

      {open && (
        <>
          <div className="support-panel-backdrop" onClick={() => setOpen(false)} />
          <div className="support-panel">
            <SupportChatView mode="panel" active={open} onClose={() => setOpen(false)} />
          </div>
        </>
      )}
    </>
  )
}
