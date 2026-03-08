'use client'

import React, { useEffect, useRef, useState } from 'react'

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
  const cy = height / 2
  const maxR = Math.max(cx, cy)

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4

      const dx = (x - cx) / cx
      const dy = (y - cy) / cy

      const distFromCenter = Math.sqrt(dx * dx + dy * dy)

      const nx = dx * 0.5
      const ny = dy * 0.3

      const edgeFactor = Math.pow(Math.abs(dx), 2.5)
      const bezel = Math.min(edgeFactor * 1.8, 1.0)

      const refractX = nx * bezel * 0.7
      const refractY = ny * bezel * 0.3

      data[idx] = Math.round(128 + refractX * 127)
      data[idx + 1] = Math.round(128 + refractY * 127)
      data[idx + 2] = 128
      data[idx + 3] = 255
    }
  }

  ctx.putImageData(imageData, 0, 0)
  return canvas.toDataURL()
}

function generateSpecularMap(width: number, height: number): string {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')!

  ctx.clearRect(0, 0, width, height)

  const cx = width / 2

  const leftHighlight = ctx.createLinearGradient(0, 0, width * 0.3, 0)
  leftHighlight.addColorStop(0, 'rgba(255,255,255,0)')
  leftHighlight.addColorStop(0.3, 'rgba(255,255,255,0.08)')
  leftHighlight.addColorStop(0.6, 'rgba(255,255,255,0.15)')
  leftHighlight.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = leftHighlight
  ctx.fillRect(0, 0, width * 0.4, height)

  const rightEdge = ctx.createLinearGradient(width * 0.75, 0, width, 0)
  rightEdge.addColorStop(0, 'rgba(255,255,255,0)')
  rightEdge.addColorStop(0.5, 'rgba(255,255,255,0.04)')
  rightEdge.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = rightEdge
  ctx.fillRect(width * 0.7, 0, width * 0.3, height)

  const topSpec = ctx.createRadialGradient(cx - 10, height * 0.15, 0, cx - 10, height * 0.15, width * 0.25)
  topSpec.addColorStop(0, 'rgba(200,230,255,0.2)')
  topSpec.addColorStop(0.5, 'rgba(200,230,255,0.05)')
  topSpec.addColorStop(1, 'rgba(200,230,255,0)')
  ctx.fillStyle = topSpec
  ctx.fillRect(0, 0, width, height * 0.4)

  return canvas.toDataURL()
}

export function GlassBottle() {
  const filterId = 'bottle-refraction'
  const [mapUrl, setMapUrl] = useState('')
  const [specUrl, setSpecUrl] = useState('')

  useEffect(() => {
    setMapUrl(generateDisplacementMap(BOTTLE_WIDTH, BOTTLE_HEIGHT))
    setSpecUrl(generateSpecularMap(BOTTLE_WIDTH, BOTTLE_HEIGHT))
  }, [])

  return (
    <>
      <svg width="0" height="0" style={{ position: 'absolute' }}>
        <defs>
          <clipPath id="bottle-clip" clipPathUnits="objectBoundingBox">
            {/* Cork/cap */}
            <rect x="0.38" y="0" width="0.24" height="0.04" rx="0.02" />
            {/* Neck ring */}
            <rect x="0.34" y="0.035" width="0.32" height="0.025" rx="0.01" />
            {/* Upper neck */}
            <rect x="0.37" y="0.055" width="0.26" height="0.06" rx="0.02" />
            {/* Neck taper — thin */}
            <rect x="0.36" y="0.11" width="0.28" height="0.04" rx="0.02" />
            {/* Shoulder taper */}
            <ellipse cx="0.5" cy="0.18" rx="0.2" ry="0.04" />
            <rect x="0.28" y="0.17" width="0.44" height="0.04" rx="0.03" />
            {/* Shoulder widen */}
            <rect x="0.2" y="0.2" width="0.6" height="0.06" rx="0.04" />
            {/* Body */}
            <rect x="0.15" y="0.25" width="0.7" height="0.6" rx="0.06" />
            {/* Bottom taper */}
            <rect x="0.18" y="0.83" width="0.64" height="0.06" rx="0.04" />
            {/* Base */}
            <rect x="0.2" y="0.88" width="0.6" height="0.08" rx="0.04" />
            {/* Very bottom */}
            <rect x="0.22" y="0.95" width="0.56" height="0.05" rx="0.03" />
          </clipPath>

          {mapUrl && (
            <filter id={filterId} colorInterpolationFilters="sRGB"
              x="0" y="0" width="100%" height="100%">
              <feImage href={mapUrl} x="0" y="0" width={BOTTLE_WIDTH} height={BOTTLE_HEIGHT} result="dispMap" />
              <feDisplacementMap
                in="SourceGraphic"
                in2="dispMap"
                scale="18"
                xChannelSelector="R"
                yChannelSelector="G"
              />
            </filter>
          )}
        </defs>
      </svg>

      <div className="glass-bottle" aria-hidden="true">
        <div className="glass-bottle__refract" style={{
          clipPath: 'url(#bottle-clip)',
          backdropFilter: mapUrl ? `url(#${filterId})` : 'blur(8px)',
          WebkitBackdropFilter: mapUrl ? `url(#${filterId})` : 'blur(8px)',
        }} />

        <div className="glass-bottle__blur" style={{
          clipPath: 'url(#bottle-clip)',
        }} />

        {specUrl && (
          <div className="glass-bottle__specular" style={{
            clipPath: 'url(#bottle-clip)',
            backgroundImage: `url(${specUrl})`,
            backgroundSize: '100% 100%',
          }} />
        )}

        <div className="glass-bottle__edge" style={{
          clipPath: 'url(#bottle-clip)',
        }} />
      </div>
    </>
  )
}
