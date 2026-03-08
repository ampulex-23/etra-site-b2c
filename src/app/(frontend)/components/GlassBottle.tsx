'use client'

import React, { useEffect, useRef, useCallback } from 'react'

const W = 160
const H = 440
const IOR = 1.45
const EDGE_RADIUS = 0.38

function isInsideBottle(nx: number, ny: number): boolean {
  const ax = Math.abs(nx)

  if (ny < 0.04) return ax < 0.12
  if (ny < 0.065) return ax < 0.16
  if (ny < 0.12) return ax < 0.13
  if (ny < 0.16) return ax < 0.14
  if (ny < 0.22) {
    const t = (ny - 0.16) / 0.06
    const w = 0.14 + t * (EDGE_RADIUS - 0.14)
    return ax < w
  }
  if (ny < 0.88) return ax < EDGE_RADIUS
  if (ny < 0.94) {
    const t = (ny - 0.88) / 0.06
    const w = EDGE_RADIUS - t * 0.06
    return ax < w
  }
  return ax < EDGE_RADIUS - 0.06 && ny < 1.0
}

function getBottleWidth(ny: number): number {
  if (ny < 0.04) return 0.12
  if (ny < 0.065) return 0.16
  if (ny < 0.12) return 0.13
  if (ny < 0.16) return 0.14
  if (ny < 0.22) {
    const t = (ny - 0.16) / 0.06
    return 0.14 + t * (EDGE_RADIUS - 0.14)
  }
  if (ny < 0.88) return EDGE_RADIUS
  if (ny < 0.94) {
    const t = (ny - 0.88) / 0.06
    return EDGE_RADIUS - t * 0.06
  }
  return EDGE_RADIUS - 0.06
}

function refract(
  srcData: Uint8ClampedArray, srcW: number, srcH: number,
  dstData: Uint8ClampedArray, dstW: number, dstH: number,
  offsetX: number, offsetY: number,
  mouseRelX: number,
) {
  const cx = dstW / 2
  const cy = dstH / 2

  for (let j = 0; j < dstH; j++) {
    for (let i = 0; i < dstW; i++) {
      const dstIdx = (j * dstW + i) * 4
      const nx = (i - cx) / cx
      const ny = j / dstH

      if (!isInsideBottle(nx, ny)) {
        dstData[dstIdx + 3] = 0
        continue
      }

      const bw = getBottleWidth(ny)
      const edgeDist = 1.0 - Math.abs(nx) / bw

      const cylinderX = Math.min(edgeDist / 0.35, 1.0)
      const surfaceAngle = Math.acos(Math.min(cylinderX, 1.0))
      const sinIn = Math.sin(surfaceAngle)
      const sinOut = sinIn / IOR
      const angleOut = Math.asin(Math.min(sinOut, 1.0))
      const displacement = Math.tan(surfaceAngle) - Math.tan(angleOut)
      const sign = nx > 0 ? 1 : -1

      const shiftX = sign * displacement * bw * cx * 0.6
      const shiftY = displacement * 3.0 * ((ny - 0.5) * 0.15)

      let sx = Math.round(offsetX + i + shiftX)
      let sy = Math.round(offsetY + j + shiftY)

      sx = Math.max(0, Math.min(srcW - 1, sx))
      sy = Math.max(0, Math.min(srcH - 1, sy))

      const srcIdx = (sy * srcW + sx) * 4
      dstData[dstIdx] = srcData[srcIdx]
      dstData[dstIdx + 1] = srcData[srcIdx + 1]
      dstData[dstIdx + 2] = srcData[srcIdx + 2]
      dstData[dstIdx + 3] = 255

      const fresnel = Math.pow(1.0 - edgeDist, 3) * 0.7
      const specHighlight = Math.pow(Math.max(0, 1.0 - Math.abs(nx - 0.15 + mouseRelX * 0.2) / 0.12), 4) * 0.55
      const topGlare = ny < 0.25 ? Math.pow(1.0 - ny / 0.25, 2) * 0.12 : 0

      const highlight = Math.min(fresnel + specHighlight + topGlare, 0.85)

      dstData[dstIdx] = Math.min(255, dstData[dstIdx] + highlight * 200)
      dstData[dstIdx + 1] = Math.min(255, dstData[dstIdx + 1] + highlight * 220)
      dstData[dstIdx + 2] = Math.min(255, dstData[dstIdx + 2] + highlight * 255)

      const tint = edgeDist * 0.06
      dstData[dstIdx] = Math.min(255, dstData[dstIdx] + tint * 30)
      dstData[dstIdx + 1] = Math.min(255, dstData[dstIdx + 1] + tint * 60)
      dstData[dstIdx + 2] = Math.min(255, dstData[dstIdx + 2] + tint * 80)
    }
  }
}

