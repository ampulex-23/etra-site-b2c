'use client'

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react'

export interface CartItem {
  productId: string
  title: string
  slug: string
  price: number
  imageUrl: string | null
  quantity: number
  variantName?: string
}

interface CartContextValue {
  items: CartItem[]
  addItem: (item: CartItem) => void
  removeItem: (productId: string, variantName?: string) => void
  updateQuantity: (productId: string, quantity: number, variantName?: string) => void
  clearCart: () => void
  totalItems: number
  totalPrice: number
}

const CartContext = createContext<CartContextValue | null>(null)

const STORAGE_KEY = 'etra-cart'

function loadCart(): CartItem[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveCart(items: CartItem[]) {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    setItems(loadCart())
    setLoaded(true)
  }, [])

  useEffect(() => {
    if (loaded) saveCart(items)
  }, [items, loaded])

  const addItem = useCallback((item: CartItem) => {
    setItems((prev) => {
      const idx = prev.findIndex(
        (i) => i.productId === item.productId && i.variantName === item.variantName,
      )
      if (idx >= 0) {
        const next = [...prev]
        next[idx] = { ...next[idx], quantity: next[idx].quantity + item.quantity }
        return next
      }
      return [...prev, item]
    })
  }, [])

  const removeItem = useCallback((productId: string, variantName?: string) => {
    setItems((prev) =>
      prev.filter((i) => !(i.productId === productId && i.variantName === variantName)),
    )
  }, [])

  const updateQuantity = useCallback(
    (productId: string, quantity: number, variantName?: string) => {
      if (quantity < 1) {
        removeItem(productId, variantName)
        return
      }
      setItems((prev) =>
        prev.map((i) =>
          i.productId === productId && i.variantName === variantName
            ? { ...i, quantity }
            : i,
        ),
      )
    },
    [removeItem],
  )

  const clearCart = useCallback(() => setItems([]), [])

  const totalItems = items.reduce((s, i) => s + i.quantity, 0)
  const totalPrice = items.reduce((s, i) => s + i.price * i.quantity, 0)

  return (
    <CartContext.Provider
      value={{ items, addItem, removeItem, updateQuantity, clearCart, totalItems, totalPrice }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}
