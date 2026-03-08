'use client'

import React, { useEffect, useRef, useState, useCallback } from 'react'

const BOTTLE_WIDTH = 140
const BOTTLE_HEIGHT = 420

function generateDisplacementMap(width: number, height: number): string {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')!
  const imageData = ctx.createImageData(width, height)
  const data = imageData.data
  const cx = width / 2

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4
      const dx = (x - cx) / cx
      const edgeFactor = Math.pow(Math.abs(dx), 2.0)
      const bezel = Math.min(edgeFactor * 2.2, 1.0)
      const refractX = dx * 0.5 * bezel
      const refractY = ((y / height) - 0.5) * 0.15 * bezel
      data[idx] = Math.round(128 + refractX * 127)
      data[idx + 1] = Math.round(128 + refractY * 127)
      data[idx + 2] = 128
      data[idx + 3] = 255
    }
  }

  ctx.putImageData(imageData, 0, 0)
  return canvas.toDataURL()
}

export function GlassBottle() {
  const filterId = 'bottle-refraction'
  const [mapUrl, setMapUrl] = useState('')
  const [pos, setPos] = useState({ x: 0, y: 0 })
  const [lightAngle, setLightAngle] = useState(0.3)
  const dragRef = useRef<{ dragging: boolean; offsetX: number; offsetY: number }>({
    dragging: false, offsetX: 0, offsetY: 0,
  })
  const bottleRef = useRef<HTMLDivElement>(null)
  const initialized = useRef(false)

  useEffect(() => {
    setMapUrl(generateDisplacementMap(BOTTLE_WIDTH, BOTTLE_HEIGHT))
    if (!initialized.current) {
      const startX = Math.round(window.innerWidth / 2 + 120 - BOTTLE_WIDTH / 2)
      const startY = Math.round(window.innerHeight / 2 - BOTTLE_HEIGHT / 2)
      setPos({ x: startX, y: startY })
      initialized.current = true
    }
  }, [])

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault()
    const el = bottleRef.current
    if (!el) return
    el.setPointerCapture(e.pointerId)
    dragRef.current = {
      dragging: true,
      offsetX: e.clientX - pos.x,
      offsetY: e.clientY - pos.y,
    }
  }, [pos])

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragRef.current.dragging) return
    const nx = e.clientX - dragRef.current.offsetX
    const ny = e.clientY - dragRef.current.offsetY
    setPos({ x: nx, y: ny })

    const bottleCx = nx + BOTTLE_WIDTH / 2
    const bottleCy = ny + BOTTLE_HEIGHT / 2
    const relX = (e.clientX - bottleCx) / (window.innerWidth / 2)
    setLightAngle(Math.max(-1, Math.min(1, relX)))
  }, [])

  const onPointerUp = useCallback((e: React.PointerEvent) => {
    dragRef.current.dragging = false
    const el = bottleRef.current
    if (el) el.releasePointerCapture(e.pointerId)
  }, [])

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (dragRef.current.dragging) return
      const bottleCx = pos.x + BOTTLE_WIDTH / 2
      const relX = (e.clientX - bottleCx) / (window.innerWidth / 2)
      setLightAngle(Math.max(-1, Math.min(1, relX)))
    }
    window.addEventListener('mousemove', onMouseMove, { passive: true })
    return () => window.removeEventListener('mousemove', onMouseMove)
  }, [pos])

  const lightX = 20 + lightAngle * 35
  const specOpacity1 = 0.35 + (1 - Math.abs(lightAngle)) * 0.3
  const specOpacity2 = 0.15 + Math.max(0, lightAngle) * 0.25
  const specOpacity3 = 0.15 + Math.max(0, -lightAngle) * 0.25

  return (
    <>
      <svg width="0" height="0" style={{ position: 'absolute' }}>
        <defs>
          <clipPath id="bottle-clip" clipPathUnits="objectBoundingBox">
            <rect x="0.38" y="0" width="0.24" height="0.04" rx="0.02" />
            <rect x="0.34" y="0.035" width="0.32" height="0.025" rx="0.01" />
            <rect x="0.37" y="0.055" width="0.26" height="0.06" rx="0.02" />
            <rect x="0.36" y="0.11" width="0.28" height="0.04" rx="0.02" />
            <ellipse cx="0.5" cy="0.18" rx="0.2" ry="0.04" />
            <rect x="0.28" y="0.17" width="0.44" height="0.04" rx="0.03" />
            <rect x="0.2" y="0.2" width="0.6" height="0.06" rx="0.04" />
            <rect x="0.15" y="0.25" width="0.7" height="0.6" rx="0.06" />
            <rect x="0.18" y="0.83" width="0.64" height="0.06" rx="0.04" />
            <rect x="0.2" y="0.88" width="0.6" height="0.08" rx="0.04" />
            <rect x="0.22" y="0.95" width="0.56" height="0.05" rx="0.03" />
          </clipPath>

          {mapUrl && (
            <filter id={filterId} colorInterpolationFilters="sRGB"
              x="0" y="0" width="100%" height="100%">
              <feImage href={mapUrl} x="0" y="0"
                width={BOTTLE_WIDTH} height={BOTTLE_HEIGHT} result="dispMap" />
              <feDisplacementMap
                in="SourceGraphic" in2="dispMap"
                scale="22" xChannelSelector="R" yChannelSelector="G"
              />
            </filter>
          )}
        </defs>
      </svg>

      <div
        ref={bottleRef}
        className="glass-bottle"
        style={{
          left: pos.x,
          top: pos.y,
          transform: 'none',
          cursor: dragRef.current.dragging ? 'grabbing' : 'grab',
          pointerEvents: 'auto',
        }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        {/* Layer 1: Refraction via SVG displacement */}
        <div className="glass-bottle__refract" style={{
          clipPath: 'url(#bottle-clip)',
          backdropFilter: mapUrl ? `url(#${filterId})` : 'blur(10px)',
          WebkitBackdropFilter: mapUrl ? `url(#${filterId})` : 'blur(10px)',
        }} />

        {/* Layer 2: Glass blur + tint */}
        <div className="glass-bottle__blur" style={{ clipPath: 'url(#bottle-clip)' }} />

        {/* Layer 3: Dynamic specular — main vertical highlight */}
        <div className="glass-bottle__specular" style={{
          clipPath: 'url(#bottle-clip)',
          background: `
            linear-gradient(
              180deg,
              rgba(200,230,255,${(specOpacity1 * 0.6).toFixed(2)}) 0%,
              rgba(255,255,255,${(specOpacity1 * 0.15).toFixed(2)}) 15%,
              rgba(255,255,255,${(specOpacity1 * 0.08).toFixed(2)}) 40%,
              rgba(200,230,255,${(specOpacity1 * 0.04).toFixed(2)}) 70%,
              rgba(255,255,255,${(specOpacity1 * 0.12).toFixed(2)}) 100%
            )
          `,
        }} />

        {/* Layer 4: Left edge caustic */}
        <div style={{
          position: 'absolute', inset: 0,
          clipPath: 'url(#bottle-clip)',
          background: `linear-gradient(
            90deg,
            rgba(180,220,255,${specOpacity3.toFixed(2)}) 0%,
            rgba(255,255,255,${(specOpacity3 * 0.5).toFixed(2)}) 8%,
            transparent 22%
          )`,
          mixBlendMode: 'screen',
          pointerEvents: 'none',
        }} />

        {/* Layer 5: Right edge caustic */}
        <div style={{
          position: 'absolute', inset: 0,
          clipPath: 'url(#bottle-clip)',
          background: `linear-gradient(
            270deg,
            rgba(180,220,255,${specOpacity2.toFixed(2)}) 0%,
            rgba(255,255,255,${(specOpacity2 * 0.4).toFixed(2)}) 8%,
            transparent 22%
          )`,
          mixBlendMode: 'screen',
          pointerEvents: 'none',
        }} />

        {/* Layer 6: Dynamic spotlight that follows mouse */}
        <div style={{
          position: 'absolute', inset: 0,
          clipPath: 'url(#bottle-clip)',
          background: `radial-gradient(
            ellipse 40% 25% at ${lightX}% 18%,
            rgba(255,255,255,0.45) 0%,
            rgba(200,230,255,0.15) 40%,
            transparent 100%
          )`,
          mixBlendMode: 'screen',
          pointerEvents: 'none',
          transition: 'background 0.15s ease',
        }} />

        {/* Layer 7: Bottom reflection */}
        <div style={{
          position: 'absolute', inset: 0,
          clipPath: 'url(#bottle-clip)',
          background: `linear-gradient(
            180deg,
            transparent 75%,
            rgba(56,189,248,0.06) 88%,
            rgba(130,200,255,0.12) 95%,
            rgba(200,230,255,0.08) 100%
          )`,
          pointerEvents: 'none',
        }} />

        {/* Layer 8: Edge outline glow */}
        <div className="glass-bottle__edge" style={{ clipPath: 'url(#bottle-clip)' }} />
      </div>
    </>
  )
}
