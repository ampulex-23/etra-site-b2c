'use client'

import React, { useEffect, useRef, useCallback } from 'react'

const W = 320
const H = 160

export function GlassBottle() {
  const wrapRef = useRef<HTMLDivElement>(null)
  const posRef = useRef({ x: 0, y: 0 })
  const dragRef = useRef({ dragging: false, offsetX: 0, offsetY: 0 })

  useEffect(() => {
    const startX = Math.round(window.innerWidth / 2 - W / 2)
    const startY = Math.round(window.innerHeight / 2 - H / 2)
    posRef.current = { x: startX, y: startY }
    if (wrapRef.current) {
      wrapRef.current.style.left = startX + 'px'
      wrapRef.current.style.top = startY + 'px'
    }
  }, [])

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault()
    wrapRef.current?.setPointerCapture(e.pointerId)
    dragRef.current = {
      dragging: true,
      offsetX: e.clientX - posRef.current.x,
      offsetY: e.clientY - posRef.current.y,
    }
  }, [])

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragRef.current.dragging) return
    const nx = e.clientX - dragRef.current.offsetX
    const ny = e.clientY - dragRef.current.offsetY
    posRef.current = { x: nx, y: ny }
    if (wrapRef.current) {
      wrapRef.current.style.left = nx + 'px'
      wrapRef.current.style.top = ny + 'px'
    }
  }, [])

  const onPointerUp = useCallback((e: React.PointerEvent) => {
    dragRef.current.dragging = false
    wrapRef.current?.releasePointerCapture(e.pointerId)
  }, [])

  return (
    <div
      ref={wrapRef}
      className="glass-pill"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      {/* Back wall — concave displacement (light bends outward) */}
      <div className="glass-pill__back" />

      {/* Front wall — convex displacement (light bends inward) */}
      <div className="glass-pill__front" />
    </div>
  )
}
