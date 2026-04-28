'use client'

import React, { useMemo, useState } from 'react'
import { Heart } from 'lucide-react'
import { useAuth } from '@/app/(frontend)/auth/AuthProvider'

interface FavoriteButtonProps {
  productId: string | number
  className?: string
}

export function FavoriteButton({ productId, className = '' }: FavoriteButtonProps) {
  const { customer, token, refreshUser } = useAuth()
  const [pending, setPending] = useState(false)
  const [optimistic, setOptimistic] = useState<boolean | null>(null)

  const currentlyFavorite = useMemo(() => {
    if (optimistic !== null) return optimistic
    if (!customer?.favorites?.length) return false
    const target = String(productId)
    return customer.favorites.some((f) => {
      if (!f) return false
      if (typeof f === 'string' || typeof f === 'number') return String(f) === target
      return String((f as { id?: string | number }).id) === target
    })
  }, [customer?.favorites, productId, optimistic])

  const handleClick = async () => {
    if (!token) {
      // Not authenticated — direct to login
      if (typeof window !== 'undefined') {
        const next = encodeURIComponent(window.location.pathname + window.location.search)
        window.location.href = `/login?next=${next}`
      }
      return
    }
    if (pending) return
    setPending(true)
    const nextValue = !currentlyFavorite
    setOptimistic(nextValue)
    try {
      const res = await fetch('/api/customers/me/favorites', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `JWT ${token}`,
        },
        body: JSON.stringify({ productId, action: 'toggle' }),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      setOptimistic(Boolean(data.isFavorite))
      // refresh customer in context so other parts of UI (account page) stay in sync
      await refreshUser()
      // server is source of truth — drop optimistic so memo re-derives from customer
      setOptimistic(null)
    } catch (e) {
      console.error('[FavoriteButton] toggle failed', e)
      setOptimistic(null)
    } finally {
      setPending(false)
    }
  }

  return (
    <button
      type="button"
      className={`favorite-btn ${currentlyFavorite ? 'favorite-btn--active' : ''} ${className}`}
      onClick={handleClick}
      disabled={pending}
      aria-pressed={currentlyFavorite}
      aria-label={currentlyFavorite ? 'Удалить из избранного' : 'Добавить в избранное'}
      title={currentlyFavorite ? 'В избранном' : 'В избранное'}
    >
      <Heart
        size={20}
        fill={currentlyFavorite ? 'currentColor' : 'none'}
        strokeWidth={currentlyFavorite ? 0 : 2}
      />
    </button>
  )
}