export function GlassBottle() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const wrapRef = useRef<HTMLDivElement>(null)
  const posRef = useRef({ x: 0, y: 0 })
  const dragRef = useRef({ dragging: false, offsetX: 0, offsetY: 0 })
  const mouseRelRef = useRef(0.3)
  const rafRef = useRef(0)
  const bgCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const bgCtxRef = useRef<CanvasRenderingContext2D | null>(null)
  const needsRender = useRef(true)

  const heroImgRef = useRef<HTMLImageElement | null>(null)

  const captureBackground = useCallback(() => {
    const bgCanvas = bgCanvasRef.current
    const bgCtx = bgCtxRef.current
    if (!bgCanvas || !bgCtx) return

    const vw = window.innerWidth
    const vh = window.innerHeight
    bgCanvas.width = vw
    bgCanvas.height = vh

    bgCtx.fillStyle = '#0a0e1a'
    bgCtx.fillRect(0, 0, vw, vh)

    const img = heroImgRef.current
    if (img && img.complete && img.naturalWidth > 0) {
      const imgRatio = img.naturalWidth / img.naturalHeight
      const vpRatio = vw / vh
      let drawW: number, drawH: number, drawX: number, drawY: number

      if (imgRatio > vpRatio) {
        drawH = vh
        drawW = vh * imgRatio
        drawX = (vw - drawW) / 2
        drawY = 0
      } else {
        drawW = vw
        drawH = vw / imgRatio
        drawX = 0
        drawY = 0
      }

      bgCtx.drawImage(img, drawX, drawY + window.scrollY * -1, drawW, drawH)

      const grad = bgCtx.createLinearGradient(0, 0, 0, vh)
      grad.addColorStop(0, 'rgba(10,14,26,0)')
      grad.addColorStop(0.5, 'rgba(10,14,26,0.4)')
      grad.addColorStop(1, 'rgba(10,14,26,1)')
      bgCtx.fillStyle = grad
      bgCtx.fillRect(0, 0, vw, vh)
    }
  }, [])

  const render = useCallback(() => {
    const canvas = canvasRef.current
    const bgCanvas = bgCanvasRef.current
    const bgCtx = bgCtxRef.current
    if (!canvas || !bgCanvas || !bgCtx) return

    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    if (!ctx) return

    const pos = posRef.current

    let srcData: Uint8ClampedArray
    try {
      const imgData = bgCtx.getImageData(0, 0, bgCanvas.width, bgCanvas.height)
      srcData = imgData.data
    } catch {
      return
    }

    const dstImageData = ctx.createImageData(W, H)
    refract(
      srcData, bgCanvas.width, bgCanvas.height,
      dstImageData.data, W, H,
      pos.x, pos.y,
      mouseRelRef.current,
    )
    ctx.putImageData(dstImageData, 0, 0)
  }, [])

  const scheduleRender = useCallback(() => {
    if (!needsRender.current) {
      needsRender.current = true
      rafRef.current = requestAnimationFrame(() => {
        needsRender.current = false
        render()
      })
    }
  }, [render])

  useEffect(() => {
    const bgCanvas = document.createElement('canvas')
    bgCanvasRef.current = bgCanvas
    bgCtxRef.current = bgCanvas.getContext('2d', { willReadFrequently: true })

    const startX = Math.round(window.innerWidth / 2 + 120 - W / 2)
    const startY = Math.round(window.innerHeight / 2 - H / 2)
    posRef.current = { x: startX, y: startY }

    if (wrapRef.current) {
      wrapRef.current.style.left = startX + 'px'
      wrapRef.current.style.top = startY + 'px'
    }

    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.src = '/images/hero-bg.jpg'
    img.onload = () => {
      heroImgRef.current = img
      captureBackground()
      scheduleRender()
    }

    const onScroll = () => {
      captureBackground()
      scheduleRender()
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll, { passive: true })

    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      cancelAnimationFrame(rafRef.current)
    }
  }, [captureBackground, scheduleRender])

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (dragRef.current.dragging) return
      const bottleCx = posRef.current.x + W / 2
      mouseRelRef.current = Math.max(-1, Math.min(1,
        (e.clientX - bottleCx) / (window.innerWidth / 2)
      ))
      scheduleRender()
    }
    window.addEventListener('mousemove', onMouseMove, { passive: true })
    return () => window.removeEventListener('mousemove', onMouseMove)
  }, [scheduleRender])

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

    const bottleCx = nx + W / 2
    mouseRelRef.current = Math.max(-1, Math.min(1,
      (e.clientX - bottleCx) / (window.innerWidth / 2)
    ))

    captureBackground()
    scheduleRender()
  }, [captureBackground, scheduleRender])

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
      <canvas
        ref={canvasRef}
        width={W}
        height={H}
        style={{ width: W, height: H, display: 'block' }}
      />
    </div>
  )
}
