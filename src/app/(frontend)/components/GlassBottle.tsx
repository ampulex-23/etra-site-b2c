'use client'

import React, { useEffect, useRef, useCallback } from 'react'

const W = 160
const H = 440

export function GlassBottle() {
  const wrapRef = useRef<HTMLDivElement>(null)
  const posRef = useRef({ x: 0, y: 0 })
  const dragRef = useRef({ dragging: false, offsetX: 0, offsetY: 0 })

  useEffect(() => {
    const startX = Math.round(window.innerWidth / 2 + 120 - W / 2)
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
      className="glass-bottle"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      {/* Glass body with refraction */}
      <div className="glass-bottle__glass" />

      {/* Lime-green liquid in bottom half */}
      <div className="glass-bottle__liquid" />
      <div className="glass-bottle__liquid-surface" />

      {/* Specular highlights */}
      <div className="glass-bottle__spec-left" />
      <div className="glass-bottle__spec-right" />
      <div className="glass-bottle__spec-top" />

      {/* Edge rim light */}
      <div className="glass-bottle__rim" />
    </div>
  )
}
